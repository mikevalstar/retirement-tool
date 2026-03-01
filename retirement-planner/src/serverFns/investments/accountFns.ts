/**
 * Server functions for the investment accounts data layer.
 *
 * Three logical groups:
 *   Account        — full CRUD (create includes optional initial snapshot)
 *   BalanceSnapshot — create / delete only (no update; delete and re-add to correct)
 *   ReturnEntry     — create / delete only (same policy as snapshots)
 *
 * "Current balance" is always the snapshot with the most recent `date` field,
 * regardless of insertion order.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "#/db";
import { AccountType } from "#/generated/prisma/enums";

// ─── Input Schemas ────────────────────────────────────────────────────────────

const IdInput = z.object({ id: z.number().int().positive() });
const AccountIdInput = z.object({ accountId: z.number().int().positive() });

export const CreateAccountInput = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AccountType),
  ownerId: z.number().int().positive(),
  initialBalance: z.number().optional(),
  initialDate: z.string().optional(),
});

export const UpdateAccountInput = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  type: z.nativeEnum(AccountType),
  ownerId: z.number().int().positive(),
});

export const CreateSnapshotInput = z.object({
  accountId: z.number().int().positive(),
  date: z.string().min(1),
  balance: z.number(),
  note: z.string().optional(),
});

export const CreateBulkSnapshotsInput = z.object({
  date: z.string().min(1),
  entries: z.array(z.object({ accountId: z.number().int().positive(), balance: z.number() })),
});

export const CreateReturnInput = z.object({
  accountId: z.number().int().positive(),
  year: z.number().int(),
  returnPercent: z.number(),
});

// ─── People (for owner dropdown) ──────────────────────────────────────────────

export const getPeople = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.person.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
});

// ─── Account ──────────────────────────────────────────────────────────────────

/**
 * Fetch all accounts with owner name, most recent balance snapshot, and most
 * recent return entry — everything needed to render the accounts table.
 * Ordered by owner sort order then account name.
 */
export const getAccounts = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.account.findMany({
    include: {
      owner: true,
      // Most recent snapshot by date — this is the "current balance"
      snapshots: { orderBy: { date: "desc" }, take: 1 },
      // Most recent return year — shown in the accounts table
      returns: { orderBy: { year: "desc" }, take: 1 },
    },
    orderBy: [{ owner: { sortOrder: "asc" } }, { name: "asc" }],
  });
});

/**
 * Fetch all snapshots for a single account, newest date first.
 * Used when expanding an account row to show balance history.
 */
export const getSnapshots = createServerFn({ method: "GET" })
  .inputValidator(AccountIdInput.parse)
  .handler(async ({ data }) => {
    return prisma.balanceSnapshot.findMany({
      where: { accountId: data.accountId },
      orderBy: { date: "desc" },
    });
  });

/**
 * Fetch all return entries for a single account, newest year first.
 * Used when expanding an account row to show return history.
 */
export const getReturns = createServerFn({ method: "GET" })
  .inputValidator(AccountIdInput.parse)
  .handler(async ({ data }) => {
    return prisma.returnEntry.findMany({
      where: { accountId: data.accountId },
      orderBy: { year: "desc" },
    });
  });

/**
 * Create a new account. If initialBalance is provided, also creates the first
 * BalanceSnapshot in the same transaction so the account appears with a balance
 * immediately after being added.
 */
export const createAccount = createServerFn({ method: "POST" })
  .inputValidator(CreateAccountInput.parse)
  .handler(async ({ data }) => {
    return prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: { name: data.name, type: data.type, ownerId: data.ownerId },
      });

      if (data.initialBalance !== undefined && data.initialDate) {
        await tx.balanceSnapshot.create({
          data: {
            accountId: account.id,
            date: new Date(data.initialDate),
            balance: data.initialBalance,
          },
        });
      }

      return account;
    });
  });

/** Update mutable account fields (name, type, owner). */
export const updateAccount = createServerFn({ method: "POST" })
  .inputValidator(UpdateAccountInput.parse)
  .handler(async ({ data }) => {
    return prisma.account.update({
      where: { id: data.id },
      data: { name: data.name, type: data.type, ownerId: data.ownerId },
    });
  });

/**
 * Delete an account and all its snapshots and return entries.
 * Cascade is configured in the schema — no manual cleanup needed.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    return prisma.account.delete({ where: { id: data.id } });
  });

// ─── Balance Snapshots ────────────────────────────────────────────────────────

/** Add a dated balance snapshot to an account. */
export const createSnapshot = createServerFn({ method: "POST" })
  .inputValidator(CreateSnapshotInput.parse)
  .handler(async ({ data }) => {
    return prisma.balanceSnapshot.create({
      data: {
        accountId: data.accountId,
        date: new Date(data.date),
        balance: data.balance,
        note: data.note,
      },
    });
  });

/** Delete a single snapshot by id. No confirmation — UI handles that. */
export const deleteSnapshot = createServerFn({ method: "POST" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    return prisma.balanceSnapshot.delete({ where: { id: data.id } });
  });

/**
 * Monthly bulk update: create balance snapshots for multiple accounts in one
 * call. All snapshots share the same date. Entries with no balance are skipped
 * by the caller — this function receives only accounts that have a value.
 *
 * Calls createSnapshot in a loop to keep the logic in one place.
 */
export const createBulkSnapshots = createServerFn({ method: "POST" })
  .inputValidator(CreateBulkSnapshotsInput.parse)
  .handler(async ({ data }) => {
    for (const entry of data.entries) {
      await createSnapshot({
        data: {
          accountId: entry.accountId,
          date: data.date,
          balance: entry.balance,
        },
      });
    }
  });

// ─── Return Entries ───────────────────────────────────────────────────────────

/**
 * Add an annual return entry for an account.
 * Fails if an entry for that year already exists (unique constraint on accountId + year).
 * The UI should delete the existing row before allowing re-entry.
 */
export const createReturn = createServerFn({ method: "POST" })
  .inputValidator(CreateReturnInput.parse)
  .handler(async ({ data }) => {
    return prisma.returnEntry.create({
      data: {
        accountId: data.accountId,
        year: data.year,
        returnPercent: data.returnPercent,
      },
    });
  });

/** Delete a single return entry by id. */
export const deleteReturn = createServerFn({ method: "POST" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    return prisma.returnEntry.delete({ where: { id: data.id } });
  });
