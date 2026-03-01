import { dayjs } from "./date";

export interface GeneratedWaypoint {
  year: number;
  equityPct: number;
  fixedIncomePct: number;
  cashPct: number;
}

export function calculateEquityPct(age: number): number {
  const equityPct = 115 - age;
  return Math.max(30, Math.min(90, equityPct));
}

export function generateRecommendedGlidePath(birthYear: number, retirementAge: number): GeneratedWaypoint[] {
  const currentYear = dayjs().year();
  const currentAge = currentYear - birthYear;
  const retirementYear = birthYear + retirementAge;

  if (retirementAge < currentAge) {
    throw new Error("Retirement age cannot be less than current age");
  }

  const waypoints: GeneratedWaypoint[] = [];

  const years = [currentYear, retirementYear, retirementYear + 5, retirementYear + 10, retirementYear + 15];

  const uniqueYears = [...new Set(years)].sort((a, b) => a - b);

  const finalAge = 85;
  const finalYear = birthYear + finalAge;
  if (!uniqueYears.includes(finalYear) && finalYear > currentYear) {
    uniqueYears.push(finalYear);
    uniqueYears.sort((a, b) => a - b);
  }

  for (const year of uniqueYears) {
    const age = year - birthYear;
    const equityPct = calculateEquityPct(age);
    const nonEquity = 100 - equityPct;
    const fixedIncomePct = Math.round(nonEquity * 0.6 * 10) / 10;
    const cashPct = Math.round(nonEquity * 0.4 * 10) / 10;

    waypoints.push({
      year,
      equityPct,
      fixedIncomePct,
      cashPct,
    });
  }

  return waypoints;
}

export function getOldestPerson(people: { birthYear: number | null }[]): { birthYear: number } | null {
  const withBirthYear = people.filter((p): p is { birthYear: number } => p.birthYear !== null);
  if (withBirthYear.length === 0) return null;

  return withBirthYear.reduce((oldest, current) => (current.birthYear < oldest.birthYear ? current : oldest));
}
