import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PieChart } from "lucide-react";
import type React from "react";
import { Fragment, useState } from "react";
import { EmptyState } from "#/components/EmptyState";
import { ErrorDisplay } from "#/components/ErrorDisplay";
import { ExpandChevron } from "#/components/ExpandChevron";
import { OwnerBadge } from "#/components/OwnerBadge";
import type { AccountType } from "#/generated/prisma/enums";
import { SECTION_ACCENT } from "#/lib/formatters";
import { thCls, thCSS } from "#/lib/tableStyles";
import { getAllocations, setAllocation } from "#/serverFns/investments/allocationFns";

// ─── Types ────────────────────────────────────────────────────────────────────

type AllocationAccount = Awaited<ReturnType<typeof getAllocations>>[number];

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<AccountType, string> = {
  TFSA: "TFSA",
  RRSP: "RRSP",
  RRIF: "RRIF",
  REGULAR_SAVINGS: "Savings",
  CHEQUING: "Chequing",
};

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/investments/allocations/")({
  component: AllocationsPage,
  loader: async () => {
    const accounts = await getAllocations();
    return { accounts };
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPct(n: number | null): string {
  return n === null ? "—" : `${n.toFixed(1)}%`;
}

// ─── Accordion Editor ─────────────────────────────────────────────────────────

interface EditorProps {
  account: AllocationAccount;
  onSaved: () => void;
  onCancel: () => void;
  onError: (err: unknown) => void;
}

function AllocationEditor({ account, onSaved, onCancel, onError }: EditorProps) {
  const [equityStr, setEquityStr] = useState("");
  const [fixedStr, setFixedStr] = useState("");
  const [cashStr, setCashStr] = useState("");
  const [saving, setSaving] = useState(false);

  const eq = Number(equityStr) || 0;
  const fi = Number(fixedStr) || 0;
  const ca = Number(cashStr) || 0;
  const sum = eq + fi + ca;
  const sumOk = Math.round(sum) === 100;
  const anyInput = equityStr !== "" || fixedStr !== "" || cashStr !== "";

  const handleSave = async () => {
    setSaving(true);
    try {
      await setAllocation({ data: { accountId: account.id, equityPct: eq, fixedIncomePct: fi, cashPct: ca } });
      onSaved();
    } catch (err) {
      onError(err);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: "Equities %", value: equityStr, set: setEquityStr },
    { label: "Fixed Income %", value: fixedStr, set: setFixedStr },
    { label: "Cash %", value: cashStr, set: setCashStr },
  ];

  return (
    <tr>
      <td colSpan={6} style={{ padding: 0, borderTop: "1px solid var(--border)" }}>
        <div className="px-4 py-4" style={{ background: `color-mix(in srgb, ${SECTION_ACCENT} 4%, transparent)` }}>
          <div className="flex items-end gap-4 flex-wrap">
            {fields.map(({ label, value, set }) => (
              <label key={label} className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
                  {label}
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="0"
                  className="num w-24 rounded px-2 py-1.5 text-[13px] text-right"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </label>
            ))}

            {/* Live total */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--text-dim)" }}>
                Total
              </span>
              <div
                className="num flex items-center justify-center h-[34px] px-3 text-[13px] font-semibold rounded min-w-[60px]"
                style={{
                  color: sumOk ? "var(--color-positive)" : anyInput ? "var(--color-negative)" : "var(--text-dim)",
                  background: sumOk
                    ? "color-mix(in srgb, var(--color-positive) 10%, transparent)"
                    : anyInput
                      ? "color-mix(in srgb, var(--color-negative) 10%, transparent)"
                      : "var(--surface)",
                  border: `1px solid ${sumOk ? "color-mix(in srgb, var(--color-positive) 25%, transparent)" : anyInput ? "color-mix(in srgb, var(--color-negative) 25%, transparent)" : "var(--border)"}`,
                }}>
                {sum.toFixed(1)}%
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 ml-auto items-end">
              <button
                type="button"
                onClick={onCancel}
                className="py-1.5 px-3 rounded text-[12.5px] h-[34px]"
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!sumOk || saving}
                className="py-1.5 px-3 rounded text-[12.5px] h-[34px]"
                style={{
                  background: sumOk ? `color-mix(in srgb, ${SECTION_ACCENT} 15%, transparent)` : "var(--surface-raised)",
                  border: `1px solid ${sumOk ? `color-mix(in srgb, ${SECTION_ACCENT} 35%, transparent)` : "var(--border)"}`,
                  color: sumOk ? SECTION_ACCENT : "var(--text-dim)",
                  fontFamily: "inherit",
                  cursor: sumOk && !saving ? "pointer" : "not-allowed",
                  opacity: saving ? 0.6 : 1,
                }}>
                Save
              </button>
            </div>
          </div>

          {anyInput && !sumOk && (
            <p className="mt-2 text-[12px]" style={{ color: "var(--color-negative)", margin: "8px 0 0" }}>
              Percentages must sum to exactly 100.
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AllocationsPage() {
  const router = useRouter();
  const { accounts } = Route.useLoaderData();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<unknown>(null);

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  const handleRowKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpand(id);
    }
  };

  // Portfolio aggregate: weighted by current balance, only for accounts with both allocation and a balance snapshot
  const configured = accounts.filter((a) => a.equityPct !== null && a.snapshots.length > 0);
  const totalBalance = configured.reduce((s, a) => s + (a.snapshots[0]?.balance ?? 0), 0);
  const aggregate =
    configured.length > 0 && totalBalance > 0
      ? configured.reduce(
          (acc, a) => {
            const w = (a.snapshots[0]?.balance ?? 0) / totalBalance;
            return {
              equityPct: acc.equityPct + (a.equityPct ?? 0) * w,
              fixedIncomePct: acc.fixedIncomePct + (a.fixedIncomePct ?? 0) * w,
              cashPct: acc.cashPct + (a.cashPct ?? 0) * w,
            };
          },
          { equityPct: 0, fixedIncomePct: 0, cashPct: 0 },
        )
      : null;

  const excludedCount = accounts.filter((a) => a.equityPct === null).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-[10px]">
        <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: SECTION_ACCENT }} />
        <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
          Allocations
        </h1>
      </div>

      {!!pageError && <ErrorDisplay error={pageError} onDismiss={() => setPageError(null)} />}

      {accounts.length === 0 ? (
        <EmptyState
          icon={<PieChart size={20} style={{ color: SECTION_ACCENT }} />}
          title="No accounts to configure"
          description="Chequing accounts don't require allocation setup."
          accent={SECTION_ACCENT}
        />
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className={thCls("left")} style={thCSS}>
                  Account
                </th>
                <th className={thCls("left")} style={thCSS}>
                  Type
                </th>
                <th className={thCls("left")} style={thCSS}>
                  Owner
                </th>
                <th className={thCls("right")} style={thCSS}>
                  Equities
                </th>
                <th className={thCls("right")} style={thCSS}>
                  Fixed Income
                </th>
                <th className={thCls("right")} style={thCSS}>
                  Cash
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const isExpanded = expandedId === account.id;
                const hasAlloc = account.equityPct !== null;

                return (
                  <Fragment key={account.id}>
                    <tr
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpand(account.id)}
                      onKeyDown={(e) => handleRowKeyDown(e, account.id)}
                      onMouseEnter={() => setHoveredRowId(account.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className="cursor-pointer"
                      style={{
                        borderTop: "1px solid var(--border)",
                        background: isExpanded
                          ? `color-mix(in srgb, ${SECTION_ACCENT} 6%, transparent)`
                          : hoveredRowId === account.id
                            ? "var(--surface-raised)"
                            : "transparent",
                        transition: "background 0.1s",
                      }}>
                      <td className="py-[10px] px-3">
                        <div className="flex items-center gap-2">
                          <ExpandChevron expanded={isExpanded} />
                          <span className="font-medium" style={{ color: "var(--text)" }}>
                            {account.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-[10px] px-3" style={{ color: "var(--text-muted)" }}>
                        {TYPE_LABEL[account.type]}
                      </td>
                      <td className="py-[10px] px-3">
                        <OwnerBadge name={account.owner.name} />
                      </td>
                      <td className="py-[10px] px-3 text-right num" style={{ color: hasAlloc ? "var(--text)" : "var(--text-dim)" }}>
                        {fmtPct(account.equityPct)}
                      </td>
                      <td className="py-[10px] px-3 text-right num" style={{ color: hasAlloc ? "var(--text)" : "var(--text-dim)" }}>
                        {fmtPct(account.fixedIncomePct)}
                      </td>
                      <td className="py-[10px] px-3 text-right num" style={{ color: hasAlloc ? "var(--text)" : "var(--text-dim)" }}>
                        {fmtPct(account.cashPct)}
                      </td>
                    </tr>

                    {isExpanded && (
                      <AllocationEditor
                        account={account}
                        onSaved={() => {
                          setExpandedId(null);
                          router.invalidate();
                        }}
                        onCancel={() => setExpandedId(null)}
                        onError={(err) => setPageError(err)}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>

            {/* Portfolio aggregate — hidden when no accounts have allocations configured */}
            {aggregate && (
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--border)" }}>
                  <td className="py-[10px] px-3" colSpan={3}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--text-dim)" }}>
                        Portfolio Total
                      </span>
                      {excludedCount > 0 && (
                        <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
                          — {excludedCount} account{excludedCount !== 1 ? "s" : ""} not yet configured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-[10px] px-3 text-right num font-semibold" style={{ color: "var(--text)" }}>
                    {aggregate.equityPct.toFixed(1)}%
                  </td>
                  <td className="py-[10px] px-3 text-right num font-semibold" style={{ color: "var(--text)" }}>
                    {aggregate.fixedIncomePct.toFixed(1)}%
                  </td>
                  <td className="py-[10px] px-3 text-right num font-semibold" style={{ color: "var(--text)" }}>
                    {aggregate.cashPct.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
