import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarRange, Clock, Play, RefreshCw, TrendingUp, Upload } from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  accent: string;
}) {
  return (
    <div
      className="flex-1 px-5 py-[18px] rounded-lg flex flex-col gap-[10px] min-w-0"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center gap-1.5">
        <Icon size={13} style={{ color: accent }} />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
          {label}
        </span>
      </div>
      <div className="num text-[28px] font-medium leading-none" style={{ color: "var(--text)" }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {sub}
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  sub,
  accent,
  to,
  search,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  sub: string;
  accent: string;
  to: string;
  search?: Record<string, unknown>;
}) {
  return (
    <Link
      to={to as any}
      search={search as any}
      className="flex-1 flex items-center gap-[14px] px-[18px] py-[14px] rounded-lg cursor-pointer no-underline min-w-0"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        transition: "background 150ms, border-color 150ms",
      }}>
      <div
        className="w-[34px] h-[34px] rounded-[7px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)` }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-medium mb-0.5">{label}</div>
        <div className="text-xs" style={{ color: "var(--text-dim)" }}>
          {sub}
        </div>
      </div>
    </Link>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  return (
    <div className="max-w-[960px] flex flex-col gap-5">
      {/* Section heading */}
      <div className="flex items-baseline gap-[10px]">
        <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
          Dashboard
        </h1>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          February 2026
        </span>
      </div>

      {/* ── Row 1: Key stats ── */}
      <div className="flex gap-3.5">
        <StatCard label="Total Net Worth" value="$0" sub="No account balances recorded" icon={TrendingUp} accent="var(--section-dashboard)" />
        <StatCard label="Last Simulation" value="—" sub="Never run · click Run Simulation to start" icon={Clock} accent="var(--section-simulation)" />
        <StatCard label="Projected Retirement" value="—" sub="Run a simulation to see your range" icon={CalendarRange} accent="var(--section-investments)" />
      </div>

      {/* ── Row 2: Quick actions ── */}
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-[10px]" style={{ color: "var(--text-dim)" }}>
          Quick Actions
        </div>
        <div className="flex gap-3.5">
          <QuickAction icon={Upload} label="Import Expenses" sub="Paste or drop a credit card CSV" accent="var(--section-expenses)" to="/expenses" />
          <QuickAction
            icon={RefreshCw}
            label="Update Balances"
            sub="Tab through accounts, enter new values"
            accent="var(--section-investments)"
            to="/investments"
            search={{ update: true }}
          />
          <QuickAction icon={Play} label="Run Simulation" sub="Monte Carlo · generates percentile bands" accent="var(--section-simulation)" to="/simulation" />
        </div>
      </div>

      {/* ── Row 3: Net worth timeline chart (placeholder) ── */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="px-[18px] py-[14px] flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
            Net Worth Timeline
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
            Historical + projected band
          </span>
        </div>

        {/* Empty state */}
        <div className="h-[220px] flex flex-col items-center justify-center gap-[10px] relative overflow-hidden">
          {/* Decorative grid lines */}
          <svg aria-hidden className="absolute inset-0 w-full h-full opacity-[0.15]">
            {[0.25, 0.5, 0.75].map((y) => (
              <line key={y} x1="0" y1={`${y * 100}%`} x2="100%" y2={`${y * 100}%`} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="4 6" />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map((x) => (
              <line key={x} x1={`${x * 100}%`} y1="0" x2={`${x * 100}%`} y2="100%" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="4 6" />
            ))}
          </svg>

          <TrendingUp size={28} style={{ color: "var(--text-dim)", opacity: 0.4 }} />
          <div className="text-center">
            <div className="text-[13px] mb-1" style={{ color: "var(--text-muted)" }}>
              No simulation data yet
            </div>
            <div className="text-xs" style={{ color: "var(--text-dim)" }}>
              Run a simulation to see historical actuals + projected band
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
