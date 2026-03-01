import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Home, Plus, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { EmptyState } from "#/components/EmptyState";
import { ExpandChevron } from "#/components/ExpandChevron";
import { IconButton } from "#/components/IconButton";
import { InlineError } from "#/components/InlineError";
import { fmtCAD } from "#/lib/formatters";
import { inlineInputCls, inlineInputCSS } from "#/lib/panelStyles";
import { thCls, thCSS } from "#/lib/tableStyles";
import { AddPropertyPanel } from "#/pages/housing/AddPropertyPanel";
import { deleteProperty, getProperties, SECTION_ACCENT, updateProperty } from "#/serverFns/housing/propertyFns";

export const Route = createFileRoute("/housing/")({
  component: HousingPage,
  loader: async () => {
    return getProperties();
  },
});

function HousingPage() {
  const router = useRouter();
  const properties = Route.useLoaderData();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pageError, setPageError] = useState<unknown>(null);

  const [editName, setEditName] = useState("");
  const [editEstimatedValue, setEditEstimatedValue] = useState("");
  const [editMortgageBalance, setEditMortgageBalance] = useState("");
  const [editMortgageRate, setEditMortgageRate] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleExpand = (property: { id: number; name: string; estimatedValue: number; mortgageBalance: number; mortgageRate: number | null }) => {
    if (expandedId === property.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(property.id);
    setEditName(property.name);
    setEditEstimatedValue(String(property.estimatedValue));
    setEditMortgageBalance(String(property.mortgageBalance));
    setEditMortgageRate(property.mortgageRate !== null ? String(property.mortgageRate) : "");
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave(id);
    } else if (e.key === " ") {
      e.preventDefault();
      const property = properties.find((p) => p.id === id);
      if (property) toggleExpand(property);
    }
  };

  const handleSave = async (id: number) => {
    if (!editName.trim() || editEstimatedValue === "" || editMortgageBalance === "") return;
    setSaving(true);
    setPageError(null);
    try {
      await updateProperty({
        data: {
          id,
          name: editName.trim(),
          estimatedValue: Number(editEstimatedValue),
          mortgageBalance: Number(editMortgageBalance),
          mortgageRate: editMortgageRate ? Number(editMortgageRate) : null,
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
      await deleteProperty({ data: { id } });
      if (expandedId === id) setExpandedId(null);
      router.invalidate();
    } catch (err) {
      setPageError(err);
    }
  };

  const totalEquity = properties.reduce((sum, p) => sum + (p.estimatedValue - p.mortgageBalance), 0);
  const totalValue = properties.reduce((sum, p) => sum + p.estimatedValue, 0);
  const totalMortgage = properties.reduce((sum, p) => sum + p.mortgageBalance, 0);

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: SECTION_ACCENT }} />
            <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
              Housing
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
            Add Property
          </button>
        </div>

        {!!pageError && <InlineError error={pageError} onDismiss={() => setPageError(null)} />}

        {properties.length === 0 ? (
          <EmptyState
            icon={<Home size={20} style={{ color: SECTION_ACCENT }} />}
            title="No properties yet"
            description='Click "Add Property" to add your first property.'
            accent={SECTION_ACCENT}
          />
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className={thCls("left")} style={thCSS}>
                    Property
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Est. Value
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Mortgage
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Rate
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Equity
                  </th>
                  <th className="w-9" />
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => {
                  const isExpanded = expandedId === property.id;
                  const equity = property.estimatedValue - property.mortgageBalance;

                  return (
                    <Fragment key={property.id}>
                      <tr
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpand(property)}
                        onKeyDown={(e) => handleKeyDown(e, property.id)}
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
                              {property.name}
                            </span>
                          </div>
                        </td>

                        <td className="py-[10px] px-3 text-right num" style={{ color: "var(--text)" }}>
                          {fmtCAD(property.estimatedValue)}
                        </td>

                        <td className="py-[10px] px-3 text-right num" style={{ color: "var(--text)" }}>
                          {fmtCAD(property.mortgageBalance)}
                        </td>

                        <td className="py-[10px] px-3 text-right num" style={{ color: "var(--text-muted)" }}>
                          {property.mortgageRate !== null ? `${property.mortgageRate}%` : "—"}
                        </td>

                        <td className="py-[10px] px-3 text-right num font-medium" style={{ color: "var(--text)" }}>
                          {fmtCAD(equity)}
                        </td>

                        <td className="py-[10px] px-2">
                          <IconButton
                            variant="ghost"
                            aria-label={`Delete ${property.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(property.id);
                            }}>
                            <Trash2 size={13} style={{ color: "var(--text-dim)" }} />
                          </IconButton>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr style={{ background: `color-mix(in srgb, ${SECTION_ACCENT} 6%, transparent)` }}>
                          <td colSpan={6} className="py-3 px-3" style={{ borderTop: "1px solid var(--border)" }}>
                            <div className="flex gap-4 items-end flex-wrap">
                              <div className="flex flex-col gap-[5px] min-w-[180px]">
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: Field is a layout wrapper; association is handled by the caller */}
                                <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                                  Name
                                </label>
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleSave(property.id)}
                                  className={inlineInputCls}
                                  style={inlineInputCSS}
                                />
                              </div>

                              <div className="flex flex-col gap-[5px] min-w-[140px]">
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: Field is a layout wrapper; association is handled by the caller */}
                                <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                                  Est. Value (CAD)
                                </label>
                                <input
                                  type="number"
                                  value={editEstimatedValue}
                                  onChange={(e) => setEditEstimatedValue(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleSave(property.id)}
                                  className={`num ${inlineInputCls}`}
                                  style={inlineInputCSS}
                                />
                              </div>

                              <div className="flex flex-col gap-[5px] min-w-[140px]">
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: Field is a layout wrapper; association is handled by the caller */}
                                <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                                  Mortgage (CAD)
                                </label>
                                <input
                                  type="number"
                                  value={editMortgageBalance}
                                  onChange={(e) => setEditMortgageBalance(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleSave(property.id)}
                                  className={`num ${inlineInputCls}`}
                                  style={inlineInputCSS}
                                />
                              </div>

                              <div className="flex flex-col gap-[5px] min-w-[100px]">
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: Field is a layout wrapper; association is handled by the caller */}
                                <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                                  Rate (%)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editMortgageRate}
                                  onChange={(e) => setEditMortgageRate(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleSave(property.id)}
                                  placeholder="optional"
                                  className={`num ${inlineInputCls}`}
                                  style={inlineInputCSS}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSave(property.id)}
                                disabled={saving || !editName.trim() || editEstimatedValue === "" || editMortgageBalance === ""}
                                className="py-1 px-3 rounded text-[12px] font-medium cursor-pointer"
                                style={{
                                  background:
                                    saving || !editName.trim() || editEstimatedValue === "" || editMortgageBalance === ""
                                      ? "var(--surface-raised)"
                                      : `color-mix(in srgb, ${SECTION_ACCENT} 20%, transparent)`,
                                  border: `1px solid ${saving || !editName.trim() || editEstimatedValue === "" || editMortgageBalance === "" ? "var(--border)" : `color-mix(in srgb, ${SECTION_ACCENT} 40%, transparent)`}`,
                                  color:
                                    saving || !editName.trim() || editEstimatedValue === "" || editMortgageBalance === "" ? "var(--text-dim)" : SECTION_ACCENT,
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

                <tr style={{ borderTop: "2px solid var(--border)", background: "var(--surface-raised)" }}>
                  <td className="py-[10px] px-3 font-medium" style={{ color: "var(--text)" }}>
                    Total
                  </td>
                  <td className="py-[10px] px-3 text-right num font-medium" style={{ color: "var(--text)" }}>
                    {fmtCAD(totalValue)}
                  </td>
                  <td className="py-[10px] px-3 text-right num font-medium" style={{ color: "var(--text)" }}>
                    {fmtCAD(totalMortgage)}
                  </td>
                  <td className="py-[10px] px-3" />
                  <td className="py-[10px] px-3 text-right num font-medium" style={{ color: "var(--text)" }}>
                    {fmtCAD(totalEquity)}
                  </td>
                  <td className="py-[10px] px-2" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {panelOpen && (
        <AddPropertyPanel
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
