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
      style={{
        flex: 1,
        padding: "18px 20px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        borderTop: `3px solid ${accent}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 0,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={13} style={{ color: accent }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
          {label}
        </span>
      </div>
      <div className="num" style={{ fontSize: 28, fontWeight: 500, color: "var(--text)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>
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
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        cursor: "pointer",
        textDecoration: "none",
        color: "var(--text)",
        transition: "background 150ms, border-color 150ms",
        minWidth: 0,
      }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 7,
          backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{sub}</div>
      </div>
    </Link>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  return (
    <div style={{ maxWidth: 960, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Section heading */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.02em",
          }}>
          Dashboard
        </h1>
        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>February 2026</span>
      </div>

      {/* ── Row 1: Key stats ── */}
      <div style={{ display: "flex", gap: 14 }}>
        <StatCard label="Total Net Worth" value="$0" sub="No account balances recorded" icon={TrendingUp} accent="var(--section-dashboard)" />
        <StatCard label="Last Simulation" value="—" sub="Never run · click Run Simulation to start" icon={Clock} accent="var(--section-simulation)" />
        <StatCard label="Projected Retirement" value="—" sub="Run a simulation to see your range" icon={CalendarRange} accent="var(--section-investments)" />
      </div>

      {/* ── Row 2: Quick actions ── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}>
          Quick Actions
        </div>
        <div style={{ display: "flex", gap: 14 }}>
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
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
        }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Net Worth Timeline</span>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Historical + projected band</span>
        </div>

        {/* Empty state */}
        <div
          style={{
            height: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            position: "relative",
            overflow: "hidden",
          }}>
          {/* Decorative grid lines */}
          <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}>
            {[0.25, 0.5, 0.75].map((y) => (
              <line key={y} x1="0" y1={`${y * 100}%`} x2="100%" y2={`${y * 100}%`} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="4 6" />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map((x) => (
              <line key={x} x1={`${x * 100}%`} y1="0" x2={`${x * 100}%`} y2="100%" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="4 6" />
            ))}
          </svg>

          <TrendingUp size={28} style={{ color: "var(--text-dim)", opacity: 0.4 }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>No simulation data yet</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Run a simulation to see historical actuals + projected band</div>
          </div>
        </div>
      </div>
    </div>
  );
}
