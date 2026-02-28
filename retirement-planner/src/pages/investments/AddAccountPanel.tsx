import { useState } from "react";
import { ErrorDisplay } from "#/components/ErrorDisplay";
import { Field } from "#/components/Field";
import { SlidePanel } from "#/components/SlidePanel";
import type { AccountType } from "#/generated/prisma/enums";
import { createAccount, type getPeople } from "#/routes/investments/accountFns";

type PersonItem = Awaited<ReturnType<typeof getPeople>>[number];

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

export function AddAccountPanel({ people, onClose, onSaved }: { people: PersonItem[]; onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("TFSA");
  const [ownerId, setOwnerId] = useState<number>(people[0]?.id ?? 0);
  const [balance, setBalance] = useState("");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await createAccount({
        data: {
          name: name.trim(),
          type,
          ownerId,
          initialBalance: balance !== "" ? Number(balance) : undefined,
          initialDate: balance !== "" ? date : undefined,
        },
      });
      onSaved();
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  return (
    <SlidePanel
      title="Add Account"
      width={380}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={panelCancelBtnCls} style={panelCancelBtnCSS}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSave} className={panelSaveBtnCls(canSave)} style={panelSaveBtnCSS(canSave)}>
            {saving ? "Saving…" : "Save Account"}
          </button>
        </>
      }>
      <div className="p-5 flex flex-col gap-4">
        <Field label="Name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. TD TFSA"
            className={panelInputCls}
            style={panelInputCSS}
          />
        </Field>

        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className={panelInputCls} style={panelInputCSS}>
            <option value="TFSA">TFSA</option>
            <option value="RRSP">RRSP</option>
            <option value="RRIF">RRIF</option>
            <option value="REGULAR_SAVINGS">Regular Savings</option>
            <option value="CHEQUING">Chequing</option>
          </select>
        </Field>

        <Field label="Owner">
          <select value={ownerId} onChange={(e) => setOwnerId(Number(e.target.value))} className={panelInputCls} style={panelInputCSS}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Initial Balance (optional)">
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0"
            className={`num ${panelInputCls}`}
            style={panelInputCSS}
          />
        </Field>

        <Field label="As of Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={panelInputCls} style={panelInputCSS} />
        </Field>

        {!!error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
      </div>
    </SlidePanel>
  );
}
