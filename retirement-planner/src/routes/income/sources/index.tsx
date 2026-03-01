import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Fragment, useState } from "react";
import { EmptyState } from "#/components/EmptyState";
import { ExpandChevron } from "#/components/ExpandChevron";
import { IconButton } from "#/components/IconButton";
import { InlineError } from "#/components/InlineError";
import { OwnerBadge } from "#/components/OwnerBadge";
import type { IncomeFrequency } from "#/generated/prisma/enums";
import { fmtCAD } from "#/lib/formatters";
import { inlineInputCls, inlineInputCSS } from "#/lib/panelStyles";
import { thCls, thCSS } from "#/lib/tableStyles";
import { AddSourcePanel } from "#/pages/income/AddSourcePanel";
import { deleteIncomeSource, getIncomeSources, getPeople, SECTION_ACCENT, updateIncomeSource } from "#/serverFns/income/sourceFns";

const FREQ_LABEL: Record<IncomeFrequency, string> = {
  ANNUAL: "Annual",
  MONTHLY: "Monthly",
};

export const Route = createFileRoute("/income/sources/")({
  component: IncomeSourcesPage,
  loader: async () => {
    const [sources, people] = await Promise.all([getIncomeSources(), getPeople()]);
    return { sources, people };
  },
});

function IncomeSourcesPage() {
  const router = useRouter();
  const { sources, people } = Route.useLoaderData();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pageError, setPageError] = useState<unknown>(null);

  const [editName, setEditName] = useState("");
  const [editOwnerId, setEditOwnerId] = useState<number>(0);
  const [editAmount, setEditAmount] = useState("");
  const [editFrequency, setEditFrequency] = useState<IncomeFrequency>("ANNUAL");
  const [saving, setSaving] = useState(false);

  const toggleExpand = (source: { id: number; name: string; ownerId: number; amount: number; frequency: IncomeFrequency }) => {
    if (expandedId === source.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(source.id);
    setEditName(source.name);
    setEditOwnerId(source.ownerId);
    setEditAmount(String(source.amount));
    setEditFrequency(source.frequency);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave(id);
    } else if (e.key === " ") {
      e.preventDefault();
      const source = sources.find((s) => s.id === id);
      if (source) toggleExpand(source);
    }
  };

  const handleSave = async (id: number) => {
    if (!editName.trim() || editAmount === "") return;
    setSaving(true);
    setPageError(null);
    try {
      await updateIncomeSource({
        data: {
          id,
          name: editName.trim(),
          ownerId: editOwnerId,
          amount: Number(editAmount),
          frequency: editFrequency,
        },
      });
      setExpandedId(null);
      router.invalidate();
    } catch (err) {
      setPageError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteIncomeSource({ data: { id } });
      if (expandedId === id) setExpandedId(null);
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
              Income Sources
            </h1>
          </div>

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
            Add Source
          </button>
        </div>

        {!!pageError && <InlineError error={pageError} onDismiss={() => setPageError(null)} />}

        {sources.length === 0 ? (
          <EmptyState
            icon={<Wallet size={20} style={{ color: SECTION_ACCENT }} />}
            title="No income sources yet"
            description='Click "Add Source" to add your first income source.'
            accent={SECTION_ACCENT}
          />
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className={thCls("left")} style={thCSS}>
                    Source
                  </th>
                  <th className={thCls("left")} style={thCSS}>
                    Owner
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Amount
                  </th>
                  <th className={thCls("left")} style={thCSS}>
                    Frequency
                  </th>
                  <th className="w-9" />
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => {
                  const isExpanded = expandedId === source.id;
                  const annualAmount = source.frequency === "MONTHLY" ? source.amount * 12 : source.amount;

                  return (
                    <Fragment key={source.id}>
                      <tr
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpand(source)}
                        onKeyDown={(e) => handleKeyDown(e, source.id)}
                        className={`cursor-pointer ${!isExpanded && "hover:bg-[var(--surface-raised)]"}`}
                        style={{
                          borderTop: "1px solid var(--border)",
                          background: isExpanded ? `color-mix(in srgb, ${SECTION_ACCENT} 6%, transparent)` : "transparent",
                          transition: "background 0.1s",
                        }}>
                        <td className="py-[10px] px-3">
                          <div className="flex items-center gap-2">
                            <ExpandChevron expanded={isExpanded} />
                            <span className="font-medium" style={{ color: "var(--text)" }}>
                              {source.name}
                            </span>
                          </div>
                        </td>

                        <td className="py-[10px] px-3">
                          <OwnerBadge name={source.owner.name} />
                        </td>

                        <td className="py-[10px] px-3 text-right num">
                          <span style={{ color: "var(--text)" }}>{fmtCAD(annualAmount)}</span>
                          {source.frequency === "MONTHLY" && (
                            <span className="text-[11px] ml-1" style={{ color: "var(--text-dim)" }}>
                              /yr
                            </span>
                          )}
                        </td>

                        <td className="py-[10px] px-3" style={{ color: "var(--text-muted)" }}>
                          {FREQ_LABEL[source.frequency]}
                          {source.frequency === "MONTHLY" && (
                            <span className="text-[11px] ml-1" style={{ color: "var(--text-dim)" }}>
                              ({fmtCAD(source.amount)}/mo)
                            </span>
                          )}
                        </td>

                        <td className="py-[10px] px-2">
                          <IconButton
                            variant="ghost"
                            aria-label={`Delete ${source.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(source.id);
                            }}>
                            <Trash2 size={13} style={{ color: "var(--text-dim)" }} />
                          </IconButton>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr style={{ background: `color-mix(in srgb, ${SECTION_ACCENT} 6%, transparent)` }}>
                          <td colSpan={5} className="py-3 px-3" style={{ borderTop: "1px solid var(--border)" }}>
                            <div className="flex gap-4 items-end flex-wrap">
                              <div className="flex flex-col gap-[5px] min-w-[180px]">
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: Field is a layout wrapper; association is handled by the caller */}
                                <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                                  Name
                                </label>
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleSave(source.id)}
                                  className={inlineInputCls}
                                  style={inlineInputCSS}
                                />
                              </div>

                              <div className="flex flex-col gap-[5px] min-w-[120px]">
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: Field is a layout wrapper; association is handled by the caller */}
                                <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                                  Owner
                                </label>
                                <select
                                  value={editOwnerId}
                                  onChange={(e) => setEditOwnerId(Number(e.target.value))}
                                  className={inlineInputCls}
                                  style={inlineInputCSS}>
                                  {people.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex flex-col gap-[5px] min-w-[120px]">
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: Field is a layout wrapper; association is handled by the caller */}
                                <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                                  Amount (CAD)
                                </label>
                                <input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleSave(source.id)}
                                  className={`num ${inlineInputCls}`}
                                  style={inlineInputCSS}
                                />
                              </div>

                              <div className="flex flex-col gap-[5px] min-w-[100px]">
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: Field is a layout wrapper; association is handled by the caller */}
                                <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                                  Frequency
                                </label>
                                <select
                                  value={editFrequency}
                                  onChange={(e) => setEditFrequency(e.target.value as IncomeFrequency)}
                                  className={inlineInputCls}
                                  style={inlineInputCSS}>
                                  <option value="ANNUAL">Annual</option>
                                  <option value="MONTHLY">Monthly</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSave(source.id)}
                                disabled={saving || !editName.trim() || editAmount === ""}
                                className="py-1 px-3 rounded text-[12px] font-medium cursor-pointer"
                                style={{
                                  background:
                                    saving || !editName.trim() || editAmount === ""
                                      ? "var(--surface-raised)"
                                      : `color-mix(in srgb, ${SECTION_ACCENT} 20%, transparent)`,
                                  border: `1px solid ${saving || !editName.trim() || editAmount === "" ? "var(--border)" : `color-mix(in srgb, ${SECTION_ACCENT} 40%, transparent)`}`,
                                  color: saving || !editName.trim() || editAmount === "" ? "var(--text-dim)" : SECTION_ACCENT,
                                  fontFamily: "inherit",
                                  opacity: saving ? 0.6 : 1,
                                }}>
                                {saving ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {panelOpen && (
        <AddSourcePanel
          people={people}
          onClose={() => setPanelOpen(false)}
          onSaved={() => {
            setPanelOpen(false);
            router.invalidate();
          }}
        />
      )}
    </>
  );
}
