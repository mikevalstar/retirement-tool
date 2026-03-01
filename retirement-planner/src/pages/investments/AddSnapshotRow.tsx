import { X } from "lucide-react";
import { Fragment, useState } from "react";
import { ErrorDisplay } from "#/components/ErrorDisplay";
import { IconButton } from "#/components/IconButton";
import { SECTION_ACCENT } from "#/lib/formatters";
import { inlineInputCls, inlineInputCSS } from "#/lib/panelStyles";
import { createSnapshot } from "#/serverFns/investments/accountFns";

export function AddSnapshotRow({ accountId, onSaved, onCancel }: { accountId: number; onSaved: () => void; onCancel: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const canSave = balance !== "" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await createSnapshot({ data: { accountId, date, balance: Number(balance), note: note.trim() || undefined } });
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

  return (
    <Fragment>
      <tr style={{ borderTop: "1px solid var(--border)", background: `color-mix(in srgb, ${SECTION_ACCENT} 5%, transparent)` }}>
        <td className="py-[5px] px-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inlineInputCls}
            style={inlineInputCSS}
            autoFocus
          />
        </td>
        <td className="py-[5px] px-2">
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className={`num ${inlineInputCls} text-right`}
            style={inlineInputCSS}
          />
        </td>
        <td className="py-[5px] px-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Note (optional)"
            className={inlineInputCls}
            style={inlineInputCSS}
          />
        </td>
        <td className="py-[5px] px-1 w-6">
          <IconButton variant="ghost" onClick={onCancel}>
            <X size={11} style={{ color: "var(--text-dim)" }} />
          </IconButton>
        </td>
      </tr>
      {!!error && (
        <tr>
          <td colSpan={4} className="px-2 pb-2">
            <ErrorDisplay error={error} onDismiss={() => setError(null)} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
