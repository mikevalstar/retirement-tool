import { createFileRoute, useRouter } from "@tanstack/react-router";
import { GitCommitHorizontal, Plus, Trash2, TrendingDown } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorDisplay } from "#/components/ErrorDisplay";
import { SlidePanel } from "#/components/SlidePanel";
import { dayjs } from "#/lib/date";
import { SECTION_ACCENT } from "#/lib/formatters";
import { panelCancelBtnCls, panelCancelBtnCSS, panelInputCls, panelInputCSS, panelSaveBtnCls, panelSaveBtnCSS } from "#/lib/panelStyles";
import { thCls, thCSS } from "#/lib/tableStyles";
import { deleteWaypoint, getWaypoints, upsertWaypoint } from "#/serverFns/investments/glidePathFns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Waypoint = Awaited<ReturnType<typeof getWaypoints>>[number];

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/investments/glide-paths/")({
  component: GlidePathsPage,
  loader: async () => {
    const waypoints = await getWaypoints();
    return { waypoints };
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ─── Explainer Panel ──────────────────────────────────────────────────────────

function ExplainerPanel() {
  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-3"
      style={{
        background: `color-mix(in srgb, ${SECTION_ACCENT} 5%, var(--surface))`,
        border: `1px solid color-mix(in srgb, ${SECTION_ACCENT} 20%, var(--border))`,
      }}>
      <div className="flex items-center gap-2">
        <GitCommitHorizontal size={15} style={{ color: SECTION_ACCENT, flexShrink: 0 }} />
        <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
          What is a glide path?
        </span>
      </div>
      <p className="text-[13px] leading-[1.6] m-0" style={{ color: "var(--text-muted)" }}>
        A glide path is your de-risking plan. You set a series of yearly targets — for example: in 2030 be at 75% equities, in 2040 be at 55%, in 2050 be at
        40%. The simulation interpolates between your waypoints to model how returns should shift year by year.
      </p>
      <p className="text-[13px] leading-[1.6] m-0" style={{ color: "var(--text-muted)" }}>
        <span className="font-medium" style={{ color: "var(--text)" }}>
          Why does the glide path continue past retirement?
        </span>{" "}
        If you retire at 65 and live to 90, your portfolio has a 25-year drawdown horizon. Locking into a fully conservative allocation at retirement leaves too
        little growth potential for those later decades. A "through retirement" glide path keeps de-risking gradually — reaching its most conservative point
        around age 80–85, not at the retirement date itself.
      </p>
      <p className="text-[13px] leading-[1.6] m-0" style={{ color: "var(--text-muted)" }}>
        <span className="font-medium" style={{ color: SECTION_ACCENT }}>
          Tip:
        </span>{" "}
        Add at least 3–4 waypoints: one near today, one at your target retirement year, and one or two in the years well beyond retirement.
      </p>
    </div>
  );
}

// ─── Add Waypoint Panel ───────────────────────────────────────────────────────

interface AddPanelProps {
  existingYears: Set<number>;
  onSaved: () => void;
  onClose: () => void;
  onError: (err: unknown) => void;
}

function AddWaypointPanel({ existingYears, onSaved, onClose, onError }: AddPanelProps) {
  const [yearStr, setYearStr] = useState("");
  const [equityStr, setEquityStr] = useState("");
  const [fixedStr, setFixedStr] = useState("");
  const [cashStr, setCashStr] = useState("");
  const [saving, setSaving] = useState(false);

  const year = Number.parseInt(yearStr, 10);
  const eq = Number(equityStr) || 0;
  const fi = Number(fixedStr) || 0;
  const ca = Number(cashStr) || 0;
  const sum = eq + fi + ca;
  const sumOk = Math.round(sum) === 100;
  const yearValid = !Number.isNaN(year) && year >= 1900 && year <= 2200;
  const isDuplicate = yearValid && existingYears.has(year);
  const anyAlloc = equityStr !== "" || fixedStr !== "" || cashStr !== "";
  const canSave = yearValid && sumOk && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await upsertWaypoint({ data: { year, equityPct: eq, fixedIncomePct: fi, cashPct: ca } });
      onSaved();
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  const allocFields = [
    { label: "Equities %", value: equityStr, set: setEquityStr },
    { label: "Fixed Income %", value: fixedStr, set: setFixedStr },
    { label: "Cash %", value: cashStr, set: setCashStr },
  ];

  return (
    <SlidePanel
      title="Add Waypoint"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={panelCancelBtnCls} style={panelCancelBtnCSS}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSave} className={panelSaveBtnCls(canSave)} style={panelSaveBtnCSS(canSave)}>
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }>
      <div className="p-5 flex flex-col gap-5">
        {/* Year */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
            Year
          </span>
          <input
            type="number"
            min={1900}
            max={2200}
            step={1}
            value={yearStr}
            onChange={(e) => setYearStr(e.target.value)}
            placeholder="e.g. 2035"
            className={`num ${panelInputCls}`}
            style={panelInputCSS}
          />
          {isDuplicate && (
            <p className="text-[12px] m-0" style={{ color: "var(--color-warning, #f59e0b)" }}>
              A waypoint for {year} already exists — saving will replace it.
            </p>
          )}
        </label>

        {/* Allocation inputs */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
            Allocation
          </span>
          {allocFields.map(({ label, value, set }) => (
            <label key={label} className="flex flex-col gap-1.5">
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder="0"
                className={`num ${panelInputCls}`}
                style={panelInputCSS}
              />
            </label>
          ))}
        </div>

        {/* Live total */}
        <div className="flex items-center justify-between rounded-md px-3 py-2.5" style={{ background: "var(--app-bg)", border: "1px solid var(--border)" }}>
          <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>
            Total
          </span>
          <span
            className="num text-[13px] font-semibold"
            style={{
              color: sumOk ? "var(--color-positive)" : anyAlloc ? "var(--color-negative)" : "var(--text-dim)",
            }}>
            {sum.toFixed(1)}%
          </span>
        </div>

        {anyAlloc && !sumOk && (
          <p className="text-[12px] m-0" style={{ color: "var(--color-negative)" }}>
            Percentages must sum to exactly 100.
          </p>
        )}
      </div>
    </SlidePanel>
  );
}

// ─── Waypoint Table ───────────────────────────────────────────────────────────

interface TableProps {
  waypoints: Waypoint[];
  onDelete: (id: number) => Promise<void>;
}

function WaypointTable({ waypoints, onDelete }: TableProps) {
  const currentYear = dayjs().year();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Nearest future waypoint: smallest year >= currentYear
  const nearestFutureYear = waypoints.find((w) => w.year >= currentYear)?.year ?? null;

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th className={thCls("left")} style={thCSS}>
              Year
            </th>
            <th className={thCls("right")} style={thCSS}>
              Equities
            </th>
            <th className={thCls("right")} style={thCSS}>
              Fixed Income
            </th>
            <th className={thCls("right")} style={thCSS}>
              Cash
            </th>
            <th className={thCls("right")} style={thCSS} />
          </tr>
        </thead>
        <tbody>
          {waypoints.map((w) => {
            const isPast = w.year < currentYear;
            const isNearest = w.year === nearestFutureYear;
            const isDeleting = deletingId === w.id;
            const isHovered = hoveredId === w.id;

            return (
              <tr
                key={w.id}
                onMouseEnter={() => setHoveredId(w.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  borderTop: "1px solid var(--border)",
                  opacity: isPast ? 0.45 : 1,
                  background: isNearest ? `color-mix(in srgb, ${SECTION_ACCENT} 6%, transparent)` : isHovered ? "var(--surface-raised)" : "transparent",
                  transition: "background 0.1s",
                }}>
                <td className="py-[10px] px-3">
                  <div className="flex items-center gap-2">
                    {isNearest && (
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SECTION_ACCENT }} title="Current position in plan" />
                    )}
                    <span className="num font-medium" style={{ color: isPast ? "var(--text-muted)" : "var(--text)" }}>
                      {w.year}
                    </span>
                    {isPast && (
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                        past
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-[10px] px-3 text-right num" style={{ color: isPast ? "var(--text-dim)" : "var(--text)" }}>
                  {fmtPct(w.equityPct)}
                </td>
                <td className="py-[10px] px-3 text-right num" style={{ color: isPast ? "var(--text-dim)" : "var(--text)" }}>
                  {fmtPct(w.fixedIncomePct)}
                </td>
                <td className="py-[10px] px-3 text-right num" style={{ color: isPast ? "var(--text-dim)" : "var(--text)" }}>
                  {fmtPct(w.cashPct)}
                </td>
                <td className="py-[10px] px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(w.id)}
                    disabled={isDeleting}
                    title="Delete waypoint"
                    className="flex items-center justify-center p-1 rounded border-none bg-transparent cursor-pointer ml-auto"
                    style={{
                      color: isHovered && !isDeleting ? "var(--color-negative)" : "var(--text-dim)",
                      opacity: isDeleting ? 0.4 : 1,
                      transition: "color 0.15s",
                    }}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

const EQUITY_COLOR = "var(--section-investments)";
const FIXED_COLOR = "var(--chart-fixed-income)";
const CASH_COLOR = "var(--chart-cash)";

const FUTURE_KEY_LABELS: Record<string, string> = {
  equityFuture: "Equities",
  fixedFuture: "Fixed Income",
  cashFuture: "Cash",
};

interface ChartPoint {
  year: number;
  equityPast?: number;
  fixedPast?: number;
  cashPast?: number;
  equityFuture?: number;
  fixedFuture?: number;
  cashFuture?: number;
}

function buildChartData(waypoints: Waypoint[], currentYear: number): ChartPoint[] {
  const sorted = [...waypoints].sort((a, b) => a.year - b.year);
  const raw: { year: number; equity: number; fixed: number; cash: number }[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    for (let year = a.year; year < b.year; year++) {
      const t = (year - a.year) / (b.year - a.year);
      raw.push({
        year,
        equity: a.equityPct + t * (b.equityPct - a.equityPct),
        fixed: a.fixedIncomePct + t * (b.fixedIncomePct - a.fixedIncomePct),
        cash: a.cashPct + t * (b.cashPct - a.cashPct),
      });
    }
  }
  const last = sorted[sorted.length - 1];
  raw.push({ year: last.year, equity: last.equityPct, fixed: last.fixedIncomePct, cash: last.cashPct });

  return raw.map((p) => ({
    year: p.year,
    equityPast: p.year <= currentYear ? p.equity : undefined,
    fixedPast: p.year <= currentYear ? p.fixed : undefined,
    cashPast: p.year <= currentYear ? p.cash : undefined,
    equityFuture: p.year >= currentYear ? p.equity : undefined,
    fixedFuture: p.year >= currentYear ? p.fixed : undefined,
    cashFuture: p.year >= currentYear ? p.cash : undefined,
  }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: number;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.dataKey in FUTURE_KEY_LABELS && p.value != null);
  if (!items.length) return null;
  return (
    <div
      className="rounded-md px-3 py-2 text-[12px] flex flex-col gap-1"
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)" }}>
      <div className="font-medium num mb-0.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      {items.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span style={{ color: "var(--text-muted)" }}>{FUTURE_KEY_LABELS[item.dataKey]}</span>
          <span className="num font-medium ml-auto pl-4" style={{ color: "var(--text)" }}>
            {item.value.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function GlidePathChart({ waypoints }: { waypoints: Waypoint[] }) {
  const currentYear = dayjs().year();
  const data = buildChartData(waypoints, currentYear);

  return (
    <div className="rounded-lg px-4 pt-4 pb-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--text-dim)" }}>
        Allocation Trajectory
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="year"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickCount={6}
            allowDecimals={false}
            tick={{ fill: "var(--text-dim)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "var(--text-dim)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={38}
          />
          <Tooltip content={<ChartTooltip />} />

          {/* Past lines — dimmed */}
          <Line dataKey="equityPast" stroke={EQUITY_COLOR} strokeWidth={1.5} dot={false} opacity={0.3} legendType="none" isAnimationActive={false} />
          <Line dataKey="fixedPast" stroke={FIXED_COLOR} strokeWidth={1.5} dot={false} opacity={0.3} legendType="none" isAnimationActive={false} />
          <Line dataKey="cashPast" stroke={CASH_COLOR} strokeWidth={1.5} dot={false} opacity={0.3} legendType="none" isAnimationActive={false} />

          {/* Future lines */}
          <Line dataKey="equityFuture" stroke={EQUITY_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="fixedFuture" stroke={FIXED_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="cashFuture" stroke={CASH_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />

          {/* Current year marker */}
          <ReferenceLine
            x={currentYear}
            stroke="var(--text-dim)"
            strokeDasharray="4 4"
            label={{ value: "Today", position: "insideTopRight", style: { fill: "var(--text-dim)", fontSize: 10 } }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Manual legend */}
      <div className="flex gap-5 mt-2 justify-center">
        {(
          [
            { label: "Equities", color: EQUITY_COLOR },
            { label: "Fixed Income", color: FIXED_COLOR },
            { label: "Cash", color: CASH_COLOR },
          ] as const
        ).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-4 rounded-full" style={{ height: 2, backgroundColor: color }} />
            <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div
      className="rounded-lg flex flex-col items-center justify-center gap-2 py-10"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <TrendingDown size={20} style={{ color: "var(--text-dim)" }} />
      <p className="text-[13px] m-0" style={{ color: "var(--text-dim)" }}>
        Add at least two waypoints to see your glide path trajectory.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function GlidePathsPage() {
  const router = useRouter();
  const { waypoints } = Route.useLoaderData();
  const [panelOpen, setPanelOpen] = useState(false);
  const [pageError, setPageError] = useState<unknown>(null);

  const existingYears = new Set(waypoints.map((w) => w.year));

  const handleDelete = async (id: number) => {
    try {
      await deleteWaypoint({ data: { id } });
      router.invalidate();
    } catch (err) {
      setPageError(err);
    }
  };

  const handleSaved = () => {
    setPanelOpen(false);
    router.invalidate();
  };

  const isEmpty = waypoints.length === 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-[10px]">
          <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: SECTION_ACCENT }} />
          <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
            Glide Paths
          </h1>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-1.5 py-[7px] px-3 rounded-md text-[13px] font-medium cursor-pointer"
            style={{
              background: `color-mix(in srgb, ${SECTION_ACCENT} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${SECTION_ACCENT} 35%, transparent)`,
              color: SECTION_ACCENT,
              fontFamily: "inherit",
            }}>
            <Plus size={14} />
            Add Waypoint
          </button>
        )}
      </div>

      {!!pageError && <ErrorDisplay error={pageError} onDismiss={() => setPageError(null)} />}

      {/* Explainer — always visible */}
      <ExplainerPanel />

      {isEmpty ? (
        /* Empty state */
        <div
          className="rounded-lg flex flex-col items-center justify-center gap-4 py-14"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <GitCommitHorizontal size={24} style={{ color: "var(--text-dim)" }} />
          <div className="flex flex-col items-center gap-1">
            <p className="text-[14px] font-medium m-0" style={{ color: "var(--text)" }}>
              No waypoints yet
            </p>
            <p className="text-[13px] m-0" style={{ color: "var(--text-muted)" }}>
              Define your first allocation target to start building your glide path.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-1.5 py-[7px] px-4 rounded-md text-[13px] font-medium cursor-pointer"
            style={{
              background: `color-mix(in srgb, ${SECTION_ACCENT} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${SECTION_ACCENT} 35%, transparent)`,
              color: SECTION_ACCENT,
              fontFamily: "inherit",
            }}>
            <Plus size={14} />
            Add your first waypoint
          </button>
        </div>
      ) : (
        <>
          <WaypointTable waypoints={waypoints} onDelete={handleDelete} />
          {waypoints.length < 2 ? <ChartPlaceholder /> : <GlidePathChart waypoints={waypoints} />}
        </>
      )}

      {panelOpen && (
        <AddWaypointPanel
          existingYears={existingYears}
          onSaved={handleSaved}
          onClose={() => setPanelOpen(false)}
          onError={(err) => {
            setPageError(err);
            setPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}
