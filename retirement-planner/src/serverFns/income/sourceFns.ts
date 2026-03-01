import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "#/db";
import { IncomeFrequency } from "#/generated/prisma/enums";

const SECTION_ACCENT = "var(--section-income)";

const IdInput = z.object({ id: z.number().int().positive() });

export const CreateIncomeSourceInput = z.object({
  name: z.string().min(1),
  ownerId: z.number().int().positive(),
  amount: z.number().min(0),
  frequency: z.nativeEnum(IncomeFrequency),
});

export const UpdateIncomeSourceInput = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  ownerId: z.number().int().positive(),
  amount: z.number().min(0),
  frequency: z.nativeEnum(IncomeFrequency),
});

export type Person = Awaited<ReturnType<typeof prisma.person.findMany>>[number];

export type PensionProjectionWithoutBirthYear = {
  person: Person;
  hasBirthYear: false;
};

export type PensionProjectionWithBirthYear = {
  person: Person;
  hasBirthYear: true;
  age: number;
  claimAge: number;
  claimYear: number;
  yearsUntilClaim: number;
  isOver65: boolean;
  isOver75: boolean;
  cpp: {
    monthly: number;
    annual: number;
  };
  oas: {
    monthly: number;
    annual: number;
    residenceYears: number;
    residenceFraction: number;
  };
};

export type PensionProjection = PensionProjectionWithoutBirthYear | PensionProjectionWithBirthYear;

export const getPeople = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.person.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
});

export const getIncomeSources = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.incomeSource.findMany({
    include: { owner: true },
    orderBy: [{ owner: { sortOrder: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
});

export const createIncomeSource = createServerFn({ method: "POST" })
  .inputValidator(CreateIncomeSourceInput.parse)
  .handler(async ({ data }) => {
    const maxSort = await prisma.incomeSource.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;
    return prisma.incomeSource.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        amount: data.amount,
        frequency: data.frequency,
        sortOrder,
      },
      include: { owner: true },
    });
  });

export const updateIncomeSource = createServerFn({ method: "POST" })
  .inputValidator(UpdateIncomeSourceInput.parse)
  .handler(async ({ data }) => {
    return prisma.incomeSource.update({
      where: { id: data.id },
      data: {
        name: data.name,
        ownerId: data.ownerId,
        amount: data.amount,
        frequency: data.frequency,
      },
      include: { owner: true },
    });
  });

export const deleteIncomeSource = createServerFn({ method: "POST" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    return prisma.incomeSource.delete({ where: { id: data.id } });
  });

export const getPensionProjections = createServerFn({ method: "GET" }).handler(async (): Promise<PensionProjection[]> => {
  const people = await prisma.person.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const currentYear = new Date().getFullYear();

  return people.map((person): PensionProjection => {
    if (!person.birthYear) {
      return {
        person,
        hasBirthYear: false,
      };
    }

    const claimAge = person.pensionClaimAge ?? 65;
    const age = currentYear - person.birthYear;
    const claimYear = person.birthYear + claimAge;
    const yearsUntilClaim = Math.max(0, claimAge - age);
    const isOver65 = age >= 65;
    const isOver75 = age >= 75;

    const cppMaxAt65 = 1507.65;
    const cppEstimateMultiplier = 0.7;
    const cppEstimatedAt65 = cppMaxAt65 * cppEstimateMultiplier;

    let cppMonthly = cppEstimatedAt65;
    if (claimAge < 65) {
      const monthsEarly = (65 - claimAge) * 12;
      const reduction = monthsEarly * 0.006;
      cppMonthly = cppEstimatedAt65 * (1 - reduction);
    } else if (claimAge > 65) {
      const monthsLate = (claimAge - 65) * 12;
      const increase = monthsLate * 0.007;
      cppMonthly = cppEstimatedAt65 * (1 + increase);
    }

    const oasMaxAt65to74 = 742.31;
    const oasMaxAt75plus = 816.54;
    const residenceYears = person.oasResidenceYears ?? 40;
    const residenceFraction = Math.min(residenceYears / 40, 1);

    let oasMonthly: number;
    if (isOver75) {
      oasMonthly = oasMaxAt75plus * residenceFraction;
    } else if (claimAge >= 75) {
      oasMonthly = oasMaxAt75plus * residenceFraction;
    } else {
      oasMonthly = oasMaxAt65to74 * residenceFraction;
    }

    return {
      person,
      hasBirthYear: true,
      age,
      claimAge,
      claimYear,
      yearsUntilClaim,
      isOver65,
      isOver75,
      cpp: {
        monthly: Math.round(cppMonthly * 100) / 100,
        annual: Math.round(cppMonthly * 12 * 100) / 100,
      },
      oas: {
        monthly: Math.round(oasMonthly * 100) / 100,
        annual: Math.round(oasMonthly * 12 * 100) / 100,
        residenceYears,
        residenceFraction,
      },
    };
  });
});

export { SECTION_ACCENT };
