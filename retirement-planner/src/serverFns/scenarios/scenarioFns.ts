import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "#/db";

export const SECTION_ACCENT = "var(--section-scenarios)";

const IdInput = z.object({ id: z.number().int().positive() });

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const CreateScenarioInput = z.object({
  name: z.string().min(1),
  retirementYear: z.number().int().min(2000).max(2100),
  planningEndYear: z.number().int().min(2000).max(2200),
  inflationRate: z.number().min(0).max(20),
});

export const UpdateScenarioInput = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  retirementYear: z.number().int().min(2000).max(2100),
  planningEndYear: z.number().int().min(2000).max(2200),
  inflationRate: z.number().min(0).max(20),
});

export const UpsertPhaseInput = z.object({
  id: z.number().int().positive().optional(), // omit to create
  scenarioId: z.number().int().positive(),
  name: z.string().min(1),
  startYear: z.number().int().min(2000).max(2200),
  monthlyAmount: z.number().min(0),
  sortOrder: z.number().int().default(0),
});

export const UpsertContributionInput = z.object({
  scenarioId: z.number().int().positive(),
  year: z.number().int().min(2000).max(2100),
  annualAmount: z.number().min(0),
});

export const UpsertCppOasInput = z.object({
  scenarioId: z.number().int().positive(),
  personId: z.number().int().positive(),
  cppClaimAge: z.number().int().min(60).max(70),
  oasClaimAge: z.number().int().min(65).max(70),
});

export const UpsertHousingEventInput = z.object({
  scenarioId: z.number().int().positive(),
  propertyId: z.number().int().positive(),
  saleYear: z.number().int().min(2000).max(2200),
  netProceeds: z.number().min(0),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getScenarios = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.scenario.findMany({
    orderBy: [{ createdAt: "asc" }],
    include: {
      _count: { select: { phases: true } },
    },
  });
});

export const getScenario = createServerFn({ method: "GET" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    const scenario = await prisma.scenario.findUnique({
      where: { id: data.id },
      include: {
        phases: { orderBy: [{ sortOrder: "asc" }, { startYear: "asc" }] },
        contributions: { orderBy: { year: "asc" } },
        housingEvents: { orderBy: { saleYear: "asc" }, include: { property: true } },
        cppOasSettings: { include: { person: true } },
      },
    });
    return scenario;
  });

export const getPeopleAndProperties = createServerFn({ method: "GET" }).handler(async () => {
  const [people, properties] = await Promise.all([
    prisma.person.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.property.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);
  return { people, properties };
});

// ─── Scenario CRUD ────────────────────────────────────────────────────────────

export const createScenario = createServerFn({ method: "POST" })
  .inputValidator(CreateScenarioInput.parse)
  .handler(async ({ data }) => {
    return prisma.scenario.create({
      data: {
        name: data.name,
        retirementYear: data.retirementYear,
        planningEndYear: data.planningEndYear,
        inflationRate: data.inflationRate,
        // Seed with a default Go-Go phase starting at retirement year
        phases: {
          create: {
            name: "Go-Go",
            startYear: data.retirementYear,
            monthlyAmount: 5000,
            sortOrder: 0,
          },
        },
      },
    });
  });

export const updateScenario = createServerFn({ method: "POST" })
  .inputValidator(UpdateScenarioInput.parse)
  .handler(async ({ data }) => {
    return prisma.scenario.update({
      where: { id: data.id },
      data: {
        name: data.name,
        retirementYear: data.retirementYear,
        planningEndYear: data.planningEndYear,
        inflationRate: data.inflationRate,
      },
    });
  });

export const deleteScenario = createServerFn({ method: "POST" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    return prisma.scenario.delete({ where: { id: data.id } });
  });

// ─── Phases ───────────────────────────────────────────────────────────────────

export const upsertPhase = createServerFn({ method: "POST" })
  .inputValidator(UpsertPhaseInput.parse)
  .handler(async ({ data }) => {
    if (data.id) {
      return prisma.scenarioPhase.update({
        where: { id: data.id },
        data: { name: data.name, startYear: data.startYear, monthlyAmount: data.monthlyAmount, sortOrder: data.sortOrder },
      });
    }
    const count = await prisma.scenarioPhase.count({ where: { scenarioId: data.scenarioId } });
    return prisma.scenarioPhase.create({
      data: {
        scenarioId: data.scenarioId,
        name: data.name,
        startYear: data.startYear,
        monthlyAmount: data.monthlyAmount,
        sortOrder: count,
      },
    });
  });

export const deletePhase = createServerFn({ method: "POST" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    return prisma.scenarioPhase.delete({ where: { id: data.id } });
  });

// ─── Contributions ────────────────────────────────────────────────────────────

export const upsertContribution = createServerFn({ method: "POST" })
  .inputValidator(UpsertContributionInput.parse)
  .handler(async ({ data }) => {
    return prisma.scenarioContribution.upsert({
      where: { scenarioId_year: { scenarioId: data.scenarioId, year: data.year } },
      create: { scenarioId: data.scenarioId, year: data.year, annualAmount: data.annualAmount },
      update: { annualAmount: data.annualAmount },
    });
  });

export const deleteContribution = createServerFn({ method: "POST" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    return prisma.scenarioContribution.delete({ where: { id: data.id } });
  });

// ─── CPP/OAS ──────────────────────────────────────────────────────────────────

export const upsertCppOas = createServerFn({ method: "POST" })
  .inputValidator(UpsertCppOasInput.parse)
  .handler(async ({ data }) => {
    return prisma.scenarioCppOas.upsert({
      where: { scenarioId_personId: { scenarioId: data.scenarioId, personId: data.personId } },
      create: { scenarioId: data.scenarioId, personId: data.personId, cppClaimAge: data.cppClaimAge, oasClaimAge: data.oasClaimAge },
      update: { cppClaimAge: data.cppClaimAge, oasClaimAge: data.oasClaimAge },
    });
  });

// ─── Housing Events ───────────────────────────────────────────────────────────

export const upsertHousingEvent = createServerFn({ method: "POST" })
  .inputValidator(UpsertHousingEventInput.parse)
  .handler(async ({ data }) => {
    return prisma.scenarioHousingEvent.upsert({
      where: { scenarioId_propertyId: { scenarioId: data.scenarioId, propertyId: data.propertyId } },
      create: { scenarioId: data.scenarioId, propertyId: data.propertyId, saleYear: data.saleYear, netProceeds: data.netProceeds },
      update: { saleYear: data.saleYear, netProceeds: data.netProceeds },
    });
  });

export const deleteHousingEvent = createServerFn({ method: "POST" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    return prisma.scenarioHousingEvent.delete({ where: { id: data.id } });
  });
