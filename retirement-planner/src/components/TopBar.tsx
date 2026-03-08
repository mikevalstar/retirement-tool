import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Command, Loader2, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { SlidePanel } from "#/components/SlidePanel";
import { type CrashProfile, getAllScenarios, runSimulation, type SimulationMode } from "#/serverFns/simulation/runSimulation";

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

// ─── Run simulation panel ─────────────────────────────────────────────────────

type ScenarioOption = { id: number; name: string; retirementYear: number };

const CRASH_LABELS: Record<CrashProfile, string> = {
  mild: "Mild — dot-com / 2020 style (~15%/yr probability)",
  severe: "Severe — 2008 financial crisis style (~7%/yr)",
  catastrophic: "Catastrophic — 1929 Great Depression style (~3%/yr)",
};

function RunSimulationPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [scenarioId, setScenarioId] = useState<number | null>(null);
  const [mode, setMode] = useState<SimulationMode>("standard");
  const [crashProfile, setCrashProfile] = useState<CrashProfile>("mild");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllScenarios()
      .then((rows) => {
        setScenarios(rows);
        if (rows.length > 0) setScenarioId(rows[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRun = async () => {
    if (!scenarioId) return;
    setRunning(true);
    setError(null);
    try {
      await runSimulation({
        data: {
          scenarioId,
          mode,
          crashProfile: mode === "stress" ? crashProfile : undefined,
        },
      });
      onClose();
      navigate({ to: "/simulation/results" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRunning(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    borderRadius: 5,
    padding: "7px 10px",
    fontSize: 13,
    color: "var(--text)",
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
  };

  const body = (
    <div style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-dim)", fontSize: 13 }}>
          <Loader2 size={14} className="animate-spin" />
          Loading scenarios…
        </div>
      ) : scenarios.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>No scenarios found. Create a scenario first.</div>
      ) : (
        <>
          {/* Scenario picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Scenario</div>
            <select value={scenarioId ?? ""} onChange={(e) => setScenarioId(Number(e.target.value))} style={inputStyle}>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (retire {s.retirementYear})
                </option>
              ))}
            </select>
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Mode</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["standard", "stress"] as SimulationMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    borderRadius: 5,
                    fontSize: 12.5,
                    fontWeight: mode === m ? 600 : 400,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    background:
                      mode === m
                        ? m === "stress"
                          ? "color-mix(in srgb, #f97316 15%, transparent)"
                          : "color-mix(in srgb, var(--section-simulation) 15%, transparent)"
                        : "var(--surface-raised)",
                    border: `1px solid ${
                      mode === m
                        ? m === "stress"
                          ? "color-mix(in srgb, #f97316 35%, transparent)"
                          : "color-mix(in srgb, var(--section-simulation) 35%, transparent)"
                        : "var(--border)"
                    }`,
                    color: mode === m ? (m === "stress" ? "#f97316" : "var(--section-simulation)") : "var(--text-dim)",
                    textTransform: "capitalize",
                  }}>
                  {m === "stress" ? "Stress Test" : "Standard"}
                </button>
              ))}
            </div>
          </div>

          {/* Crash profile (stress only) */}
          {mode === "stress" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Crash severity</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(Object.entries(CRASH_LABELS) as [CrashProfile, string][]).map(([profile, label]) => (
                  <label
                    key={profile}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      cursor: "pointer",
                      padding: "8px 10px",
                      borderRadius: 5,
                      border: `1px solid ${crashProfile === profile ? "color-mix(in srgb, #f97316 30%, transparent)" : "var(--border)"}`,
                      background: crashProfile === profile ? "color-mix(in srgb, #f97316 8%, transparent)" : "var(--surface-raised)",
                    }}>
                    <input
                      type="radio"
                      checked={crashProfile === profile}
                      onChange={() => setCrashProfile(profile)}
                      style={{ marginTop: 1, accentColor: "#f97316" }}
                    />
                    <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                fontSize: 12,
                color: "#f97316",
                padding: "8px 10px",
                borderRadius: 5,
                background: "color-mix(in srgb, #f97316 8%, transparent)",
                border: "1px solid color-mix(in srgb, #f97316 25%, transparent)",
              }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: "7px 16px",
          borderRadius: 5,
          fontSize: 13,
          fontFamily: "inherit",
          cursor: "pointer",
          background: "none",
          border: "1px solid var(--border)",
          color: "var(--text-dim)",
        }}>
        Cancel
      </button>
      <button
        type="button"
        onClick={handleRun}
        disabled={running || !scenarioId || loading}
        style={{
          padding: "7px 20px",
          borderRadius: 5,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "inherit",
          cursor: running || !scenarioId ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: running
            ? "color-mix(in srgb, var(--section-simulation) 10%, transparent)"
            : "color-mix(in srgb, var(--section-simulation) 18%, transparent)",
          border: "1px solid color-mix(in srgb, var(--section-simulation) 35%, transparent)",
          color: "var(--section-simulation)",
          opacity: !scenarioId || loading ? 0.5 : 1,
        }}>
        {running ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Crunching{" "}
            {scenarios.find((s) => s.id === scenarioId)
              ? `${scenarioId}` // just show something is happening
              : "…"}{" "}
            futures…
          </>
        ) : (
          <>
            <Play size={12} fill="currentColor" />
            Run
          </>
        )}
      </button>
    </>
  );

  return (
    <SlidePanel title="Run Simulation" onClose={onClose} footer={footer}>
      {body}
    </SlidePanel>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopBar() {
  const { location } = useRouterState();
  const pathname = location.pathname;
  const crumbs = getBreadcrumb(pathname);
  const sectionColor = getSectionColor(pathname);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <div
        className="h-11 flex items-center px-4 gap-[10px] shrink-0"
        style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--sidebar-bg)" }}>
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
            onClick={() => setPanelOpen(true)}
            title="Run Simulation"
            className="flex items-center gap-1.5 py-1 px-3 rounded-[5px] text-xs font-medium cursor-pointer"
            style={{
              background: "color-mix(in srgb, var(--section-simulation) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--section-simulation) 28%, transparent)",
              color: "var(--section-simulation)",
              fontFamily: "inherit",
            }}>
            <Play size={10} fill="currentColor" />
            <span>Run Simulation</span>
          </button>
        </div>
      </div>

      {panelOpen && <RunSimulationPanel onClose={() => setPanelOpen(false)} />}
    </>
  );
}
