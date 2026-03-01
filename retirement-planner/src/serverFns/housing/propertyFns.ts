import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "#/db";

const SECTION_ACCENT = "var(--section-housing)";

const IdInput = z.object({ id: z.number().int().positive() });

export const CreatePropertyInput = z.object({
  name: z.string().min(1),
  estimatedValue: z.number().min(0),
  mortgageBalance: z.number().min(0),
  mortgageRate: z.number().min(0).max(30).nullable(),
});

export const UpdatePropertyInput = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  estimatedValue: z.number().min(0),
  mortgageBalance: z.number().min(0),
  mortgageRate: z.number().min(0).max(30).nullable(),
});

export const getProperties = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.property.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
});

export const createProperty = createServerFn({ method: "POST" })
  .inputValidator(CreatePropertyInput.parse)
  .handler(async ({ data }) => {
    const maxSort = await prisma.property.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSort._max.sortOrder ?? 0) + 1;
    return prisma.property.create({
      data: {
        name: data.name,
        estimatedValue: data.estimatedValue,
        mortgageBalance: data.mortgageBalance,
        mortgageRate: data.mortgageRate,
        sortOrder,
      },
    });
  });

export const updateProperty = createServerFn({ method: "POST" })
  .inputValidator(UpdatePropertyInput.parse)
  .handler(async ({ data }) => {
    return prisma.property.update({
      where: { id: data.id },
      data: {
        name: data.name,
        estimatedValue: data.estimatedValue,
        mortgageBalance: data.mortgageBalance,
        mortgageRate: data.mortgageRate,
      },
    });
  });

export const deleteProperty = createServerFn({ method: "POST" })
  .inputValidator(IdInput.parse)
  .handler(async ({ data }) => {
    return prisma.property.delete({ where: { id: data.id } });
  });

export { SECTION_ACCENT };
