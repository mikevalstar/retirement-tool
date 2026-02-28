import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, FileText, Upload } from "lucide-react";

export const Route = createFileRoute("/expenses/")({ component: ExpensesPage });

const ACCENT = "var(--section-expenses)";

function ExpensesPage() {
  return (
    <div className="max-w-[960px] flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-[10px]">
        <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: ACCENT }} />
        <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
          Expenses
        </h1>
      </div>

      {/* Sub-nav tabs */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
        {["Monthly Import", "Budget Baseline", "Categories"].map((tab, i) => (
          <button
            type="button"
            key={tab}
            className="py-2 px-4 text-[13px] cursor-pointer -mb-px"
            style={{
              fontFamily: "inherit",
              fontWeight: i === 0 ? 500 : 400,
              color: i === 0 ? ACCENT : "var(--text-muted)",
              background: "none",
              border: "none",
              borderBottom: i === 0 ? `2px solid ${ACCENT}` : "2px solid transparent",
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Monthly Import content ── */}
      <div className="flex flex-col gap-4">
        {/* Drop zone */}
        <div
          className="rounded-[10px] py-9 px-6 flex flex-col items-center gap-3 cursor-pointer"
          style={{
            border: `2px dashed color-mix(in srgb, ${ACCENT} 30%, var(--border))`,
            background: `color-mix(in srgb, ${ACCENT} 4%, var(--surface))`,
            transition: "border-color 150ms, background 150ms",
          }}>
          <div className="w-12 h-12 rounded-[10px] flex items-center justify-center" style={{ background: `color-mix(in srgb, ${ACCENT} 14%, transparent)` }}>
            <Upload size={22} style={{ color: ACCENT }} />
          </div>

          <div className="text-center">
            <div className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
              Drop a CSV or paste transactions
            </div>
            <div className="text-[12.5px] leading-[1.6]" style={{ color: "var(--text-muted)" }}>
              Export from your credit card or bank, then drop the file here.
              <br />
              Multiple cards can be imported in one session.
            </div>
          </div>

          <button
            type="button"
            className="py-[7px] px-[18px] rounded-md text-[13px] font-medium cursor-pointer mt-1"
            style={{
              background: `color-mix(in srgb, ${ACCENT} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${ACCENT} 35%, transparent)`,
              color: ACCENT,
              fontFamily: "inherit",
            }}>
            Choose file
          </button>
        </div>

        {/* Empty state */}
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {/* Table header */}
          <div className="grid py-[10px] px-4 gap-3" style={{ gridTemplateColumns: "1fr 1fr 120px 160px", borderBottom: "1px solid var(--border)" }}>
            {["Merchant", "Date", "Amount", "Category"].map((col) => (
              <span key={col} className="text-[11px] font-medium uppercase tracking-[0.07em]" style={{ color: "var(--text-dim)" }}>
                {col}
              </span>
            ))}
          </div>

          {/* Empty rows placeholder */}
          <div className="py-[40px] px-6 flex flex-col items-center gap-[10px]">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} style={{ color: "var(--text-dim)" }} />
              <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                No transactions imported for this month
              </span>
            </div>
            <div className="text-xs text-center" style={{ color: "var(--text-dim)" }}>
              Import a CSV above to begin reviewing and categorizing expenses
            </div>
          </div>
        </div>

        {/* How it works */}
        <div
          className="py-3.5 px-[18px] rounded-lg flex gap-3 items-start"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderLeft: `3px solid ${ACCENT}`,
          }}>
          <FileText size={14} className="mt-[1px] shrink-0" style={{ color: ACCENT }} />
          <div className="flex flex-col gap-1.5">
            <div className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>
              How import works
            </div>
            <ul className="m-0 pl-4 flex flex-col gap-1">
              {[
                "Known merchants auto-assign their saved category — those rows are collapsed",
                "Unknown merchants surface at the top for manual assignment",
                "Assignments are saved permanently — next import is faster",
                "A running sidebar shows category totals as you work",
              ].map((tip) => (
                <li key={tip} className="text-[12.5px] leading-[1.5]" style={{ color: "var(--text-muted)" }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
