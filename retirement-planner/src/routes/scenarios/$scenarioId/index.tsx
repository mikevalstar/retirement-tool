import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home, Plus, Trash2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { InlineError } from "#/components/InlineError";
import { dayjs } from "#/lib/date";
import { fmtCAD } from "#/lib/formatters";
import { inlineInputCls, inlineInputCSS } from "#/lib/panelStyles";
import { thCls, thCSS } from "#/lib/tableStyles";
import {
  deleteContribution,
  deleteHousingEvent,
  deletePhase,
  getPeopleAndProperties,
  getScenario,
  SECTION_ACCENT,
  updateScenario,
  upsertContribution,
  upsertCppOas,
  upsertHousingEvent,
  upsertPhase,
} from "#/serverFns/scenarios/scenarioFns";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/scenarios/$scenarioId/")({
  component: ScenarioEditPage,
  loader: async ({ params }) => {
    const id = Number.parseInt(params.scenarioId, 10);
    if (Number.isNaN(id)) throw notFound();
    const [scenario, { people, properties }] = await Promise.all([getScenario({ data: { id } }), getPeopleAndProperties()]);
    if (!scenario) throw notFound();
    return { scenario, people, properties };
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

type LoadedData = Awaited<ReturnType<typeof getScenario>>;
type Scenario = NonNullable<LoadedData>;
type Phase = Scenario["phases"][number];
type Contribution = Scenario["contributions"][number];
type HousingEvent = Scenario["housingEvents"][number];
type Person = Awaited<ReturnType<typeof getPeopleAndProperties>>["people"][number];
type Property = Awaited<ReturnType<typeof getPeopleAndProperties>>["properties"][number];

const CURRENT_YEAR = dayjs().year();

function sectionHeader(title: string) {
  return (
    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-raised)" }}>
      <div className="w-[3px] h-4 rounded-[2px]" style={{ backgroundColor: SECTION_ACCENT }} />
      <span className="text-[12.5px] font-semibold uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
        {title}
      </span>
    </div>
  );
}

// ─── Step Chart (shared for contributions and phases) ────────────────────────

interface StepChartProps {
  data: { year: number; value: number }[];
  yLabel: string;
  referenceYear?: number;
  referenceLabel?: string;
  color?: string;
  formatter?: (v: number) => string;
}

function StepChart({ data, yLabel, referenceYear, referenceLabel, color = SECTION_ACCENT, formatter = (v) => String(v) }: StepChartProps) {
  const gradId = useId();
  if (data.length < 2) return null;

  // Build step-function points: for each point, add it twice — at its year and at next year - 1
  const sorted = [...data].sort((a, b) => a.year - b.year);
  const points: { year: number; value: number }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    points.push({ year: sorted[i].year, value: sorted[i].value });
    if (i < sorted.length - 1) {
      points.push({ year: sorted[i + 1].year - 0.5, value: sorted[i].value });
    }
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="year"
          type="number"
          domain={["dataMin", "dataMax"]}
          allowDecimals={false}
          tick={{ fill: "var(--text-dim)", fontSize: 10 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatter}
          tick={{ fill: "var(--text-dim)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={64}
          label={{ value: yLabel, angle: -90, position: "insideLeft", style: { fill: "var(--text-dim)", fontSize: 9 }, offset: 10 }}
        />
        <Tooltip
          formatter={(v) => [typeof v === "number" ? formatter(v) : String(v)]}
          labelFormatter={(l) => `${Math.round(l as number)}`}
          contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)", fontSize: 12 }}
          labelStyle={{ color: "var(--text-muted)" }}
          itemStyle={{ color: "var(--text)" }}
        />
        {referenceYear && (
          <ReferenceLine
            x={referenceYear}
            stroke="var(--text-dim)"
            strokeDasharray="4 4"
            label={{ value: referenceLabel ?? String(referenceYear), position: "insideTopRight", style: { fill: "var(--text-dim)", fontSize: 9 } }}
          />
        )}
        <Area dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Identity Section ─────────────────────────────────────────────────────────

interface IdentitySectionProps {
  scenario: Scenario;
  onSaved: () => void;
  onError: (err: unknown) => void;
}

function IdentitySection({ scenario, onSaved, onError }: IdentitySectionProps) {
  const [name, setName] = useState(scenario.name);
  const [retirementYear, setRetirementYear] = useState(String(scenario.retirementYear));
  const [planningEndYear, setPlanningEndYear] = useState(String(scenario.planningEndYear));
  const [inflationRate, setInflationRate] = useState(String(scenario.inflationRate));
  const [saving, setSaving] = useState(false);

  const retYear = Number.parseInt(retirementYear, 10);
  const endYear = Number.parseInt(planningEndYear, 10);
  const infl = Number.parseFloat(inflationRate);

  const isDirty = name !== scenario.name || retYear !== scenario.retirementYear || endYear !== scenario.planningEndYear || infl !== scenario.inflationRate;

  const canSave =
    isDirty &&
    name.trim().length > 0 &&
    !Number.isNaN(retYear) &&
    retYear >= CURRENT_YEAR - 5 &&
    retYear <= 2100 &&
    !Number.isNaN(endYear) &&
    endYear > retYear &&
    !Number.isNaN(infl) &&
    infl >= 0 &&
    infl <= 20 &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateScenario({ data: { id: scenario.id, name: name.trim(), retirementYear: retYear, planningEndYear: endYear, inflationRate: infl } });
      onSaved();
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = "flex flex-col gap-[5px]";
  const labelCls = "text-[11px] font-medium uppercase tracking-[0.05em]";

  return (
    <div className="flex flex-col">
      {sectionHeader("Scenario Details")}
      <div className="p-4 flex flex-wrap gap-4 items-end">
        <div className={fieldCls} style={{ flex: "1 1 200px" }}>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
          <label className={labelCls} style={{ color: "var(--text-muted)" }}>
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className={inlineInputCls}
            style={inlineInputCSS}
          />
        </div>
        <div className={fieldCls}>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
          <label className={labelCls} style={{ color: "var(--text-muted)" }}>
            Retirement Year
          </label>
          <input
            type="number"
            min={CURRENT_YEAR - 5}
            max={2100}
            step={1}
            value={retirementYear}
            onChange={(e) => setRetirementYear(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className={`num ${inlineInputCls}`}
            style={{ ...inlineInputCSS, width: 110 }}
          />
        </div>
        <div className={fieldCls}>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
          <label className={labelCls} style={{ color: "var(--text-muted)" }}>
            Plan Through Year
          </label>
          <input
            type="number"
            min={CURRENT_YEAR}
            max={2200}
            step={1}
            value={planningEndYear}
            onChange={(e) => setPlanningEndYear(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className={`num ${inlineInputCls}`}
            style={{ ...inlineInputCSS, width: 110 }}
          />
        </div>
        <div className={fieldCls}>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
          <label className={labelCls} style={{ color: "var(--text-muted)" }}>
            Inflation Rate (%)
          </label>
          <input
            type="number"
            min={0}
            max={20}
            step={0.1}
            value={inflationRate}
            onChange={(e) => setInflationRate(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className={`num ${inlineInputCls}`}
            style={{ ...inlineInputCSS, width: 90 }}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="py-1 px-3 rounded text-[12px] font-medium cursor-pointer"
          style={{
            background: canSave ? `color-mix(in srgb, ${SECTION_ACCENT} 20%, transparent)` : "var(--surface-raised)",
            border: `1px solid ${canSave ? `color-mix(in srgb, ${SECTION_ACCENT} 40%, transparent)` : "var(--border)"}`,
            color: canSave ? SECTION_ACCENT : "var(--text-dim)",
            fontFamily: "inherit",
            opacity: saving ? 0.6 : 1,
          }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Contributions Section ────────────────────────────────────────────────────

interface ContributionsSectionProps {
  scenario: Scenario;
  contributions: Contribution[];
  onRefresh: () => void;
  onError: (err: unknown) => void;
}

function ContributionsSection({ scenario, contributions, onRefresh, onError }: ContributionsSectionProps) {
  const [addYear, setAddYear] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [adding, setAdding] = useState(false);

  const yr = Number.parseInt(addYear, 10);
  const amt = Number.parseFloat(addAmount);
  const canAdd = !Number.isNaN(yr) && yr >= CURRENT_YEAR && yr < scenario.retirementYear && !Number.isNaN(amt) && amt >= 0 && !adding;

  const handleAdd = async () => {
    if (!canAdd) return;
    setAdding(true);
    try {
      await upsertContribution({ data: { scenarioId: scenario.id, year: yr, annualAmount: amt } });
      setAddYear("");
      setAddAmount("");
      onRefresh();
    } catch (err) {
      onError(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteContribution({ data: { id } });
      onRefresh();
    } catch (err) {
      onError(err);
    }
  };

  const chartData = useMemo(() => {
    const pts = contributions.map((c) => ({ year: c.year, value: c.annualAmount }));
    if (contributions.length > 0) pts.push({ year: scenario.retirementYear, value: 0 });
    return pts;
  }, [contributions, scenario.retirementYear]);

  return (
    <div className="flex flex-col">
      {sectionHeader("Savings Contributions (Pre-Retirement)")}
      <div className="p-4 flex flex-col gap-4">
        <p className="text-[12px] m-0" style={{ color: "var(--text-dim)" }}>
          Enter your expected annual household savings for years where the amount changes. Between waypoints the amount stays flat. Contributions automatically
          drop to $0 at the retirement year.
        </p>

        {contributions.length > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-raised)" }}>
                  <th className={thCls("left")} style={thCSS}>
                    Year
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Annual Amount
                  </th>
                  <th className="w-9" />
                </tr>
              </thead>
              <tbody>
                {contributions.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}>
                    <td className="py-2 px-3 num" style={{ color: "var(--text)" }}>
                      {c.year}
                    </td>
                    <td className="py-2 px-3 text-right num" style={{ color: "var(--text)" }}>
                      {fmtCAD(c.annualAmount)}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="flex items-center justify-center p-1 rounded border-none bg-transparent cursor-pointer ml-auto"
                        style={{ color: "var(--text-dim)" }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "1px solid var(--border)", background: "var(--surface-raised)" }}>
                  <td className="py-2 px-3 num" style={{ color: "var(--text-dim)" }}>
                    {scenario.retirementYear}
                  </td>
                  <td className="py-2 px-3 text-right num" style={{ color: "var(--text-dim)" }}>
                    $0 (retirement)
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Add row */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-[5px]">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
            <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
              Year
            </label>
            <input
              type="number"
              min={CURRENT_YEAR}
              max={scenario.retirementYear - 1}
              step={1}
              value={addYear}
              onChange={(e) => setAddYear(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={String(CURRENT_YEAR)}
              className={`num ${inlineInputCls}`}
              style={{ ...inlineInputCSS, width: 100 }}
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
            <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
              Annual Amount ($)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. 24000"
              className={`num ${inlineInputCls}`}
              style={{ ...inlineInputCSS, width: 140 }}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="flex items-center gap-1.5 py-1 px-3 rounded text-[12px] font-medium cursor-pointer"
            style={{
              background: canAdd ? `color-mix(in srgb, ${SECTION_ACCENT} 15%, transparent)` : "var(--surface-raised)",
              border: `1px solid ${canAdd ? `color-mix(in srgb, ${SECTION_ACCENT} 35%, transparent)` : "var(--border)"}`,
              color: canAdd ? SECTION_ACCENT : "var(--text-dim)",
              fontFamily: "inherit",
            }}>
            <Plus size={12} />
            {adding ? "Adding…" : "Add waypoint"}
          </button>
        </div>

        {/* Chart */}
        {chartData.length >= 2 && (
          <div className="rounded-lg px-3 pt-3 pb-2" style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}>
            <div className="text-[10px] uppercase tracking-wide font-medium mb-2" style={{ color: "var(--text-dim)" }}>
              Contribution Profile
            </div>
            <StepChart data={chartData} yLabel="$/yr" referenceYear={scenario.retirementYear} referenceLabel="Retire" formatter={(v) => fmtCAD(v)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phases Section ───────────────────────────────────────────────────────────

interface PhasesSectionProps {
  scenario: Scenario;
  phases: Phase[];
  onRefresh: () => void;
  onError: (err: unknown) => void;
}

function PhasesSection({ scenario, phases, onRefresh, onError }: PhasesSectionProps) {
  const [addName, setAddName] = useState("");
  const [addStartYear, setAddStartYear] = useState("");
  const [addMonthly, setAddMonthly] = useState("");
  const [adding, setAdding] = useState(false);

  const yr = Number.parseInt(addStartYear, 10);
  const amt = Number.parseFloat(addMonthly);
  const canAdd =
    addName.trim().length > 0 &&
    !Number.isNaN(yr) &&
    yr >= scenario.retirementYear &&
    yr <= scenario.planningEndYear &&
    !Number.isNaN(amt) &&
    amt >= 0 &&
    !adding;

  const handleAdd = async () => {
    if (!canAdd) return;
    setAdding(true);
    try {
      await upsertPhase({ data: { scenarioId: scenario.id, name: addName.trim(), startYear: yr, monthlyAmount: amt } });
      setAddName("");
      setAddStartYear("");
      setAddMonthly("");
      onRefresh();
    } catch (err) {
      onError(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePhase({ data: { id } });
      onRefresh();
    } catch (err) {
      onError(err);
    }
  };

  const sortedPhases = [...phases].sort((a, b) => a.startYear - b.startYear);

  const chartData = useMemo(() => {
    const pts = sortedPhases.map((p) => ({ year: p.startYear, value: p.monthlyAmount }));
    if (pts.length > 0) pts.push({ year: scenario.planningEndYear, value: sortedPhases[sortedPhases.length - 1].monthlyAmount });
    return pts;
  }, [sortedPhases, scenario.planningEndYear]);

  const noPhases = sortedPhases.length === 0;

  return (
    <div className="flex flex-col">
      {sectionHeader("Retirement Spending Phases")}
      <div className="p-4 flex flex-col gap-4">
        <p className="text-[12px] m-0" style={{ color: "var(--text-dim)" }}>
          Define spending phases through retirement. Monthly amounts are in <strong>today's dollars</strong> — the simulation applies inflation year over year.
          The first phase should start at your retirement year.
        </p>

        {noPhases && (
          <div className="rounded-lg py-6 flex flex-col items-center gap-2" style={{ background: "var(--app-bg)", border: "1px dashed var(--border)" }}>
            <p className="text-[13px] m-0" style={{ color: "var(--text-dim)" }}>
              No phases yet — add at least one phase to run the simulation.
            </p>
          </div>
        )}

        {!noPhases && (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-raised)" }}>
                  <th className={thCls("left")} style={thCSS}>
                    Phase
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Start Year
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Monthly (today's $)
                  </th>
                  <th className="w-9" />
                </tr>
              </thead>
              <tbody>
                {sortedPhases.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}>
                    <td className="py-2 px-3 font-medium" style={{ color: "var(--text)" }}>
                      {p.name}
                    </td>
                    <td className="py-2 px-3 text-right num" style={{ color: "var(--text)" }}>
                      {p.startYear}
                    </td>
                    <td className="py-2 px-3 text-right num" style={{ color: "var(--text)" }}>
                      {fmtCAD(p.monthlyAmount)}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="flex items-center justify-center p-1 rounded border-none bg-transparent cursor-pointer ml-auto"
                        style={{ color: "var(--text-dim)" }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add row */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-[5px]" style={{ flex: "1 1 140px" }}>
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
            <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
              Phase Name
            </label>
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. Go-Go, Slow-Go"
              className={inlineInputCls}
              style={inlineInputCSS}
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
            <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
              Start Year
            </label>
            <input
              type="number"
              min={scenario.retirementYear}
              max={scenario.planningEndYear}
              step={1}
              value={addStartYear}
              onChange={(e) => setAddStartYear(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={String(scenario.retirementYear)}
              className={`num ${inlineInputCls}`}
              style={{ ...inlineInputCSS, width: 100 }}
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
            <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
              Monthly Spending ($)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={addMonthly}
              onChange={(e) => setAddMonthly(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="e.g. 5000"
              className={`num ${inlineInputCls}`}
              style={{ ...inlineInputCSS, width: 130 }}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="flex items-center gap-1.5 py-1 px-3 rounded text-[12px] font-medium cursor-pointer"
            style={{
              background: canAdd ? `color-mix(in srgb, ${SECTION_ACCENT} 15%, transparent)` : "var(--surface-raised)",
              border: `1px solid ${canAdd ? `color-mix(in srgb, ${SECTION_ACCENT} 35%, transparent)` : "var(--border)"}`,
              color: canAdd ? SECTION_ACCENT : "var(--text-dim)",
              fontFamily: "inherit",
            }}>
            <Plus size={12} />
            {adding ? "Adding…" : "Add phase"}
          </button>
        </div>

        {/* Chart */}
        {chartData.length >= 2 && (
          <div className="rounded-lg px-3 pt-3 pb-2" style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}>
            <div className="text-[10px] uppercase tracking-wide font-medium mb-2" style={{ color: "var(--text-dim)" }}>
              Spending Profile
            </div>
            <StepChart data={chartData} yLabel="$/mo" referenceYear={scenario.retirementYear} referenceLabel="Retire" formatter={(v) => fmtCAD(v)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CPP/OAS Section ──────────────────────────────────────────────────────────

interface CppOasSectionProps {
  scenario: Scenario;
  people: Person[];
  onRefresh: () => void;
  onError: (err: unknown) => void;
}

function CppOasSection({ scenario, people, onRefresh, onError }: CppOasSectionProps) {
  const peopleWithBirthYear = people.filter((p) => p.birthYear !== null);
  const peopleWithout = people.filter((p) => p.birthYear === null);

  const getSettings = (personId: number) => {
    return scenario.cppOasSettings.find((s) => s.personId === personId);
  };

  const handleUpdate = async (personId: number, cppClaimAge: number, oasClaimAge: number) => {
    try {
      await upsertCppOas({ data: { scenarioId: scenario.id, personId, cppClaimAge, oasClaimAge } });
      onRefresh();
    } catch (err) {
      onError(err);
    }
  };

  if (people.length === 0) {
    return (
      <div className="flex flex-col">
        {sectionHeader("CPP / OAS Claiming Ages")}
        <div className="p-4">
          <p className="text-[12px] m-0" style={{ color: "var(--text-dim)" }}>
            No people configured.{" "}
            <Link to="/settings" style={{ color: SECTION_ACCENT }}>
              Add people in Settings
            </Link>{" "}
            to configure CPP/OAS claiming ages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {sectionHeader("CPP / OAS Claiming Ages")}
      <div className="p-4 flex flex-col gap-4">
        <p className="text-[12px] m-0" style={{ color: "var(--text-dim)" }}>
          CPP can be claimed from age 60–70 (−0.6%/month before 65, +0.7%/month after 65). OAS can be claimed from age 65–70 (+0.6%/month deferred). Defaults to
          65 for both.
        </p>

        {peopleWithout.length > 0 && (
          <div
            className="rounded-md px-3 py-2.5"
            style={{
              background: "color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 30%, transparent)",
            }}>
            <p className="text-[12px] m-0" style={{ color: "var(--text)" }}>
              {peopleWithout.map((p) => p.name).join(", ")} {peopleWithout.length === 1 ? "is" : "are"} missing a birth year.{" "}
              <Link to="/settings" style={{ color: SECTION_ACCENT }}>
                Set it in Settings
              </Link>{" "}
              to enable CPP/OAS for {peopleWithout.length === 1 ? "them" : "those people"}.
            </p>
          </div>
        )}

        {peopleWithBirthYear.length > 0 && (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-raised)" }}>
                  <th className={thCls("left")} style={thCSS}>
                    Person
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    CPP Claim Age
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    OAS Claim Age
                  </th>
                </tr>
              </thead>
              <tbody>
                {peopleWithBirthYear.map((person, i) => (
                  <CppOasRow
                    key={person.id}
                    person={person}
                    settings={getSettings(person.id)}
                    isFirst={i === 0}
                    onUpdate={(cpp, oas) => handleUpdate(person.id, cpp, oas)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface CppOasRowProps {
  person: Person;
  settings: { cppClaimAge: number; oasClaimAge: number } | undefined;
  isFirst: boolean;
  onUpdate: (cppClaimAge: number, oasClaimAge: number) => void;
}

function CppOasRow({ person, settings, isFirst, onUpdate }: CppOasRowProps) {
  const [cpp, setCpp] = useState(String(settings?.cppClaimAge ?? 65));
  const [oas, setOas] = useState(String(settings?.oasClaimAge ?? 65));

  const cppNum = Number.parseInt(cpp, 10);
  const oasNum = Number.parseInt(oas, 10);

  const handleBlur = () => {
    if (!Number.isNaN(cppNum) && cppNum >= 60 && cppNum <= 70 && !Number.isNaN(oasNum) && oasNum >= 65 && oasNum <= 70) {
      onUpdate(cppNum, oasNum);
    }
  };

  return (
    <tr style={{ borderTop: isFirst ? undefined : "1px solid var(--border)" }}>
      <td className="py-2 px-3 font-medium" style={{ color: "var(--text)" }}>
        {person.name}
      </td>
      <td className="py-2 px-3 text-right">
        <input
          type="number"
          min={60}
          max={70}
          step={1}
          value={cpp}
          onChange={(e) => setCpp(e.target.value)}
          onBlur={handleBlur}
          className={`num ${inlineInputCls}`}
          style={{ ...inlineInputCSS, width: 70, textAlign: "right" }}
        />
      </td>
      <td className="py-2 px-3 text-right">
        <input
          type="number"
          min={65}
          max={70}
          step={1}
          value={oas}
          onChange={(e) => setOas(e.target.value)}
          onBlur={handleBlur}
          className={`num ${inlineInputCls}`}
          style={{ ...inlineInputCSS, width: 70, textAlign: "right" }}
        />
      </td>
    </tr>
  );
}

// ─── Housing Events Section ───────────────────────────────────────────────────

interface HousingSectionProps {
  scenario: Scenario;
  properties: Property[];
  housingEvents: HousingEvent[];
  onRefresh: () => void;
  onError: (err: unknown) => void;
}

function HousingSection({ scenario, properties, housingEvents, onRefresh, onError }: HousingSectionProps) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col">
        {sectionHeader("Housing Events")}
        <div className="p-4">
          <p className="text-[12px] m-0" style={{ color: "var(--text-dim)" }}>
            No properties configured.{" "}
            <Link to="/housing" style={{ color: SECTION_ACCENT }}>
              Add properties in Housing
            </Link>{" "}
            to schedule sale events.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {sectionHeader("Housing Events")}
      <div className="p-4 flex flex-col gap-3">
        <p className="text-[12px] m-0" style={{ color: "var(--text-dim)" }}>
          Schedule property sales. Net proceeds are added to the portfolio in the sale year. The suggested amount uses current value adjusted for inflation to
          the sale year.
        </p>
        {properties.map((property) => {
          const event = housingEvents.find((e) => e.propertyId === property.id);
          return <PropertyEventRow key={property.id} property={property} event={event} scenario={scenario} onRefresh={onRefresh} onError={onError} />;
        })}
      </div>
    </div>
  );
}

interface PropertyEventRowProps {
  property: Property;
  event: HousingEvent | undefined;
  scenario: Scenario;
  onRefresh: () => void;
  onError: (err: unknown) => void;
}

function PropertyEventRow({ property, event, scenario, onRefresh, onError }: PropertyEventRowProps) {
  const [enabled, setEnabled] = useState(!!event);
  const [saleYear, setSaleYear] = useState(String(event?.saleYear ?? scenario.retirementYear + 5));
  const [netProceeds, setNetProceeds] = useState(String(event?.netProceeds ?? ""));

  const yr = Number.parseInt(saleYear, 10);
  const yearsOut = yr - CURRENT_YEAR;
  const suggestedValue = Math.round(property.estimatedValue * (1 + scenario.inflationRate / 100) ** Math.max(0, yearsOut));

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    if (!checked && event) {
      try {
        await deleteHousingEvent({ data: { id: event.id } });
        onRefresh();
      } catch (err) {
        onError(err);
        setEnabled(true);
      }
    } else if (checked) {
      setNetProceeds(String(suggestedValue));
    }
  };

  const handleSave = async () => {
    const amt = Number.parseFloat(netProceeds);
    if (!Number.isNaN(yr) && yr >= CURRENT_YEAR && !Number.isNaN(amt) && amt >= 0) {
      try {
        await upsertHousingEvent({ data: { scenarioId: scenario.id, propertyId: property.id, saleYear: yr, netProceeds: amt } });
        onRefresh();
      } catch (err) {
        onError(err);
      }
    }
  };

  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-3"
      style={{
        background: "var(--surface-raised)",
        border: `1px solid ${enabled ? `color-mix(in srgb, ${SECTION_ACCENT} 25%, var(--border))` : "var(--border)"}`,
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home size={13} style={{ color: enabled ? SECTION_ACCENT : "var(--text-dim)" }} />
          <span className="text-[13px] font-medium" style={{ color: enabled ? "var(--text)" : "var(--text-muted)" }}>
            {property.name}
          </span>
          <span className="text-[11px] num" style={{ color: "var(--text-dim)" }}>
            ({fmtCAD(property.estimatedValue)})
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>
            Plan to sell
          </span>
          <input type="checkbox" checked={enabled} onChange={(e) => handleToggle(e.target.checked)} />
        </label>
      </div>

      {enabled && (
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-[5px]">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
            <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
              Sale Year
            </label>
            <input
              type="number"
              min={CURRENT_YEAR}
              max={scenario.planningEndYear}
              step={1}
              value={saleYear}
              onChange={(e) => {
                setSaleYear(e.target.value);
                const y = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(y)) {
                  const yrsOut = y - CURRENT_YEAR;
                  const sugg = Math.round(property.estimatedValue * (1 + scenario.inflationRate / 100) ** Math.max(0, yrsOut));
                  setNetProceeds(String(sugg));
                }
              }}
              onBlur={handleSave}
              className={`num ${inlineInputCls}`}
              style={{ ...inlineInputCSS, width: 100 }}
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps the field via flex layout; association is clear */}
            <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
              Net Proceeds ($) <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>— suggested: {fmtCAD(suggestedValue)}</span>
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={netProceeds}
              onChange={(e) => setNetProceeds(e.target.value)}
              onBlur={handleSave}
              className={`num ${inlineInputCls}`}
              style={{ ...inlineInputCSS, width: 160 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ScenarioEditPage() {
  const router = useRouter();
  const { scenario, people, properties } = Route.useLoaderData();
  const [pageError, setPageError] = useState<unknown>(null);

  const refresh = () => router.invalidate();
  const onError = (err: unknown) => setPageError(err);

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 860 }}>
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
          {scenario.name}
        </h1>
      </div>

      {!!pageError && <InlineError error={pageError} onDismiss={() => setPageError(null)} />}

      {/* Sections */}
      {[
        <div key="identity" className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <IdentitySection scenario={scenario} onSaved={refresh} onError={onError} />
        </div>,

        <div key="contributions" className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <ContributionsSection scenario={scenario} contributions={scenario.contributions} onRefresh={refresh} onError={onError} />
        </div>,

        <div key="phases" className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <PhasesSection scenario={scenario} phases={scenario.phases} onRefresh={refresh} onError={onError} />
        </div>,

        <div key="cpp" className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <CppOasSection scenario={scenario} people={people} onRefresh={refresh} onError={onError} />
        </div>,

        <div key="housing" className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <HousingSection scenario={scenario} properties={properties} housingEvents={scenario.housingEvents} onRefresh={refresh} onError={onError} />
        </div>,
      ]}
    </div>
  );
}
