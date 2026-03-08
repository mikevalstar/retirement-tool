import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "#/db";

export const SECTION_ACCENT = "var(--section-simulation)";

// ─── Schema ───────────────────────────────────────────────────────────────────

export const SimulationSettingsInput = z.object({
  equityReturn: z.number().min(-50).max(50),
  equityStdDev: z.number().min(0).max(100),
  fixedReturn: z.number().min(-50).max(50),
  fixedStdDev: z.number().min(0).max(100),
  cashReturn: z.number().min(-50).max(50),
  cashStdDev: z.number().min(0).max(100),
  cppBaseMultiplier: z.number().min(0.1).max(1.0),
  numRuns: z.number().int().min(500).max(5000),
});

export type SimulationSettingsData = z.infer<typeof SimulationSettingsInput>;

const DEFAULTS: SimulationSettingsData = {
  equityReturn: 7.0,
  equityStdDev: 15.0,
  fixedReturn: 3.5,
  fixedStdDev: 6.0,
  cashReturn: 2.0,
  cashStdDev: 1.0,
  cppBaseMultiplier: 0.7,
  numRuns: 1000,
};

// ─── Server functions ─────────────────────────────────────────────────────────

export const getSimulationSettings = createServerFn({ method: "GET" }).handler(async () => {
  const existing = await prisma.simulationSettings.findFirst();
  if (existing) return existing;
  // Seed defaults on first visit
  return prisma.simulationSettings.create({ data: DEFAULTS });
});

export const upsertSimulationSettings = createServerFn({ method: "POST" })
  .inputValidator(SimulationSettingsInput.parse)
  .handler(async ({ data }) => {
    try {
      const existing = await prisma.simulationSettings.findFirst();
      if (existing) {
        return prisma.simulationSettings.update({ where: { id: existing.id }, data });
      }
      return prisma.simulationSettings.create({ data });
    } catch (err) {
      throw new Error(`Failed to save settings: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
