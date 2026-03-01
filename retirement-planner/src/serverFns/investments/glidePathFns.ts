/**
 * Server functions for the glide path data layer.
 *
 * getWaypoints    — fetch all waypoints sorted by year ascending
 * upsertWaypoint  — create or replace waypoint for a year; validates sum === 100
 * deleteWaypoint  — remove a waypoint by id
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "#/db";

// ─── Input Schemas ────────────────────────────────────────────────────────────

const UpsertWaypointInput = z
  .object({
    year: z.number().int().min(1900).max(2200),
    equityPct: z.number().min(0).max(100),
    fixedIncomePct: z.number().min(0).max(100),
    cashPct: z.number().min(0).max(100),
  })
  .refine((d) => Math.round(d.equityPct + d.fixedIncomePct + d.cashPct) === 100, {
    message: "Allocation percentages must sum to 100",
  });

const DeleteWaypointInput = z.object({
  id: z.number().int().positive(),
});

const BatchCreateWaypointsInput = z.object({
  waypoints: z.array(
    z
      .object({
        year: z.number().int().min(1900).max(2200),
        equityPct: z.number().min(0).max(100),
        fixedIncomePct: z.number().min(0).max(100),
        cashPct: z.number().min(0).max(100),
      })
      .refine((d) => Math.round(d.equityPct + d.fixedIncomePct + d.cashPct) === 100, {
        message: "Allocation percentages must sum to 100",
      }),
  ),
});

// ─── Server Functions ─────────────────────────────────────────────────────────

/**
 * Fetch all glide path waypoints sorted by year ascending.
 */
export const getWaypoints = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return prisma.glidePathWaypoint.findMany({
      orderBy: { year: "asc" },
    });
  } catch (err) {
    throw new Error(`Failed to fetch glide path waypoints: ${(err as Error).message}`);
  }
});

/**
 * Create or replace the waypoint for a given year.
 * Uses upsert so an existing record for that year is overwritten.
 * Rejects inputs where equityPct + fixedIncomePct + cashPct ≠ 100.
 */
export const upsertWaypoint = createServerFn({ method: "POST" })
  .inputValidator(UpsertWaypointInput.parse)
  .handler(async ({ data }) => {
    try {
      return prisma.glidePathWaypoint.upsert({
        where: { year: data.year },
        create: {
          year: data.year,
          equityPct: data.equityPct,
          fixedIncomePct: data.fixedIncomePct,
          cashPct: data.cashPct,
        },
        update: {
          equityPct: data.equityPct,
          fixedIncomePct: data.fixedIncomePct,
          cashPct: data.cashPct,
        },
      });
    } catch (err) {
      throw new Error(`Failed to save waypoint: ${(err as Error).message}`);
    }
  });

/**
 * Delete a glide path waypoint by id.
 */
export const deleteWaypoint = createServerFn({ method: "POST" })
  .inputValidator(DeleteWaypointInput.parse)
  .handler(async ({ data }) => {
    try {
      return prisma.glidePathWaypoint.delete({
        where: { id: data.id },
      });
    } catch (err) {
      throw new Error(`Failed to delete waypoint: ${(err as Error).message}`);
    }
  });

/**
 * Fetch all people with their birth years.
 */
export const getPeopleWithBirthYears = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return prisma.person.findMany({
      select: { id: true, name: true, birthYear: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  } catch (err) {
    throw new Error(`Failed to fetch people: ${(err as Error).message}`);
  }
});

/**
 * Batch create waypoints, replacing any existing waypoints for the same years.
 */
export const batchCreateWaypoints = createServerFn({ method: "POST" })
  .inputValidator(BatchCreateWaypointsInput.parse)
  .handler(async ({ data }) => {
    try {
      const years = data.waypoints.map((w) => w.year);

      await prisma.glidePathWaypoint.deleteMany({
        where: { year: { in: years } },
      });

      return prisma.glidePathWaypoint.createMany({
        data: data.waypoints.map((w) => ({
          year: w.year,
          equityPct: w.equityPct,
          fixedIncomePct: w.fixedIncomePct,
          cashPct: w.cashPct,
        })),
      });
    } catch (err) {
      throw new Error(`Failed to create waypoints: ${(err as Error).message}`);
    }
  });
