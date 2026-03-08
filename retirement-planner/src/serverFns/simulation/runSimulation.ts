import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "#/db";
import type { SimulationSettingsData } from "./settingsFns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CrashProfile = "mild" | "severe" | "catastrophic";
export type SimulationMode = "standard" | "stress";

export type CppOasAmount = {
  personName: string;
  cppMonthly: number;
  oasMonthly: number;
  cppClaimAge: number;
  oasClaimAge: number;
  cppClaimYear: number;
  oasClaimYear: number;
};

export type SimulationResultsJson = {
  runAt: string;
  scenarioName: string;
  mode: SimulationMode;
  crashProfile?: CrashProfile;
  settingsSnapshot: SimulationSettingsData;
  startingPortfolio: number;
  retirementYear: number;
  planningEndYear: number;
  years: number[];
  p10: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p90: number[];
  successRate: number; // 0–100
  medianDepletionYear: number | null;
  usingFallbackGlidePath: boolean;
  milestones: Array<{ year: number; label: string }>;
  cppOasAmounts: CppOasAmount[];
  spendingPhases: Array<{ name: string; startYear: number; monthlyTodayDollars: number }>;
};

// ─── Input ────────────────────────────────────────────────────────────────────

const RunSimulationInput = z.object({
  scenarioId: z.number().int().positive(),
  mode: z.enum(["standard", "stress"]),
  crashProfile: z.enum(["mild", "severe", "catastrophic"]).optional(),
});

// ─── Crash profiles ───────────────────────────────────────────────────────────

const CRASH_PROFILES: Record<CrashProfile, { probability: number; minReturn: number; maxReturn: number }> = {
  mild: { probability: 0.15, minReturn: -0.4, maxReturn: -0.2 },
  severe: { probability: 0.07, minReturn: -0.6, maxReturn: -0.35 },
  catastrophic: { probability: 0.03, minReturn: -0.85, maxReturn: -0.55 },
};

// ─── Math helpers ─────────────────────────────────────────────────────────────

function boxMuller(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Returns a decimal return (e.g. 0.07 for 7%).
// Lognormal parameterized so E[annual return] = expectedReturnPct / 100.
function lognormalDraw(expectedReturnPct: number, stdDevPct: number): number {
  const mu = expectedReturnPct / 100;
  const sigma = stdDevPct / 100;
  const sigmaN = Math.sqrt(Math.log(1 + (sigma / (1 + mu)) ** 2));
  const muN = Math.log(1 + mu) - (sigmaN * sigmaN) / 2;
  return Math.exp(muN + sigmaN * boxMuller()) - 1;
}

function percentileFromSorted(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (idx - lower) * (sorted[upper] - sorted[lower]);
}

type Allocation = { equityPct: number; fixedIncomePct: number; cashPct: number };

function getGlidePathAllocation(year: number, waypoints: Array<{ year: number; equityPct: number; fixedIncomePct: number; cashPct: number }>): Allocation {
  const sorted = [...waypoints].sort((a, b) => a.year - b.year);
  if (year <= sorted[0].year) return { equityPct: sorted[0].equityPct, fixedIncomePct: sorted[0].fixedIncomePct, cashPct: sorted[0].cashPct };
  const last = sorted[sorted.length - 1];
  if (year >= last.year) return { equityPct: last.equityPct, fixedIncomePct: last.fixedIncomePct, cashPct: last.cashPct };

  let before = sorted[0];
  let after = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].year <= year && sorted[i + 1].year >= year) {
      before = sorted[i];
      after = sorted[i + 1];
      break;
    }
  }
  const t = (year - before.year) / (after.year - before.year);
  return {
    equityPct: before.equityPct + t * (after.equityPct - before.equityPct),
    fixedIncomePct: before.fixedIncomePct + t * (after.fixedIncomePct - before.fixedIncomePct),
    cashPct: before.cashPct + t * (after.cashPct - before.cashPct),
  };
}

function getFallbackAllocation(year: number, retirementYear: number, planningEndYear: number): Allocation {
  if (year < retirementYear) return { equityPct: 100, fixedIncomePct: 0, cashPct: 0 };
  const span = Math.max(1, planningEndYear - retirementYear);
  const t = Math.min(1, (year - retirementYear) / span);
  const equityPct = 60 - t * 30; // 60% → 30%
  const cashPct = t * 10; // 0% → 10%
  const fixedIncomePct = 100 - equityPct - cashPct;
  return { equityPct, fixedIncomePct, cashPct };
}

function drawAnnualReturn(allocation: Allocation, settings: SimulationSettingsData, mode: SimulationMode, crashProfile?: CrashProfile): number {
  if (mode === "stress" && crashProfile) {
    const profile = CRASH_PROFILES[crashProfile];
    if (Math.random() < profile.probability) {
      // Crash: market-exposed portion takes the hit; cash is unaffected
      const marketExposure = (allocation.equityPct + allocation.fixedIncomePct) / 100;
      const crashReturn = profile.minReturn + Math.random() * (profile.maxReturn - profile.minReturn);
      return crashReturn * marketExposure;
    }
  }

  const equityReturn = lognormalDraw(settings.equityReturn, settings.equityStdDev);
  const fixedReturn = lognormalDraw(settings.fixedReturn, settings.fixedStdDev);
  const cashReturn = lognormalDraw(settings.cashReturn, settings.cashStdDev);

  return (allocation.equityPct / 100) * equityReturn + (allocation.fixedIncomePct / 100) * fixedReturn + (allocation.cashPct / 100) * cashReturn;
}

function getContributionForYear(contributions: Array<{ year: number; annualAmount: number }>, year: number, retirementYear: number): number {
  if (year >= retirementYear) return 0;
  const applicable = contributions.filter((c) => c.year <= year);
  if (applicable.length === 0) return 0;
  return applicable.reduce((latest, c) => (c.year > latest.year ? c : latest)).annualAmount;
}

function getSpendingForYear(
  phases: Array<{ startYear: number; monthlyAmount: number }>,
  year: number,
  retirementYear: number,
  inflationRate: number,
  currentYear: number,
): number {
  if (year < retirementYear) return 0;
  const applicable = phases.filter((p) => p.startYear <= year);
  if (applicable.length === 0) return 0;
  const phase = applicable.reduce((latest, p) => (p.startYear > latest.startYear ? p : latest));
  const inflationFactor = (1 + inflationRate / 100) ** (year - currentYear);
  return phase.monthlyAmount * 12 * inflationFactor;
}

// ─── CPP/OAS calculation ──────────────────────────────────────────────────────

function calcCppOas(
  personName: string,
  birthYear: number,
  residenceYears: number,
  cppClaimAge: number,
  oasClaimAge: number,
  cppBaseMultiplier: number,
): CppOasAmount & { cppAnnual: number; oasAnnual: number } {
  const cppBase65 = 1507.65 * cppBaseMultiplier;
  let cppMonthly = cppBase65;
  if (cppClaimAge < 65) cppMonthly = cppBase65 * (1 - (65 - cppClaimAge) * 12 * 0.006);
  else if (cppClaimAge > 65) cppMonthly = cppBase65 * (1 + (cppClaimAge - 65) * 12 * 0.007);
  cppMonthly = Math.max(0, cppMonthly);

  const oasBase = oasClaimAge >= 75 ? 816.54 : 742.31;
  const residenceFrac = Math.min(residenceYears, 40) / 40;
  let oasMonthly = oasBase * residenceFrac;
  if (oasClaimAge > 65) oasMonthly *= 1 + (oasClaimAge - 65) * 12 * 0.006;
  oasMonthly = Math.max(0, oasMonthly);

  return {
    personName,
    cppMonthly: Math.round(cppMonthly * 100) / 100,
    oasMonthly: Math.round(oasMonthly * 100) / 100,
    cppClaimAge,
    oasClaimAge,
    cppClaimYear: birthYear + cppClaimAge,
    oasClaimYear: birthYear + oasClaimAge,
    cppAnnual: Math.round(cppMonthly * 12 * 100) / 100,
    oasAnnual: Math.round(oasMonthly * 12 * 100) / 100,
  };
}

// ─── Server function ──────────────────────────────────────────────────────────

export const runSimulation = createServerFn({ method: "POST" })
  .inputValidator(RunSimulationInput.parse)
  .handler(async ({ data: { scenarioId, mode, crashProfile } }) => {
    try {
      const scenario = await prisma.scenario.findUnique({
        where: { id: scenarioId },
        include: {
          phases: { orderBy: { startYear: "asc" } },
          contributions: { orderBy: { year: "asc" } },
          housingEvents: true,
          cppOasSettings: { include: { person: true } },
        },
      });
      if (!scenario) throw new Error("Scenario not found");
      if (!scenario.retirementYear) throw new Error("Scenario must have a retirement year");
      if (scenario.phases.length === 0) throw new Error("Scenario needs at least one spending phase before running");

      const [accounts, glidePathWaypoints, dbSettings] = await Promise.all([
        prisma.account.findMany({ include: { snapshots: { orderBy: { date: "desc" }, take: 1 } } }),
        prisma.glidePathWaypoint.findMany({ orderBy: { year: "asc" } }),
        prisma.simulationSettings.findFirst(),
      ]);

      const settings: SimulationSettingsData = dbSettings ?? {
        equityReturn: 7.0,
        equityStdDev: 15.0,
        fixedReturn: 3.5,
        fixedStdDev: 6.0,
        cashReturn: 2.0,
        cashStdDev: 1.0,
        cppBaseMultiplier: 0.7,
        numRuns: 1000,
      };

      const startingPortfolio = accounts.reduce((sum, a) => sum + (a.snapshots[0]?.balance ?? 0), 0);
      if (startingPortfolio === 0 && accounts.every((a) => a.snapshots.length === 0)) {
        throw new Error("Add at least one account balance before running the simulation");
      }

      const currentYear = new Date().getFullYear();
      const { retirementYear, planningEndYear, inflationRate } = scenario;
      const usingFallbackGlidePath = glidePathWaypoints.length === 0;

      // Pre-compute CPP/OAS benefit amounts per person
      const cppOasCalcs = scenario.cppOasSettings
        .map((s) =>
          s.person.birthYear
            ? calcCppOas(s.person.name, s.person.birthYear, s.person.oasResidenceYears ?? 40, s.cppClaimAge, s.oasClaimAge, settings.cppBaseMultiplier)
            : null,
        )
        .filter(Boolean) as Array<CppOasAmount & { cppAnnual: number; oasAnnual: number }>;

      // (Employment income is not added to the portfolio — scenario contributions
      // represent the savings from income that flows into investments each year.)

      // Housing proceeds by year
      const housingProceedsMap = new Map<number, number>();
      for (const ev of scenario.housingEvents) {
        if (ev.saleYear >= currentYear && ev.saleYear <= planningEndYear) {
          housingProceedsMap.set(ev.saleYear, (housingProceedsMap.get(ev.saleYear) ?? 0) + ev.netProceeds);
        }
      }

      // Year array
      const years: number[] = [];
      for (let y = currentYear; y <= planningEndYear; y++) years.push(y);
      const numYears = years.length;

      // Run N simulations
      const numRuns = settings.numRuns;
      const allRuns: number[][] = [];

      for (let run = 0; run < numRuns; run++) {
        let portfolio = startingPortfolio;
        const runValues: number[] = [];

        for (let yi = 0; yi < numYears; yi++) {
          const year = years[yi];

          // Record portfolio at the START of the year (before any operations).
          // This ensures the reference line at retirementYear marks the transition
          // point — the portfolio is still "pre-spending" at that data point, and
          // the decline segment runs from retirementYear → retirementYear + 1.
          runValues.push(portfolio);

          // Pre-retirement: add annual investment contributions (savings from income)
          // Employment income is NOT added here — contributions already represent
          // the savings portion of income that flows into the portfolio.
          if (year < retirementYear) {
            portfolio += getContributionForYear(scenario.contributions, year, retirementYear);
          }

          // CPP/OAS from each person's claiming year
          for (const c of cppOasCalcs) {
            if (year >= c.cppClaimYear) portfolio += c.cppAnnual;
            if (year >= c.oasClaimYear) portfolio += c.oasAnnual;
          }

          // Housing sale proceeds
          const proceeds = housingProceedsMap.get(year);
          if (proceeds) portfolio += proceeds;

          // Post-retirement: spending
          if (year >= retirementYear) {
            portfolio -= getSpendingForYear(scenario.phases, year, retirementYear, inflationRate, currentYear);
          }

          // Apply return
          const allocation = usingFallbackGlidePath
            ? getFallbackAllocation(year, retirementYear, planningEndYear)
            : getGlidePathAllocation(year, glidePathWaypoints);
          portfolio = portfolio * (1 + drawAnnualReturn(allocation, settings, mode, crashProfile));

          portfolio = Math.max(0, portfolio);
        }

        allRuns.push(runValues);
      }

      // Compute percentile bands
      const p10: number[] = [];
      const p25: number[] = [];
      const p50: number[] = [];
      const p75: number[] = [];
      const p90: number[] = [];

      for (let yi = 0; yi < numYears; yi++) {
        const col = allRuns.map((r) => r[yi]).sort((a, b) => a - b);
        p10.push(Math.round(percentileFromSorted(col, 10)));
        p25.push(Math.round(percentileFromSorted(col, 25)));
        p50.push(Math.round(percentileFromSorted(col, 50)));
        p75.push(Math.round(percentileFromSorted(col, 75)));
        p90.push(Math.round(percentileFromSorted(col, 90)));
      }

      // Success rate
      const lastIdx = numYears - 1;
      const successfulRuns = allRuns.filter((r) => r[lastIdx] > 0).length;
      const successRate = Math.round((successfulRuns / numRuns) * 1000) / 10;

      // Median depletion year
      const depletionYears = allRuns
        .filter((r) => r[lastIdx] === 0)
        .map((r) => {
          const idx = r.indexOf(0);
          return idx >= 0 ? years[idx] : null;
        })
        .filter((y): y is number => y !== null)
        .sort((a, b) => a - b);

      const medianDepletionYear = depletionYears.length > 0 ? depletionYears[Math.floor(depletionYears.length / 2)] : null;

      // Milestone annotations
      const milestones: Array<{ year: number; label: string }> = [{ year: retirementYear, label: "Retirement" }];
      for (const c of cppOasCalcs) {
        if (c.cppClaimYear >= currentYear && c.cppClaimYear <= planningEndYear) {
          milestones.push({ year: c.cppClaimYear, label: `${c.personName} CPP` });
        }
        if (c.oasClaimYear >= currentYear && c.oasClaimYear <= planningEndYear && c.oasClaimYear !== c.cppClaimYear) {
          milestones.push({ year: c.oasClaimYear, label: `${c.personName} OAS` });
        }
      }
      for (const [year] of housingProceedsMap) {
        milestones.push({ year, label: "Housing Sale" });
      }

      const results: SimulationResultsJson = {
        runAt: new Date().toISOString(),
        scenarioName: scenario.name,
        mode,
        crashProfile: mode === "stress" ? crashProfile : undefined,
        settingsSnapshot: settings,
        startingPortfolio,
        retirementYear,
        planningEndYear,
        years,
        p10,
        p25,
        p50,
        p75,
        p90,
        successRate,
        medianDepletionYear,
        usingFallbackGlidePath,
        milestones,
        cppOasAmounts: cppOasCalcs.map(({ personName, cppMonthly, oasMonthly, cppClaimAge, oasClaimAge, cppClaimYear, oasClaimYear }) => ({
          personName,
          cppMonthly,
          oasMonthly,
          cppClaimAge,
          oasClaimAge,
          cppClaimYear,
          oasClaimYear,
        })),
        spendingPhases: scenario.phases.map((p) => ({ name: p.name, startYear: p.startYear, monthlyTodayDollars: p.monthlyAmount })),
      };

      await prisma.scenario.update({
        where: { id: scenarioId },
        data: { simulationResultsJson: JSON.stringify(results) },
      });

      return results;
    } catch (err) {
      throw new Error(`Simulation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

export const SECTION_ACCENT = "var(--section-simulation)";

// Thin wrapper used by the results page to re-fetch results without re-running
export const getScenariosWithResults = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.scenario.findMany({
    select: { id: true, name: true, simulationResultsJson: true },
    orderBy: { name: "asc" },
  });
});

export const getAllScenarios = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.scenario.findMany({
    select: { id: true, name: true, retirementYear: true },
    orderBy: { name: "asc" },
  });
});
