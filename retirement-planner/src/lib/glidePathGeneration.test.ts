import { describe, expect, it, vi } from "vitest";
import { calculateEquityPct, generateRecommendedGlidePath, getOldestPerson } from "./glidePathGeneration";

vi.mock("./date", () => ({
  dayjs: () => ({
    year: () => 2026,
  }),
}));

describe("calculateEquityPct", () => {
  it("returns 90% for age 25", () => {
    expect(calculateEquityPct(25)).toBe(90);
  });

  it("returns 80% for age 35", () => {
    expect(calculateEquityPct(35)).toBe(80);
  });

  it("returns 70% for age 45", () => {
    expect(calculateEquityPct(45)).toBe(70);
  });

  it("returns 60% for age 55", () => {
    expect(calculateEquityPct(55)).toBe(60);
  });

  it("returns 50% for age 65", () => {
    expect(calculateEquityPct(65)).toBe(50);
  });

  it("returns 40% for age 75", () => {
    expect(calculateEquityPct(75)).toBe(40);
  });

  it("returns 30% for age 85 (floor)", () => {
    expect(calculateEquityPct(85)).toBe(30);
  });

  it("returns 30% for age 95 (clamped to floor)", () => {
    expect(calculateEquityPct(95)).toBe(30);
  });

  it("returns 90% for age 20 (clamped to ceiling)", () => {
    expect(calculateEquityPct(20)).toBe(90);
  });
});

describe("generateRecommendedGlidePath", () => {
  it("generates waypoints for a 35-year-old retiring at 65", () => {
    const birthYear = 1991; // age 35 in 2026
    const result = generateRecommendedGlidePath(birthYear, 65);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].year).toBe(2026);
    expect(result.some((w) => w.year === 2056)).toBe(true); // retirement year
  });

  it("throws if retirement age is less than current age", () => {
    const birthYear = 1960; // age 66 in 2026
    expect(() => generateRecommendedGlidePath(birthYear, 65)).toThrow("Retirement age cannot be less than current age");
  });

  it("includes fixed income and cash that sum with equity to 100", () => {
    const birthYear = 1991;
    const result = generateRecommendedGlidePath(birthYear, 65);

    for (const waypoint of result) {
      const sum = waypoint.equityPct + waypoint.fixedIncomePct + waypoint.cashPct;
      expect(sum).toBeCloseTo(100, 1);
    }
  });

  it("generates decreasing equity allocation over time", () => {
    const birthYear = 1991;
    const result = generateRecommendedGlidePath(birthYear, 65);

    for (let i = 1; i < result.length; i++) {
      expect(result[i].equityPct).toBeLessThanOrEqual(result[i - 1].equityPct);
    }
  });
});

describe("getOldestPerson", () => {
  it("returns null for empty array", () => {
    expect(getOldestPerson([])).toBeNull();
  });

  it("returns null when all birthYears are null", () => {
    expect(getOldestPerson([{ birthYear: null }, { birthYear: null }])).toBeNull();
  });

  it("returns the oldest person (earliest birth year)", () => {
    const people = [{ birthYear: 1990 }, { birthYear: 1985 }, { birthYear: 1995 }];
    const result = getOldestPerson(people);
    expect(result?.birthYear).toBe(1985);
  });

  it("ignores people with null birthYear", () => {
    const people = [{ birthYear: null }, { birthYear: 1985 }, { birthYear: null }];
    const result = getOldestPerson(people);
    expect(result?.birthYear).toBe(1985);
  });
});
