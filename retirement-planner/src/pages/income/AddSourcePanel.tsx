import { useState } from "react";
import { Field } from "#/components/Field";
import { InlineError } from "#/components/InlineError";
import { SlidePanel } from "#/components/SlidePanel";
import type { IncomeFrequency } from "#/generated/prisma/enums";
import { panelCancelBtnCls, panelCancelBtnCSS, panelInputCls, panelInputCSS, panelSaveBtnCls, panelSaveBtnCSS } from "#/lib/panelStyles";
import { createIncomeSource, type getPeople, SECTION_ACCENT } from "#/serverFns/income/sourceFns";

type PersonItem = Awaited<ReturnType<typeof getPeople>>[number];

export function AddSourcePanel({ people, onClose, onSaved }: { people: PersonItem[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState<number>(people[0]?.id ?? 0);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<IncomeFrequency>("ANNUAL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const canSave = name.trim().length > 0 && amount !== "" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await createIncomeSource({
        data: {
          name: name.trim(),
          ownerId,
          amount: Number(amount),
          frequency,
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
      title="Add Income Source"
      width={380}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={panelCancelBtnCls} style={panelCancelBtnCSS}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSave} className={panelSaveBtnCls(canSave)} style={panelSaveBtnCSS(canSave, SECTION_ACCENT)}>
            {saving ? "Saving…" : "Save Source"}
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
            placeholder="e.g. Software Engineer"
            className={panelInputCls}
            style={panelInputCSS}
          />
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

        <Field label="Amount (CAD)">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={`num ${panelInputCls}`}
            style={panelInputCSS}
          />
        </Field>

        <Field label="Frequency">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as IncomeFrequency)} className={panelInputCls} style={panelInputCSS}>
            <option value="ANNUAL">Annual</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </Field>

        {!!error && <InlineError error={error} onDismiss={() => setError(null)} />}
      </div>
    </SlidePanel>
  );
}
