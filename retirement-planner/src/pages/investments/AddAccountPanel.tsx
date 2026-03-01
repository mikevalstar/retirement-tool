import { useState } from "react";
import { Field } from "#/components/Field";
import { InlineError } from "#/components/InlineError";
import { SlidePanel } from "#/components/SlidePanel";
import type { AccountType } from "#/generated/prisma/enums";
import { DATE_FORMATS, dayjs } from "#/lib/date";
import { panelCancelBtnCls, panelCancelBtnCSS, panelInputCls, panelInputCSS, panelSaveBtnCls, panelSaveBtnCSS } from "#/lib/panelStyles";
import { createAccount, type getPeople } from "#/serverFns/investments/accountFns";

type PersonItem = Awaited<ReturnType<typeof getPeople>>[number];

export function AddAccountPanel({ people, onClose, onSaved }: { people: PersonItem[]; onClose: () => void; onSaved: () => void }) {
  const today = dayjs().format(DATE_FORMATS.ISO);
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

        {!!error && <InlineError error={error} onDismiss={() => setError(null)} />}
      </div>
    </SlidePanel>
  );
}
