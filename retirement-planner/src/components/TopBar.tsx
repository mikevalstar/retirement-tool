import { useRouterState } from "@tanstack/react-router";
import { ChevronRight, Command, Play } from "lucide-react";

// ─── Breadcrumb helpers ───────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  investments: "Investments",
  income: "Income",
  expenses: "Expenses",
  housing: "Housing",
  taxes: "Taxes",
  scenarios: "Scenarios",
  simulation: "Simulation",
  settings: "Settings",
};

const PAGE_LABELS: Record<string, string> = {
  accounts: "Accounts",
  allocations: "Allocations",
  "glide-paths": "Glide Paths",
  employment: "Employment",
  "social-security": "Social Security",
  "passive-streams": "Passive Streams",
  "monthly-import": "Monthly Import",
  "budget-baseline": "Budget Baseline",
  categories: "Categories",
  mortgage: "Mortgage",
  "home-equity": "Home Equity",
  "future-events": "Future Events",
  overview: "Overview",
  "roth-scenarios": "Roth Scenarios",
  rmds: "RMDs",
  configure: "Configure",
  compare: "Compare",
  run: "Run",
  results: "Results",
};

function getBreadcrumb(pathname: string): string[] {
  if (pathname === "/") return ["Dashboard"];
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg) => SECTION_LABELS[seg] ?? PAGE_LABELS[seg] ?? seg);
}

function getSectionColor(pathname: string): string {
  if (pathname === "/") return "var(--section-dashboard)";
  if (pathname.startsWith("/investments")) return "var(--section-investments)";
  if (pathname.startsWith("/income")) return "var(--section-income)";
  if (pathname.startsWith("/expenses")) return "var(--section-expenses)";
  if (pathname.startsWith("/housing")) return "var(--section-housing)";
  if (pathname.startsWith("/taxes")) return "var(--section-taxes)";
  if (pathname.startsWith("/scenarios")) return "var(--section-scenarios)";
  if (pathname.startsWith("/simulation")) return "var(--section-simulation)";
  return "var(--text-dim)";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopBar() {
  const { location } = useRouterState();
  const pathname = location.pathname;
  const crumbs = getBreadcrumb(pathname);
  const sectionColor = getSectionColor(pathname);

  return (
    <div className="h-11 flex items-center px-4 gap-[10px] shrink-0" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--sidebar-bg)" }}>
      {/* Breadcrumb */}
      <div className="flex flex-1 items-center gap-1.5 min-w-0">
        {/* Section color indicator */}
        <div className="w-[3px] h-[14px] rounded-[2px] shrink-0" style={{ backgroundColor: sectionColor, transition: "background-color 200ms ease" }} />

        {crumbs.map((label, i) => (
          <span key={label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={11} className="shrink-0" style={{ color: "var(--text-dim)" }} />}
            <span
              className="whitespace-nowrap text-[13px]"
              style={{
                color: i === crumbs.length - 1 ? "var(--text)" : "var(--text-muted)",
                fontWeight: i === crumbs.length - 1 ? 500 : 400,
              }}>
              {label}
            </span>
          </span>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* ⌘K palette stub */}
        <button
          type="button"
          title="Command palette (Ctrl+K)"
          className="flex items-center gap-1 py-[3px] px-[7px] rounded-[5px] text-[11px] tracking-[0.02em] cursor-pointer"
          style={{
            background: "rgba(240, 246, 252, 0.04)",
            border: "1px solid var(--border)",
            color: "var(--text-dim)",
            fontFamily: "inherit",
          }}>
          <Command size={10} />
          <span>K</span>
        </button>

        {/* Run Simulation */}
        <button
          type="button"
          title="Run Simulation"
          className="flex items-center gap-1.5 py-1 px-3 rounded-[5px] text-xs font-medium cursor-pointer"
          style={{
            background: "color-mix(in srgb, var(--section-dashboard) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--section-dashboard) 28%, transparent)",
            color: "var(--section-dashboard)",
            fontFamily: "inherit",
          }}>
          <Play size={10} fill="currentColor" />
          <span>Run Simulation</span>
        </button>
      </div>
    </div>
  );
}
