/**
 * Server functions for the investment account allocation data layer.
 *
 * getAllocations — fetch all non-Chequing accounts with their allocation fields
 * setAllocation  — upsert allocation on a single account; validates sum === 100
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "#/db";
import { AccountType } from "#/generated/prisma/enums";

// ─── Input Schemas ────────────────────────────────────────────────────────────

const SetAllocationInput = z
  .object({
    accountId: z.number().int().positive(),
    equityPct: z.number().min(0).max(100),
    fixedIncomePct: z.number().min(0).max(100),
    cashPct: z.number().min(0).max(100),
  })
  .refine((d) => Math.round(d.equityPct + d.fixedIncomePct + d.cashPct) === 100, {
    message: "Allocation percentages must sum to 100",
  });

// ─── Server Functions ─────────────────────────────────────────────────────────

/**
 * Fetch all non-Chequing accounts with owner info and their current allocation.
 * Ordered by owner sort order then account name — same ordering as the accounts table.
 */
export const getAllocations = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return prisma.account.findMany({
      where: { type: { not: AccountType.CHEQUING } },
      include: {
        owner: true,
        snapshots: { orderBy: { date: "desc" }, take: 1 },
      },
      orderBy: [{ owner: { sortOrder: "asc" } }, { name: "asc" }],
    });
  } catch (err) {
    throw new Error(`Failed to fetch allocations: ${(err as Error).message}`);
  }
});

/**
 * Save (upsert) the allocation for a single account.
 * Rejects inputs where equityPct + fixedIncomePct + cashPct ≠ 100.
 */
export const setAllocation = createServerFn({ method: "POST" })
  .inputValidator(SetAllocationInput.parse)
  .handler(async ({ data }) => {
    try {
      return prisma.account.update({
        where: { id: data.accountId },
        data: {
          equityPct: data.equityPct,
          fixedIncomePct: data.fixedIncomePct,
          cashPct: data.cashPct,
        },
      });
    } catch (err) {
      throw new Error(`Failed to save allocation: ${(err as Error).message}`);
    }
  });
