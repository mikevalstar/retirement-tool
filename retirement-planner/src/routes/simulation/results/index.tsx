import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, GitCompare, Play, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "#/components/EmptyState";
import { fmtCAD } from "#/lib/formatters";
import { getScenariosWithResults, SECTION_ACCENT, type SimulationResultsJson } from "#/serverFns/simulation/runSimulation";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/simulation/results/")({
  component: SimulationResultsPage,
  loader: async () => await getScenariosWithResults(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

type ScenarioRow = { id: number; name: string; simulationResultsJson: string | null };

function parseResults(row: ScenarioRow): SimulationResultsJson | null {
  if (!row.simulationResultsJson) return null;
  try {
    return JSON.parse(row.simulationResultsJson) as SimulationResultsJson;
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtYear(y: number): string {
  return String(y);
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dim)" }}>{label}</div>
      <div className="num" style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

// ─── Assumptions accordion ────────────────────────────────────────────────────

function AssumptionsPanel({ results }: { results: SimulationResultsJson }) {
  const [open, setOpen] = useState(false);
  const s = results.settingsSnapshot;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Assumptions</span>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{open ? "▲ hide" : "▼ show"}</span>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Equities", ret: s.equityReturn, vol: s.equityStdDev },
              { label: "Fixed Income", ret: s.fixedReturn, vol: s.fixedStdDev },
              { label: "Cash", ret: s.cashReturn, vol: s.cashStdDev },
            ].map((a) => (
              <div key={a.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dim)" }}>{a.label}</div>
                <div className="num" style={{ fontSize: 13, color: "var(--text)" }}>
                  {a.ret >= 0 ? "+" : ""}
                  {a.ret}% avg / ±{a.vol}% vol
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Starting portfolio</div>
              <div className="num" style={{ fontSize: 13, color: "var(--text)" }}>
                {fmtCAD(results.startingPortfolio)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Simulations</div>
              <div className="num" style={{ fontSize: 13, color: "var(--text)" }}>
                {s.numRuns.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>CPP base</div>
              <div className="num" style={{ fontSize: 13, color: "var(--text)" }}>
                {Math.round(s.cppBaseMultiplier * 100)}% of max
              </div>
            </div>
            {results.mode === "stress" && results.crashProfile && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Stress mode</div>
                <div style={{ fontSize: 13, color: "var(--text)", textTransform: "capitalize" }}>{results.crashProfile} crashes</div>
              </div>
            )}
            {results.usingFallbackGlidePath && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>⚠ No glide path configured — using default allocation profile</div>
            )}
          </div>

          {results.spendingPhases && results.spendingPhases.length > 0 && (
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dim)", marginBottom: 6 }}>
                Household spending phases (today's dollars)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {results.spendingPhases.map((p) => (
                  <div key={p.startYear} className="num" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {p.name} (from {p.startYear}): {fmtCAD(p.monthlyTodayDollars)}/mo = {fmtCAD(p.monthlyTodayDollars * 12)}/yr
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.cppOasAmounts.length > 0 && (
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dim)", marginBottom: 6 }}>
                CPP / OAS amounts used
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {results.cppOasAmounts.map((c) => (
                  <div key={c.personName} className="num" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {c.personName}: CPP {fmtCAD(c.cppMonthly)}/mo from {c.cppClaimYear} (age {c.cppClaimAge}) · OAS {fmtCAD(c.oasMonthly)}/mo from{" "}
                    {c.oasClaimYear} (age {c.oasClaimAge})
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Run {new Date(results.runAt).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

const BAND_COLOR = SECTION_ACCENT; // bright cyan
const COMPARE_COLOR = "var(--section-scenarios)"; // violet

type ChartPoint = {
  year: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  c_p10?: number;
  c_p25?: number;
  c_p50?: number;
  c_p75?: number;
  c_p90?: number;
};

function buildChartData(primary: SimulationResultsJson, compare?: SimulationResultsJson | null): ChartPoint[] {
  return primary.years.map((year, i) => {
    const point: ChartPoint = {
      year,
      p10: primary.p10[i],
      p25: primary.p25[i],
      p50: primary.p50[i],
      p75: primary.p75[i],
      p90: primary.p90[i],
    };
    if (compare) {
      // Map compare year index — find matching year
      const ci = compare.years.indexOf(year);
      if (ci >= 0) {
        point.c_p10 = compare.p10[ci];
        point.c_p25 = compare.p25[ci];
        point.c_p50 = compare.p50[ci];
        point.c_p75 = compare.p75[ci];
        point.c_p90 = compare.p90[ci];
      }
    }
    return point;
  });
}

// Custom vertical label for milestone reference lines.
// Rotated 90° so it reads top-to-bottom inside the chart, sitting just right of the line.
function MilestoneLabel(props: { viewBox?: { x: number; y: number }; value?: string; index?: number }) {
  const { viewBox, value, index = 0 } = props;
  if (!viewBox || !value) return null;
  const { x, y } = viewBox;
  // Alternate vertical offset so adjacent milestones don't collide
  const topOffset = 6 + (index % 2) * 60;
  const lx = x + 4;
  const ly = y + topOffset;
  return (
    <text
      x={lx}
      y={ly}
      fontSize={9}
      fill="var(--text-dim)"
      textAnchor="start"
      dominantBaseline="hanging"
      style={{ letterSpacing: "0.02em" }}
      transform={`rotate(90, ${lx}, ${ly})`}>
      {value}
    </text>
  );
}

function SimulationChart({
  primary,
  compare,
  milestones,
}: {
  primary: SimulationResultsJson;
  compare?: SimulationResultsJson | null;
  milestones: Array<{ year: number; label: string }>;
}) {
  const data = useMemo(() => buildChartData(primary, compare), [primary, compare]);

  const formatYAxis = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
    return `$${v}`;
  };

  return (
    <ResponsiveContainer width="100%" height={340}>
      {/* top margin leaves room for the rotated milestone labels */}
      <ComposedChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        {/* type="number" ensures ReferenceLine x values align exactly with data points */}
        <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} tickCount={8} tick={{ fontSize: 11, fill: "var(--text-dim)" }} tickLine={false} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--text-dim)" }} tickLine={false} axisLine={false} width={64} />

        <Tooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--text)" }}
          formatter={(value: number | undefined, name: string | undefined) => {
            if (value === undefined) return ["—", name ?? ""];
            const labels: Record<string, string> = {
              p90: "90th %ile",
              p75: "75th %ile",
              p50: "Median",
              p25: "25th %ile",
              p10: "10th %ile",
              c_p50: `${compare?.scenarioName ?? "Compare"} median`,
            };
            const key = name ?? "";
            return [fmtCAD(value), labels[key] ?? key];
          }}
          labelFormatter={(y) => `Year ${y}`}
        />

        {/* Primary scenario bands — outer (p10/p90) */}
        <Area type="monotone" dataKey="p90" stroke="none" fill={BAND_COLOR} fillOpacity={0.07} isAnimationActive={false} />
        <Area type="monotone" dataKey="p75" stroke="none" fill={BAND_COLOR} fillOpacity={0.1} isAnimationActive={false} />
        {/* Inner band (p25/p75 range) */}
        <Area type="monotone" dataKey="p50" stroke={BAND_COLOR} strokeWidth={2} fill={BAND_COLOR} fillOpacity={0.15} isAnimationActive={false} />
        <Area type="monotone" dataKey="p25" stroke="none" fill="var(--app-bg)" fillOpacity={1} isAnimationActive={false} />
        <Area type="monotone" dataKey="p10" stroke="none" fill="var(--app-bg)" fillOpacity={1} isAnimationActive={false} />

        {/* Compare scenario: faint bands + solid median line */}
        {compare && (
          <>
            <Area type="monotone" dataKey="c_p90" stroke="none" fill={COMPARE_COLOR} fillOpacity={0.05} isAnimationActive={false} />
            <Area type="monotone" dataKey="c_p10" stroke="none" fill="var(--app-bg)" fillOpacity={1} isAnimationActive={false} />
            <Line type="monotone" dataKey="c_p50" stroke={COMPARE_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
          </>
        )}

        {/* Milestone reference lines — rendered last so they sit on top of the bands */}
        {milestones.map((m, i) => (
          <ReferenceLine
            key={`${m.year}-${m.label}`}
            x={m.year}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            strokeDasharray="4 3"
            label={<MilestoneLabel value={m.label} index={i} />}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function SimulationResultsPage() {
  const scenarios = Route.useLoaderData();
  const withResults = scenarios.filter((s) => s.simulationResultsJson);

  // Find the most-recently-run scenario as default
  const mostRecentId = useMemo(() => {
    if (withResults.length === 0) return null;
    return withResults.map((s) => ({ id: s.id, runAt: parseResults(s)?.runAt ?? "" })).sort((a, b) => b.runAt.localeCompare(a.runAt))[0].id;
  }, [withResults]);

  const [selectedId, setSelectedId] = useState<number | null>(mostRecentId);
  const [compareId, setCompareId] = useState<number | null>(null);
  const [compareActive, setCompareActive] = useState(false);

  const selected = withResults.find((s) => s.id === selectedId) ?? null;
  const compareScenario = compareActive && compareId ? (withResults.find((s) => s.id === compareId) ?? null) : null;

  const results = selected ? parseResults(selected) : null;
  const compareResults = compareScenario ? parseResults(compareScenario) : null;

  if (withResults.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              backgroundColor: `color-mix(in srgb, ${SECTION_ACCENT} 15%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Activity size={15} style={{ color: SECTION_ACCENT }} />
          </div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>Simulation Results</h1>
        </div>
        <EmptyState
          icon={<Play size={20} style={{ color: SECTION_ACCENT }} />}
          title="No simulations run yet"
          description='Click "Run Simulation" in the top bar to run your first scenario.'
          accent={SECTION_ACCENT}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              backgroundColor: `color-mix(in srgb, ${SECTION_ACCENT} 15%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Activity size={15} style={{ color: SECTION_ACCENT }} />
          </div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>Simulation Results</h1>
        </div>
        <Link
          to="/simulation/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--text-dim)",
            textDecoration: "none",
          }}>
          <SlidersHorizontal size={12} />
          Settings
        </Link>
      </div>

      {/* Scenario tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {withResults.map((s) => {
          const r = parseResults(s);
          const isSelected = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: isSelected ? 600 : 400,
                fontFamily: "inherit",
                cursor: "pointer",
                background: isSelected ? `color-mix(in srgb, ${SECTION_ACCENT} 18%, transparent)` : "var(--surface)",
                border: `1px solid ${isSelected ? `color-mix(in srgb, ${SECTION_ACCENT} 40%, transparent)` : "var(--border)"}`,
                color: isSelected ? SECTION_ACCENT : "var(--text-muted)",
              }}>
              {s.name}
              {r?.mode === "stress" && (
                <span style={{ marginLeft: 5, fontSize: 10, color: "var(--text-dim)", textTransform: "capitalize" }}>({r.crashProfile})</span>
              )}
            </button>
          );
        })}

        {/* Compare toggle */}
        {withResults.length >= 2 && (
          <button
            type="button"
            onClick={() => {
              setCompareActive((a) => !a);
              if (!compareId) {
                const other = withResults.find((s) => s.id !== selectedId);
                if (other) setCompareId(other.id);
              }
            }}
            style={{
              marginLeft: 6,
              padding: "5px 14px",
              borderRadius: 20,
              fontSize: 12.5,
              fontFamily: "inherit",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: compareActive ? `color-mix(in srgb, var(--section-scenarios) 15%, transparent)` : "var(--surface)",
              border: `1px solid ${compareActive ? "color-mix(in srgb, var(--section-scenarios) 35%, transparent)" : "var(--border)"}`,
              color: compareActive ? "var(--section-scenarios)" : "var(--text-dim)",
            }}>
            <GitCompare size={12} />
            Compare
          </button>
        )}
      </div>

      {/* Compare scenario selector */}
      {compareActive && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Compare with:</span>
          <select
            value={compareId ?? ""}
            onChange={(e) => setCompareId(Number(e.target.value))}
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "4px 8px",
              fontSize: 12.5,
              color: "var(--text)",
              fontFamily: "inherit",
              cursor: "pointer",
              outline: "none",
            }}>
            {withResults
              .filter((s) => s.id !== selectedId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {results && (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <StatCard
              label="Success rate"
              value={fmtPct(results.successRate)}
              sub={`${Math.round((results.settingsSnapshot.numRuns * results.successRate) / 100).toLocaleString()} of ${results.settingsSnapshot.numRuns.toLocaleString()} simulations`}
            />
            <StatCard
              label="Median final balance"
              value={fmtCAD(results.p50[results.p50.length - 1])}
              sub={`At ${results.planningEndYear} (50th percentile)`}
            />
            {results.medianDepletionYear && results.successRate <= 95 ? (
              <StatCard label="Median depletion year" value={fmtYear(results.medianDepletionYear)} sub="In failed simulations" />
            ) : (
              <StatCard
                label="10th percentile balance"
                value={fmtCAD(results.p10[results.p10.length - 1])}
                sub={`Worst-case 10% at ${results.planningEndYear}`}
              />
            )}
          </div>

          {/* Compare summary */}
          {compareActive && compareResults && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div
                style={{
                  gridColumn: "1 / -1",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--section-scenarios)",
                  paddingBottom: 2,
                }}>
                {compareScenario?.name}
              </div>
              <StatCard label="Success rate" value={fmtPct(compareResults.successRate)} />
              <StatCard label="Median final balance" value={fmtCAD(compareResults.p50[compareResults.p50.length - 1])} />
              <StatCard
                label={compareResults.medianDepletionYear && compareResults.successRate <= 95 ? "Median depletion year" : "10th percentile balance"}
                value={
                  compareResults.medianDepletionYear && compareResults.successRate <= 95
                    ? fmtYear(compareResults.medianDepletionYear)
                    : fmtCAD(compareResults.p10[compareResults.p10.length - 1])
                }
              />
            </div>
          )}

          {/* Chart */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 8px 8px" }}>
            <SimulationChart primary={results} compare={compareResults} milestones={results.milestones} />
          </div>

          {/* Assumptions */}
          <AssumptionsPanel results={results} />
        </>
      )}
    </div>
  );
}
