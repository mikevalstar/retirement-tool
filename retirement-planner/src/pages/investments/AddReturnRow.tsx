import { X } from "lucide-react";
import { useState } from "react";
import { ErrorDisplay } from "#/components/ErrorDisplay";
import { IconButton } from "#/components/IconButton";
import { createReturn } from "#/serverFns/investments/accountFns";

const ACCENT = "var(--section-investments)";

const inlineInputCls = "rounded py-1 px-1.5 text-xs outline-none box-border w-full";
const inlineInputCSS: React.CSSProperties = {
  background: "var(--app-bg)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  fontFamily: "inherit",
};

export function AddReturnRow({ accountId, onSaved, onCancel }: { accountId: number; onSaved: () => void; onCancel: () => void }) {
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [returnPct, setReturnPct] = useState("");
  const [showCalc, setShowCalc] = useState(false);
  const [calcStart, setCalcStart] = useState("");
  const [calcEnd, setCalcEnd] = useState("");
  const [calcContribs, setCalcContribs] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const canSave = returnPct !== "" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await createReturn({ data: { accountId, year: Number(year), returnPercent: Number(returnPct) } });
      onSaved();
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleCalculate = () => {
    const start = Number(calcStart);
    const end = Number(calcEnd);
    const net = Number(calcContribs) || 0;
    if (start !== 0) {
      setReturnPct((((end - start - net) / start) * 100).toFixed(2));
      setShowCalc(false);
    }
  };

  const labelCls = "text-[10px] mb-[3px] uppercase tracking-[0.05em]";

  return (
    <>
      <tr style={{ borderTop: "1px solid var(--border)", background: `color-mix(in srgb, ${ACCENT} 5%, transparent)` }}>
        <td className="py-[5px] px-2">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inlineInputCls}
            style={inlineInputCSS}
            autoFocus
          />
        </td>
        <td className="py-[5px] px-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={returnPct}
              onChange={(e) => setReturnPct(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className={`num ${inlineInputCls} text-right`}
              style={inlineInputCSS}
            />
            <button
              type="button"
              onClick={() => setShowCalc((v) => !v)}
              className="text-[10px] p-0 border-none bg-transparent cursor-pointer whitespace-nowrap shrink-0"
              style={{ color: showCalc ? ACCENT : "var(--text-dim)", fontFamily: "inherit" }}>
              Calc
            </button>
          </div>
        </td>
        <td className="py-[5px] px-1 w-6">
          <IconButton variant="ghost" onClick={onCancel}>
            <X size={11} style={{ color: "var(--text-dim)" }} />
          </IconButton>
        </td>
      </tr>
      {showCalc && (
        <tr style={{ background: `color-mix(in srgb, ${ACCENT} 3%, transparent)` }}>
          <td colSpan={3} className="px-2 pt-2 pb-[10px]" style={{ borderTop: "1px dashed var(--border)" }}>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <div className={labelCls} style={{ color: "var(--text-dim)" }}>
                    Start
                  </div>
                  <input
                    type="number"
                    value={calcStart}
                    onChange={(e) => setCalcStart(e.target.value)}
                    placeholder="0"
                    className={`num ${inlineInputCls}`}
                    style={inlineInputCSS}
                  />
                </div>
                <div className="flex-1">
                  <div className={labelCls} style={{ color: "var(--text-dim)" }}>
                    End
                  </div>
                  <input
                    type="number"
                    value={calcEnd}
                    onChange={(e) => setCalcEnd(e.target.value)}
                    placeholder="0"
                    className={`num ${inlineInputCls}`}
                    style={inlineInputCSS}
                  />
                </div>
              </div>
              <div>
                <div className={labelCls} style={{ color: "var(--text-dim)" }}>
                  Net Contributions
                </div>
                <input
                  type="number"
                  value={calcContribs}
                  onChange={(e) => setCalcContribs(e.target.value)}
                  placeholder="0"
                  className={`num ${inlineInputCls}`}
                  style={inlineInputCSS}
                />
              </div>
              <button
                type="button"
                onClick={handleCalculate}
                className="py-[5px] px-[10px] rounded text-[11px] cursor-pointer self-start"
                style={{
                  background: `color-mix(in srgb, ${ACCENT} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${ACCENT} 30%, transparent)`,
                  color: ACCENT,
                  fontFamily: "inherit",
                }}>
                Accept
              </button>
            </div>
          </td>
        </tr>
      )}
      {!!error && (
        <tr>
          <td colSpan={3} className="px-2 pb-2">
            <ErrorDisplay error={error} onDismiss={() => setError(null)} />
          </td>
        </tr>
      )}
    </>
  );
}
