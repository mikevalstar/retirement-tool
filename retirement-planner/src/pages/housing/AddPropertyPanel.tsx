import { useState } from "react";
import { Field } from "#/components/Field";
import { InlineError } from "#/components/InlineError";
import { SlidePanel } from "#/components/SlidePanel";
import { panelCancelBtnCls, panelCancelBtnCSS, panelInputCls, panelInputCSS, panelSaveBtnCls, panelSaveBtnCSS } from "#/lib/panelStyles";
import { createProperty, SECTION_ACCENT } from "#/serverFns/housing/propertyFns";

export function AddPropertyPanel({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [mortgageBalance, setMortgageBalance] = useState("");
  const [mortgageRate, setMortgageRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const canSave = name.trim().length > 0 && estimatedValue !== "" && mortgageBalance !== "" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await createProperty({
        data: {
          name: name.trim(),
          estimatedValue: Number(estimatedValue),
          mortgageBalance: Number(mortgageBalance),
          mortgageRate: mortgageRate ? Number(mortgageRate) : null,
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
      title="Add Property"
      width={380}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={panelCancelBtnCls} style={panelCancelBtnCSS}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSave} className={panelSaveBtnCls(canSave)} style={panelSaveBtnCSS(canSave, SECTION_ACCENT)}>
            {saving ? "Saving…" : "Save Property"}
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
            placeholder="e.g. Primary Residence"
            className={panelInputCls}
            style={panelInputCSS}
          />
        </Field>

        <Field label="Estimated Value (CAD)">
          <input
            type="number"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            placeholder="0"
            className={`num ${panelInputCls}`}
            style={panelInputCSS}
          />
        </Field>

        <Field label="Mortgage Balance (CAD)">
          <input
            type="number"
            value={mortgageBalance}
            onChange={(e) => setMortgageBalance(e.target.value)}
            placeholder="0"
            className={`num ${panelInputCls}`}
            style={panelInputCSS}
          />
        </Field>

        <Field label="Mortgage Rate (%)">
          <input
            type="number"
            step="0.01"
            value={mortgageRate}
            onChange={(e) => setMortgageRate(e.target.value)}
            placeholder="e.g. 5.25 (optional)"
            className={`num ${panelInputCls}`}
            style={panelInputCSS}
          />
        </Field>

        {!!error && <InlineError error={error} onDismiss={() => setError(null)} />}
      </div>
    </SlidePanel>
  );
}
