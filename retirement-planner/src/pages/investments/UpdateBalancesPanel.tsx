import { useState } from "react";
import { ErrorDisplay } from "#/components/ErrorDisplay";
import { Field } from "#/components/Field";
import { OwnerBadge } from "#/components/OwnerBadge";
import { SlidePanel } from "#/components/SlidePanel";
import { createBulkSnapshots, type getAccounts } from "#/serverFns/investments/accountFns";

type AccountItem = Awaited<ReturnType<typeof getAccounts>>[number];

const ACCENT = "var(--section-investments)";

const panelInputCls = "w-full rounded-md py-[7px] px-[10px] text-[13px] outline-none box-border";
const panelInputCSS: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  fontFamily: "inherit",
};

const panelCancelBtnCls = "py-[7px] px-4 rounded-md bg-transparent text-[13px] cursor-pointer";
const panelCancelBtnCSS: React.CSSProperties = { border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "inherit" };

const panelSaveBtnCls = (enabled: boolean) => `py-[7px] px-4 rounded-md text-[13px] font-medium ${enabled ? "cursor-pointer" : "cursor-default"}`;
const panelSaveBtnCSS = (enabled: boolean): React.CSSProperties => ({
  background: enabled ? `color-mix(in srgb, ${ACCENT} 20%, transparent)` : "var(--surface-raised)",
  border: `1px solid ${enabled ? `color-mix(in srgb, ${ACCENT} 40%, transparent)` : "var(--border)"}`,
  color: enabled ? ACCENT : "var(--text-dim)",
  fontFamily: "inherit",
});

const fmtCAD = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

export function UpdateBalancesPanel({ accounts, onClose, onSaved }: { accounts: AccountItem[]; onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const entries = accounts
    .map((a) => ({ accountId: a.id, balance: Number(values[a.id]) }))
    .filter((e) => values[e.accountId] !== undefined && values[e.accountId] !== "" && !Number.isNaN(e.balance));

  const handleSave = async () => {
    if (saving) return;
    if (entries.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createBulkSnapshots({ data: { date, entries } });
      onSaved();
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  return (
    <SlidePanel
      title="Update Balances"
      width={420}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={panelCancelBtnCls} style={panelCancelBtnCSS}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={panelSaveBtnCls(entries.length > 0)}
            style={panelSaveBtnCSS(entries.length > 0)}>
            {saving ? "Saving…" : entries.length > 0 ? `Save ${entries.length} Balance${entries.length !== 1 ? "s" : ""}` : "Save"}
          </button>
        </>
      }>
      {/* As of date */}
      <div className="py-3.5 px-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <Field label="As of Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={panelInputCls} style={panelInputCSS} />
        </Field>
      </div>

      {/* Error display */}
      {!!error && (
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Account list */}
      <div>
        {accounts.map((account) => {
          const snap = account.snapshots[0];
          return (
            <div key={account.id} className="py-[10px] px-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-[3px]">
                  <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                    {account.name}
                  </span>
                  <OwnerBadge name={account.owner.name} />
                </div>
                {snap ? (
                  <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>
                    <span className="num">{fmtCAD(snap.balance)}</span>
                    {" · "}
                    {fmtDate(snap.date)}
                  </div>
                ) : (
                  <div className="text-[11px] italic" style={{ color: "var(--text-dim)" }}>
                    No balance recorded
                  </div>
                )}
              </div>
              <input
                type="number"
                value={values[account.id] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [account.id]: e.target.value }))}
                placeholder="—"
                className={`num ${panelInputCls} !w-[120px] text-right`}
                style={panelInputCSS}
              />
            </div>
          );
        })}
      </div>
    </SlidePanel>
  );
}
