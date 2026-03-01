import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "#/components/EmptyState";
import { InlineError } from "#/components/InlineError";
import { SlidePanel } from "#/components/SlidePanel";
import { dayjs } from "#/lib/date";
import { panelCancelBtnCls, panelCancelBtnCSS, panelInputCls, panelInputCSS, panelSaveBtnCls, panelSaveBtnCSS } from "#/lib/panelStyles";
import { thCls, thCSS } from "#/lib/tableStyles";
import { createScenario, deleteScenario, getScenarios, SECTION_ACCENT } from "#/serverFns/scenarios/scenarioFns";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/scenarios/")({
  component: ScenariosPage,
  loader: async () => getScenarios(),
});

// ─── Add Scenario Panel ───────────────────────────────────────────────────────

interface AddPanelProps {
  onSaved: () => void;
  onClose: () => void;
  onError: (err: unknown) => void;
}

function AddScenarioPanel({ onSaved, onClose, onError }: AddPanelProps) {
  const currentYear = dayjs().year();
  const [name, setName] = useState("");
  const [retirementYear, setRetirementYear] = useState(String(currentYear + 20));
  const [planningEndYear, setPlanningEndYear] = useState(String(currentYear + 50));
  const [inflationRate, setInflationRate] = useState("3.0");
  const [saving, setSaving] = useState(false);

  const retYear = Number.parseInt(retirementYear, 10);
  const endYear = Number.parseInt(planningEndYear, 10);
  const infl = Number.parseFloat(inflationRate);

  const canSave =
    name.trim().length > 0 &&
    !Number.isNaN(retYear) &&
    retYear >= currentYear &&
    retYear <= 2100 &&
    !Number.isNaN(endYear) &&
    endYear > retYear &&
    endYear <= 2200 &&
    !Number.isNaN(infl) &&
    infl >= 0 &&
    infl <= 20 &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await createScenario({ data: { name: name.trim(), retirementYear: retYear, planningEndYear: endYear, inflationRate: infl } });
      onSaved();
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlidePanel
      title="New Scenario"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={panelCancelBtnCls} style={panelCancelBtnCSS}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSave} className={panelSaveBtnCls(canSave)} style={panelSaveBtnCSS(canSave)}>
            {saving ? "Creating…" : "Create scenario"}
          </button>
        </>
      }>
      <div className="p-5 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
            Name
          </span>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. Conservative, Retire at 60"
            className={panelInputCls}
            style={panelInputCSS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
            Retirement Year
          </span>
          <input
            type="number"
            min={currentYear}
            max={2100}
            step={1}
            value={retirementYear}
            onChange={(e) => setRetirementYear(e.target.value)}
            placeholder={String(currentYear + 20)}
            className={`num ${panelInputCls}`}
            style={panelInputCSS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
            Plan Through Year
          </span>
          <input
            type="number"
            min={currentYear + 1}
            max={2200}
            step={1}
            value={planningEndYear}
            onChange={(e) => setPlanningEndYear(e.target.value)}
            placeholder={String(currentYear + 50)}
            className={`num ${panelInputCls}`}
            style={panelInputCSS}
          />
          <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
            Expected end of plan — roughly when the longer-lived person would be ~90.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
            Inflation Rate (%)
          </span>
          <input
            type="number"
            min={0}
            max={20}
            step={0.1}
            value={inflationRate}
            onChange={(e) => setInflationRate(e.target.value)}
            placeholder="3.0"
            className={`num ${panelInputCls}`}
            style={panelInputCSS}
          />
        </label>
      </div>
    </SlidePanel>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ScenariosPage() {
  const router = useRouter();
  const scenarios = Route.useLoaderData();
  const [panelOpen, setPanelOpen] = useState(false);
  const [pageError, setPageError] = useState<unknown>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteScenario({ data: { id } });
      router.invalidate();
    } catch (err) {
      setPageError(err);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: SECTION_ACCENT }} />
            <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
              Scenarios
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {scenarios.length >= 2 && (
              <Link
                to="/scenarios/compare"
                className="flex items-center gap-1.5 py-1.5 px-[14px] rounded-md text-[12.5px] font-medium no-underline"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontFamily: "inherit",
                }}>
                Compare
              </Link>
            )}
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-[14px] rounded-md text-[12.5px] font-medium cursor-pointer"
              style={{
                background: `color-mix(in srgb, ${SECTION_ACCENT} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${SECTION_ACCENT} 30%, transparent)`,
                color: SECTION_ACCENT,
                fontFamily: "inherit",
              }}>
              <Plus size={13} />
              New Scenario
            </button>
          </div>
        </div>

        {!!pageError && <InlineError error={pageError} onDismiss={() => setPageError(null)} />}

        {scenarios.length === 0 ? (
          <EmptyState
            icon={<GitBranch size={20} style={{ color: SECTION_ACCENT }} />}
            title="No scenarios yet"
            description='Click "New Scenario" to define your first what-if retirement plan.'
            accent={SECTION_ACCENT}
          />
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className={thCls("left")} style={thCSS}>
                    Scenario
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Retirement
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Plan Through
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Inflation
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Phases
                  </th>
                  <th className="w-9" />
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario, i) => (
                  <tr
                    key={scenario.id}
                    style={{
                      borderTop: i === 0 ? undefined : "1px solid var(--border)",
                    }}>
                    <td className="py-[10px] px-3">
                      <Link
                        to="/scenarios/$scenarioId"
                        params={{ scenarioId: String(scenario.id) }}
                        className="font-medium no-underline hover:underline"
                        style={{ color: SECTION_ACCENT }}>
                        {scenario.name}
                      </Link>
                    </td>
                    <td className="py-[10px] px-3 text-right num" style={{ color: "var(--text)" }}>
                      {scenario.retirementYear}
                    </td>
                    <td className="py-[10px] px-3 text-right num" style={{ color: "var(--text-muted)" }}>
                      {scenario.planningEndYear}
                    </td>
                    <td className="py-[10px] px-3 text-right num" style={{ color: "var(--text-muted)" }}>
                      {scenario.inflationRate}%
                    </td>
                    <td className="py-[10px] px-3 text-right num" style={{ color: "var(--text-muted)" }}>
                      {scenario._count.phases}
                    </td>
                    <td className="py-[10px] px-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(scenario.id)}
                        aria-label={`Delete ${scenario.name}`}
                        className="flex items-center justify-center p-1 rounded border-none bg-transparent cursor-pointer ml-auto"
                        style={{ color: "var(--text-dim)" }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {panelOpen && (
        <AddScenarioPanel
          onSaved={() => {
            setPanelOpen(false);
            router.invalidate();
          }}
          onClose={() => setPanelOpen(false)}
          onError={(err) => {
            setPageError(err);
            setPanelOpen(false);
          }}
        />
      )}
    </>
  );
}
