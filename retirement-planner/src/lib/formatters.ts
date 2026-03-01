import type { AccountType } from "#/generated/prisma/enums";

export const SECTION_ACCENT = "var(--section-investments)";

export const NO_RETURNS_TYPES = new Set<AccountType>(["CHEQUING", "REGULAR_SAVINGS"]);

export const fmtCAD = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const fmtReturn = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
