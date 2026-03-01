import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, GitBranch } from "lucide-react";
import { useState } from "react";
import { fmtCAD } from "#/lib/formatters";
import { getScenario, getScenarios, SECTION_ACCENT } from "#/serverFns/scenarios/scenarioFns";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/scenarios/compare/")({
  component: ComparePage,
  loader: async () => getScenarios(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ScenarioSummary = Awaited<ReturnType<typeof getScenarios>>[number];
type FullScenario = NonNullable<Awaited<ReturnType<typeof getScenario>>>;

function CompareRow({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) {
  return (
    <tr style={{ borderTop: "1px solid var(--border)" }}>
      <td className="py-[10px] px-4 text-[12.5px]" style={{ color: "var(--text-muted)", width: "200px" }}>
        {label}
      </td>
      <td className="py-[10px] px-4 text-[13px]" style={{ color: "var(--text)", borderLeft: "1px solid var(--border)" }}>
        {a}
      </td>
      <td className="py-[10px] px-4 text-[13px]" style={{ color: "var(--text)", borderLeft: "1px solid var(--border)" }}>
        {b}
      </td>
    </tr>
  );
}

// ─── Scenario Selector ────────────────────────────────────────────────────────

interface SelectorProps {
  label: string;
  scenarios: ScenarioSummary[];
  value: number | null;
  exclude: number | null;
  onChange: (id: number | null) => void;
}

function ScenarioSelector({ label, scenarios, value, exclude, onChange }: SelectorProps) {
  const options = scenarios.filter((s) => s.id !== exclude);
  return (
    <div className="flex flex-col gap-1.5" style={{ flex: 1 }}>
      <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: 13,
          color: "var(--text)",
          fontFamily: "inherit",
          outline: "none",
          cursor: "pointer",
        }}>
        <option value="">— Select scenario —</option>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

interface CompareTableProps {
  a: FullScenario;
  b: FullScenario;
}

function CompareTable({ a, b }: CompareTableProps) {
  const sortedPhasesA = [...a.phases].sort((x, y) => x.startYear - y.startYear);
  const sortedPhasesB = [...b.phases].sort((x, y) => x.startYear - y.startYear);
  const maxPhases = Math.max(sortedPhasesA.length, sortedPhasesB.length);

  const sortedContribA = [...a.contributions].sort((x, y) => x.year - y.year);
  const sortedContribB = [...b.contributions].sort((x, y) => x.year - y.year);
  const maxContrib = Math.max(sortedContribA.length, sortedContribB.length);

  const peopleA = a.cppOasSettings;
  const peopleB = b.cppOasSettings;
  const allPersonIds = [...new Set([...peopleA.map((s) => s.personId), ...peopleB.map((s) => s.personId)])];

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr style={{ background: "var(--surface-raised)", borderBottom: "2px solid var(--border)" }}>
            <th className="py-3 px-4 text-left text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)", width: "200px" }}>
              Parameter
            </th>
            <th className="py-3 px-4 text-left text-[13px] font-semibold" style={{ color: SECTION_ACCENT, borderLeft: "1px solid var(--border)" }}>
              {a.name}
            </th>
            <th
              className="py-3 px-4 text-left text-[13px] font-semibold"
              style={{ color: "var(--section-simulation, #00e5ff)", borderLeft: "1px solid var(--border)" }}>
              {b.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Identity */}
          <CompareRow label="Retirement Year" a={<span className="num">{a.retirementYear}</span>} b={<span className="num">{b.retirementYear}</span>} />
          <CompareRow label="Plan Through" a={<span className="num">{a.planningEndYear}</span>} b={<span className="num">{b.planningEndYear}</span>} />
          <CompareRow label="Inflation Rate" a={<span className="num">{a.inflationRate}%</span>} b={<span className="num">{b.inflationRate}%</span>} />

          {/* CPP/OAS */}
          {allPersonIds.map((personId) => {
            const settingsA = peopleA.find((s) => s.personId === personId);
            const settingsB = peopleB.find((s) => s.personId === personId);
            const name = settingsA?.person.name ?? settingsB?.person.name ?? `Person ${personId}`;
            return (
              <CompareRow
                key={personId}
                label={`${name} — CPP / OAS`}
                a={
                  settingsA ? (
                    <span className="num">
                      CPP {settingsA.cppClaimAge} / OAS {settingsA.oasClaimAge}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-dim)" }}>—</span>
                  )
                }
                b={
                  settingsB ? (
                    <span className="num">
                      CPP {settingsB.cppClaimAge} / OAS {settingsB.oasClaimAge}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-dim)" }}>—</span>
                  )
                }
              />
            );
          })}

          {/* Contributions */}
          {maxContrib > 0 && (
            <>
              <tr style={{ borderTop: "2px solid var(--border)", background: "var(--app-bg)" }}>
                <td colSpan={3} className="py-2 px-4 text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
                  Savings Contributions
                </td>
              </tr>
              {Array.from({ length: maxContrib }).map((_, i) => {
                const ca = sortedContribA[i];
                const cb = sortedContribB[i];
                return (
                  <CompareRow
                    key={`contrib-${ca?.year ?? ""}-${cb?.year ?? ""}-${i}`}
                    label={ca ? String(ca.year) : cb ? String(cb.year) : ""}
                    a={ca ? <span className="num">{fmtCAD(ca.annualAmount)}/yr</span> : <span style={{ color: "var(--text-dim)" }}>—</span>}
                    b={cb ? <span className="num">{fmtCAD(cb.annualAmount)}/yr</span> : <span style={{ color: "var(--text-dim)" }}>—</span>}
                  />
                );
              })}
            </>
          )}

          {/* Spending phases */}
          {maxPhases > 0 && (
            <>
              <tr style={{ borderTop: "2px solid var(--border)", background: "var(--app-bg)" }}>
                <td colSpan={3} className="py-2 px-4 text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
                  Retirement Spending Phases
                </td>
              </tr>
              {Array.from({ length: maxPhases }).map((_, i) => {
                const pa = sortedPhasesA[i];
                const pb = sortedPhasesB[i];
                return (
                  <CompareRow
                    key={`phase-${pa?.id ?? ""}-${pb?.id ?? ""}`}
                    label={pa?.name ?? pb?.name ?? `Phase ${i + 1}`}
                    a={
                      pa ? (
                        <span>
                          <span className="num">{fmtCAD(pa.monthlyAmount)}/mo</span> <span style={{ color: "var(--text-dim)" }}>from {pa.startYear}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-dim)" }}>—</span>
                      )
                    }
                    b={
                      pb ? (
                        <span>
                          <span className="num">{fmtCAD(pb.monthlyAmount)}/mo</span> <span style={{ color: "var(--text-dim)" }}>from {pb.startYear}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-dim)" }}>—</span>
                      )
                    }
                  />
                );
              })}
            </>
          )}

          {/* Housing events */}
          {(a.housingEvents.length > 0 || b.housingEvents.length > 0) && (
            <>
              <tr style={{ borderTop: "2px solid var(--border)", background: "var(--app-bg)" }}>
                <td colSpan={3} className="py-2 px-4 text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
                  Housing Events
                </td>
              </tr>
              {[...new Set([...a.housingEvents.map((e) => e.property.name), ...b.housingEvents.map((e) => e.property.name)])].map((propName) => {
                const evA = a.housingEvents.find((e) => e.property.name === propName);
                const evB = b.housingEvents.find((e) => e.property.name === propName);
                return (
                  <CompareRow
                    key={propName}
                    label={propName}
                    a={
                      evA ? (
                        <span>
                          <span className="num">{fmtCAD(evA.netProceeds)}</span> <span style={{ color: "var(--text-dim)" }}>in {evA.saleYear}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-dim)" }}>Not planned</span>
                      )
                    }
                    b={
                      evB ? (
                        <span>
                          <span className="num">{fmtCAD(evB.netProceeds)}</span> <span style={{ color: "var(--text-dim)" }}>in {evB.saleYear}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-dim)" }}>Not planned</span>
                      )
                    }
                  />
                );
              })}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ComparePage() {
  const scenarios = Route.useLoaderData();
  const [idA, setIdA] = useState<number | null>(scenarios[0]?.id ?? null);
  const [idB, setIdB] = useState<number | null>(scenarios[1]?.id ?? null);
  const [fullA, setFullA] = useState<FullScenario | null>(null);
  const [fullB, setFullB] = useState<FullScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleCompare = async () => {
    if (!idA || !idB) return;
    setLoading(true);
    setError(null);
    try {
      const [a, b] = await Promise.all([getScenario({ data: { id: idA } }), getScenario({ data: { id: idB } })]);
      if (a && b) {
        setFullA(a);
        setFullB(b);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const canCompare = idA !== null && idB !== null && idA !== idB;

  if (scenarios.length < 2) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link to="/scenarios" className="flex items-center gap-1.5 no-underline text-[12.5px]" style={{ color: "var(--text-dim)" }}>
            <ArrowLeft size={13} />
            All Scenarios
          </Link>
        </div>
        <div className="flex items-center gap-[10px]">
          <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: SECTION_ACCENT }} />
          <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
            Compare Scenarios
          </h1>
        </div>
        <div className="rounded-lg py-12 flex flex-col items-center gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <GitBranch size={24} style={{ color: "var(--text-dim)" }} />
          <p className="text-[13px] m-0" style={{ color: "var(--text-dim)" }}>
            You need at least 2 scenarios to compare.{" "}
            <Link to="/scenarios" style={{ color: SECTION_ACCENT }}>
              Create another scenario.
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Back link */}
      <div className="flex items-center gap-2">
        <Link to="/scenarios" className="flex items-center gap-1.5 no-underline text-[12.5px]" style={{ color: "var(--text-dim)" }}>
          <ArrowLeft size={13} />
          All Scenarios
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-[10px]">
        <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: SECTION_ACCENT }} />
        <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
          Compare Scenarios
        </h1>
      </div>

      {/* Selectors */}
      <div className="rounded-lg p-4 flex flex-wrap items-end gap-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <ScenarioSelector
          label="Scenario A"
          scenarios={scenarios}
          value={idA}
          exclude={idB}
          onChange={(id) => {
            setIdA(id);
            setFullA(null);
            setFullB(null);
          }}
        />
        <ScenarioSelector
          label="Scenario B"
          scenarios={scenarios}
          value={idB}
          exclude={idA}
          onChange={(id) => {
            setIdB(id);
            setFullA(null);
            setFullB(null);
          }}
        />
        <button
          type="button"
          onClick={handleCompare}
          disabled={!canCompare || loading}
          className="py-[7px] px-4 rounded-md text-[13px] font-medium cursor-pointer"
          style={{
            background: canCompare ? `color-mix(in srgb, ${SECTION_ACCENT} 15%, transparent)` : "var(--surface-raised)",
            border: `1px solid ${canCompare ? `color-mix(in srgb, ${SECTION_ACCENT} 35%, transparent)` : "var(--border)"}`,
            color: canCompare ? SECTION_ACCENT : "var(--text-dim)",
            fontFamily: "inherit",
            opacity: loading ? 0.6 : 1,
          }}>
          {loading ? "Loading…" : "Compare"}
        </button>
      </div>

      {!!error && (
        <div
          className="rounded-md px-4 py-3"
          style={{
            background: "color-mix(in srgb, var(--color-negative, #ef4444) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-negative, #ef4444) 25%, transparent)",
          }}>
          <p className="text-[13px] m-0" style={{ color: "var(--text)" }}>
            Failed to load scenarios. Please try again.
          </p>
        </div>
      )}

      {/* Comparison */}
      {fullA && fullB && <CompareTable a={fullA} b={fullB} />}

      {!fullA && !fullB && !loading && (
        <div className="rounded-lg py-10 flex flex-col items-center gap-2" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
          <p className="text-[13px] m-0" style={{ color: "var(--text-dim)" }}>
            Select two scenarios and click Compare to see a side-by-side breakdown.
          </p>
          <p className="text-[12px] m-0" style={{ color: "var(--text-dim)", opacity: 0.6 }}>
            Outcome chart comparison will be available after running the simulation.
          </p>
        </div>
      )}
    </div>
  );
}
