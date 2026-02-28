import { Plus } from "lucide-react";
import { useState } from "react";
import type { AccountType } from "#/generated/prisma/enums";
import type { getAccounts, getReturns, getSnapshots } from "#/routes/investments/accountFns";
import { AddReturnRow } from "./AddReturnRow";
import { AddSnapshotRow } from "./AddSnapshotRow";
import { ReturnLine } from "./ReturnLine";
import { SnapshotLine } from "./SnapshotLine";

type AccountItem = Awaited<ReturnType<typeof getAccounts>>[number];
type SnapshotItem = Awaited<ReturnType<typeof getSnapshots>>[number];
type ReturnItem = Awaited<ReturnType<typeof getReturns>>[number];

const ACCENT = "var(--section-investments)";

const NO_RETURNS = new Set<AccountType>(["CHEQUING", "REGULAR_SAVINGS"]);

const stubBtnCls = "flex items-center gap-1 py-[3px] px-2 rounded text-[11px] bg-transparent cursor-pointer";
const stubBtnCSS: React.CSSProperties = { border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "inherit" };

const thCls = (align: "left" | "right") =>
  `py-2 px-3 text-[11px] font-medium uppercase tracking-[0.05em] whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`;
const thCSS: React.CSSProperties = { color: "var(--text-dim)" };

interface DetailState {
  snapshots: SnapshotItem[];
  returns: ReturnItem[];
  loading: boolean;
}

export function AccountDetail({
  account,
  detail,
  onDeleteSnapshot,
  onDeleteReturn,
  onSaved,
}: {
  account: AccountItem;
  detail: DetailState;
  onDeleteSnapshot: (id: number) => void;
  onDeleteReturn: (id: number) => void;
  onSaved: () => void;
}) {
  const [showAddSnapshot, setShowAddSnapshot] = useState(false);
  const [showAddReturn, setShowAddReturn] = useState(false);
  const showReturns = !NO_RETURNS.has(account.type);

  return (
    <tr>
      <td colSpan={7} className="p-0">
        <div className="pt-4 pr-8 pb-5 pl-12 flex gap-10" style={{ background: "var(--app-bg)", borderBottom: "1px solid var(--border)" }}>
          {/* Balance History */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-[10px]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: "var(--text-muted)" }}>
                Balance History
              </span>
              <button
                type="button"
                className={stubBtnCls}
                style={{ ...stubBtnCSS, ...(showAddSnapshot ? { color: ACCENT, borderColor: ACCENT } : {}) }}
                onClick={() => setShowAddSnapshot((v) => !v)}>
                <Plus size={10} />
                Add Snapshot
              </button>
            </div>

            {detail.loading ? (
              <div className="text-xs italic" style={{ color: "var(--text-dim)" }}>
                Loading…
              </div>
            ) : showAddSnapshot || detail.snapshots.length > 0 ? (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className={thCls("left")} style={thCSS}>
                      Date
                    </th>
                    <th className={thCls("right")} style={thCSS}>
                      Balance
                    </th>
                    <th className={thCls("left")} style={thCSS}>
                      Note
                    </th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {showAddSnapshot && (
                    <AddSnapshotRow
                      accountId={account.id}
                      onSaved={() => {
                        setShowAddSnapshot(false);
                        onSaved();
                      }}
                      onCancel={() => setShowAddSnapshot(false)}
                    />
                  )}
                  {detail.snapshots.map((snap) => (
                    <SnapshotLine key={snap.id} snap={snap} onDelete={onDeleteSnapshot} />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-xs italic" style={{ color: "var(--text-dim)" }}>
                No balance snapshots yet
              </div>
            )}
          </div>

          {/* Returns History */}
          {showReturns && (
            <div className="w-[220px] shrink-0">
              <div className="flex items-center justify-between mb-[10px]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: "var(--text-muted)" }}>
                  Annual Returns
                </span>
                <button
                  type="button"
                  className={stubBtnCls}
                  style={{ ...stubBtnCSS, ...(showAddReturn ? { color: ACCENT, borderColor: ACCENT } : {}) }}
                  onClick={() => setShowAddReturn((v) => !v)}>
                  <Plus size={10} />
                  Add
                </button>
              </div>

              {detail.loading ? (
                <div className="text-xs italic" style={{ color: "var(--text-dim)" }}>
                  Loading…
                </div>
              ) : showAddReturn || detail.returns.length > 0 ? (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className={thCls("left")} style={thCSS}>
                        Year
                      </th>
                      <th className={thCls("right")} style={thCSS}>
                        Return
                      </th>
                      <th className="w-6" />
                    </tr>
                  </thead>
                  <tbody>
                    {showAddReturn && (
                      <AddReturnRow
                        accountId={account.id}
                        onSaved={() => {
                          setShowAddReturn(false);
                          onSaved();
                        }}
                        onCancel={() => setShowAddReturn(false)}
                      />
                    )}
                    {detail.returns.map((ret) => (
                      <ReturnLine key={ret.id} ret={ret} onDelete={onDeleteReturn} />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-xs italic" style={{ color: "var(--text-dim)" }}>
                  No returns recorded
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
