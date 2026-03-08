import { createFileRoute, useRouter } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { InlineError } from "#/components/InlineError";
import { getSimulationSettings, SECTION_ACCENT, upsertSimulationSettings } from "#/serverFns/simulation/settingsFns";

export const Route = createFileRoute("/simulation/settings/")({
  component: SimulationSettingsPage,
  loader: async () => await getSimulationSettings(),
});

// ─── Field row ────────────────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "var(--text)" }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{description}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="num"
          style={{
            width: 80,
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "4px 8px",
            fontSize: 13,
            color: "var(--text)",
            fontFamily: "inherit",
            outline: "none",
            textAlign: "right",
          }}
        />
        {suffix && <span style={{ fontSize: 12, color: "var(--text-dim)", width: 18 }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function SimulationSettingsPage() {
  const router = useRouter();
  const loaded = Route.useLoaderData();

  const [equityReturn, setEquityReturn] = useState(loaded.equityReturn);
  const [equityStdDev, setEquityStdDev] = useState(loaded.equityStdDev);
  const [fixedReturn, setFixedReturn] = useState(loaded.fixedReturn);
  const [fixedStdDev, setFixedStdDev] = useState(loaded.fixedStdDev);
  const [cashReturn, setCashReturn] = useState(loaded.cashReturn);
  const [cashStdDev, setCashStdDev] = useState(loaded.cashStdDev);
  const [cppBaseMultiplier, setCppBaseMultiplier] = useState(Math.round(loaded.cppBaseMultiplier * 100));
  const [numRuns, setNumRuns] = useState(loaded.numRuns);
  const [error, setError] = useState<unknown>(null);

  const save = async () => {
    try {
      await upsertSimulationSettings({
        data: {
          equityReturn,
          equityStdDev,
          fixedReturn,
          fixedStdDev,
          cashReturn,
          cashStdDev,
          cppBaseMultiplier: cppBaseMultiplier / 100,
          numRuns,
        },
      });
      router.invalidate();
    } catch (err) {
      setError(err);
    }
  };

  const section = (title: string, subtitle: string, rows: React.ReactNode) => (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</div>
      </div>
      {rows}
    </section>
  );

  return (
    <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
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
          <SlidersHorizontal size={15} style={{ color: SECTION_ACCENT }} />
        </div>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>Simulation Settings</h1>
      </div>

      {!!error && <InlineError error={error} onDismiss={() => setError(null)} />}

      {section(
        "Equity Returns",
        "Expected return and annual volatility for the equity portion of the portfolio",
        <>
          <SettingRow label="Expected annual return" value={equityReturn} onChange={setEquityReturn} min={-20} max={30} step={0.1} suffix="%" />
          <SettingRow label="Annual standard deviation (volatility)" value={equityStdDev} onChange={setEquityStdDev} min={0} max={60} step={0.5} suffix="%" />
        </>,
      )}

      {section(
        "Fixed Income Returns",
        "Expected return and annual volatility for bonds and fixed income holdings",
        <>
          <SettingRow label="Expected annual return" value={fixedReturn} onChange={setFixedReturn} min={-10} max={20} step={0.1} suffix="%" />
          <SettingRow label="Annual standard deviation (volatility)" value={fixedStdDev} onChange={setFixedStdDev} min={0} max={40} step={0.5} suffix="%" />
        </>,
      )}

      {section(
        "Cash Returns",
        "Expected return and annual volatility for cash and money market holdings",
        <>
          <SettingRow label="Expected annual return" value={cashReturn} onChange={setCashReturn} min={0} max={10} step={0.1} suffix="%" />
          <SettingRow label="Annual standard deviation (volatility)" value={cashStdDev} onChange={setCashStdDev} min={0} max={10} step={0.25} suffix="%" />
        </>,
      )}

      {section(
        "CPP / OAS",
        "CPP benefit is calculated as a percentage of the 2026 published maximum ($1,507.65/mo at age 65)",
        <SettingRow
          label="CPP base as % of maximum"
          description="70% is a conservative estimate for most earners. Adjust if you have a strong contribution history."
          value={cppBaseMultiplier}
          onChange={setCppBaseMultiplier}
          min={10}
          max={100}
          step={1}
          suffix="%"
        />,
      )}

      {section(
        "Simulation Engine",
        "More runs produce smoother percentile bands but take longer to compute",
        <SettingRow label="Simulations per run" value={numRuns} onChange={setNumRuns} min={500} max={5000} step={500} />,
      )}

      {/* Save button */}
      <div>
        <button
          type="button"
          onClick={save}
          style={{
            padding: "8px 20px",
            borderRadius: 6,
            background: `color-mix(in srgb, ${SECTION_ACCENT} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${SECTION_ACCENT} 35%, transparent)`,
            color: SECTION_ACCENT,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "inherit",
            cursor: "pointer",
          }}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
