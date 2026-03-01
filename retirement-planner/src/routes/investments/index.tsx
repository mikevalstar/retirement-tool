import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, RefreshCw, Trash2, TrendingUp } from "lucide-react";
import { Fragment, useState } from "react";
import { EmptyState } from "#/components/EmptyState";
import { ErrorDisplay } from "#/components/ErrorDisplay";
import { ExpandChevron } from "#/components/ExpandChevron";
import { IconButton } from "#/components/IconButton";
import { OwnerBadge } from "#/components/OwnerBadge";
import type { AccountType } from "#/generated/prisma/enums";
import { AccountDetail } from "#/pages/investments/AccountDetail";
import { AddAccountPanel } from "#/pages/investments/AddAccountPanel";
import { FloatingToc } from "#/pages/investments/FloatingToc";
import { UpdateBalancesPanel } from "#/pages/investments/UpdateBalancesPanel";
import { deleteAccount, deleteReturn, deleteSnapshot, getAccounts, getPeople, getReturns, getSnapshots } from "#/serverFns/investments/accountFns";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "var(--section-investments)";

const TYPE_LABEL: Record<AccountType, string> = {
  TFSA: "TFSA",
  RRSP: "RRSP",
  RRIF: "RRIF",
  REGULAR_SAVINGS: "Savings",
  CHEQUING: "Chequing",
};

const NO_RETURNS = new Set<AccountType>(["CHEQUING", "REGULAR_SAVINGS"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCAD = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const fmtReturn = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

// ─── Types ────────────────────────────────────────────────────────────────────

type SnapshotItem = Awaited<ReturnType<typeof getSnapshots>>[number];
type ReturnItem = Awaited<ReturnType<typeof getReturns>>[number];

interface DetailState {
  snapshots: SnapshotItem[];
  returns: ReturnItem[];
  loading: boolean;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/investments/")({
  component: InvestmentsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    update: search.update === true || search.update === "true" ? (true as const) : undefined,
  }),
  loader: async () => {
    const [accounts, people] = await Promise.all([getAccounts(), getPeople()]);
    return { accounts, people };
  },
});

// ─── Shared Styles ────────────────────────────────────────────────────────────

const thCls = (align: "left" | "right") =>
  `py-2 px-3 text-[11px] font-medium uppercase tracking-[0.05em] whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`;
const thCSS: React.CSSProperties = { color: "var(--text-dim)" };

// ─── Main Page ────────────────────────────────────────────────────────────────

function InvestmentsPage() {
  const router = useRouter();
  const { accounts, people } = Route.useLoaderData();
  const { update } = Route.useSearch();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, DetailState>>({});
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [updatePanelOpen, setUpdatePanelOpen] = useState(!!update);
  const [pageError, setPageError] = useState<unknown>(null);

  const closeUpdatePanel = () => {
    setUpdatePanelOpen(false);
  };

  const refreshDetail = async (id: number) => {
    const [snaps, rets] = await Promise.all([getSnapshots({ data: { accountId: id } }), getReturns({ data: { accountId: id } })]);
    setDetails((prev) => ({
      ...prev,
      [id]: { snapshots: snaps, returns: rets, loading: false },
    }));
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpand(id);
    }
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!details[id]) {
      setDetails((prev) => ({
        ...prev,
        [id]: { snapshots: [], returns: [], loading: true },
      }));
      try {
        const [snaps, rets] = await Promise.all([getSnapshots({ data: { accountId: id } }), getReturns({ data: { accountId: id } })]);
        setDetails((prev) => ({
          ...prev,
          [id]: { snapshots: snaps, returns: rets, loading: false },
        }));
      } catch (err) {
        setPageError(err);
        setDetails((prev) => ({
          ...prev,
          [id]: { snapshots: [], returns: [], loading: false },
        }));
      }
    }
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      await deleteAccount({ data: { id } });
      if (expandedId === id) setExpandedId(null);
      router.invalidate();
    } catch (err) {
      setPageError(err);
    }
  };

  const handleDeleteSnapshot = async (snapId: number, accountId: number) => {
    try {
      await deleteSnapshot({ data: { id: snapId } });
      refreshDetail(accountId);
      router.invalidate();
    } catch (err) {
      setPageError(err);
    }
  };

  const handleDeleteReturn = async (retId: number, accountId: number) => {
    try {
      await deleteReturn({ data: { id: retId } });
      refreshDetail(accountId);
      router.invalidate();
    } catch (err) {
      setPageError(err);
    }
  };

  const showToc = accounts.length > 4;

  return (
    <>
      <div className="flex gap-5 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: ACCENT }} />
              <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
                Investment Accounts
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUpdatePanelOpen(true)}
                className="flex items-center gap-1.5 py-1.5 px-[14px] rounded-md text-[12.5px] font-medium cursor-pointer"
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontFamily: "inherit",
                }}>
                <RefreshCw size={13} />
                Update Balances
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="flex items-center gap-1.5 py-1.5 px-[14px] rounded-md text-[12.5px] font-medium cursor-pointer"
                style={{
                  background: `color-mix(in srgb, ${ACCENT} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${ACCENT} 30%, transparent)`,
                  color: ACCENT,
                  fontFamily: "inherit",
                }}>
                <Plus size={13} />
                Add Account
              </button>
            </div>
          </div>

          {/* Page-level error */}
          {!!pageError && <ErrorDisplay error={pageError} onDismiss={() => setPageError(null)} />}

          {/* Accounts table */}
          {accounts.length === 0 ? (
            <EmptyState
              icon={<TrendingUp size={20} style={{ color: ACCENT }} />}
              title="No accounts yet"
              description='Click "Add Account" to add your first investment account.'
              accent={ACCENT}
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
                      Balance
                    </th>
                    <th className={thCls("left")} style={thCSS}>
                      Updated
                    </th>
                    <th className={thCls("right")} style={thCSS}>
                      Return
                    </th>
                    <th className="w-9" />
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => {
                    const isExpanded = expandedId === account.id;
                    const snap = account.snapshots[0];
                    const ret = account.returns[0];
                    const detail = details[account.id] ?? {
                      snapshots: [],
                      returns: [],
                      loading: true,
                    };

                    return (
                      <Fragment key={account.id}>
                        <tr
                          id={`account-${account.id}`}
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
                              ? `color-mix(in srgb, ${ACCENT} 6%, transparent)`
                              : hoveredRowId === account.id
                                ? "var(--surface-raised)"
                                : "transparent",
                            transition: "background 0.1s",
                          }}>
                          {/* Name + chevron */}
                          <td className="py-[10px] px-3">
                            <div className="flex items-center gap-2">
                              <ExpandChevron expanded={isExpanded} />
                              <span className="font-medium" style={{ color: "var(--text)" }}>
                                {account.name}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-[10px] px-3" style={{ color: "var(--text-muted)" }}>
                            {TYPE_LABEL[account.type]}
                          </td>

                          {/* Owner */}
                          <td className="py-[10px] px-3">
                            <OwnerBadge name={account.owner.name} />
                          </td>

                          {/* Balance */}
                          <td className="py-[10px] px-3 text-right num">
                            {snap ? <span style={{ color: "var(--text)" }}>{fmtCAD(snap.balance)}</span> : <span style={{ color: "var(--text-dim)" }}>—</span>}
                          </td>

                          {/* Last Updated */}
                          <td className="py-[10px] px-3" style={{ color: "var(--text-muted)" }}>
                            {snap ? fmtDate(snap.date) : "—"}
                          </td>

                          {/* Return % */}
                          <td className="py-[10px] px-3 text-right num">
                            {ret && !NO_RETURNS.has(account.type) ? (
                              <span style={{ color: ret.returnPercent >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}>
                                {fmtReturn(ret.returnPercent)}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-dim)" }}>—</span>
                            )}
                          </td>

                          {/* Delete */}
                          <td className="py-[10px] px-2">
                            <IconButton
                              variant="ghost"
                              aria-label={`Delete ${account.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAccount(account.id);
                              }}>
                              <Trash2 size={13} style={{ color: "var(--text-dim)" }} />
                            </IconButton>
                          </td>
                        </tr>

                        {/* Accordion detail */}
                        {isExpanded && (
                          <AccountDetail
                            account={account}
                            detail={detail}
                            onDeleteSnapshot={(snapId) => handleDeleteSnapshot(snapId, account.id)}
                            onDeleteReturn={(retId) => handleDeleteReturn(retId, account.id)}
                            onSaved={() => {
                              refreshDetail(account.id);
                              router.invalidate();
                            }}
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Floating TOC */}
        {showToc && <FloatingToc accounts={accounts} />}
      </div>

      {/* Add Account Panel */}
      {panelOpen && (
        <AddAccountPanel
          people={people}
          onClose={() => setPanelOpen(false)}
          onSaved={() => {
            setPanelOpen(false);
            router.invalidate();
          }}
        />
      )}

      {/* Update Balances Panel */}
      {updatePanelOpen && (
        <UpdateBalancesPanel
          accounts={accounts}
          onClose={closeUpdatePanel}
          onSaved={() => {
            closeUpdatePanel();
            router.invalidate();
          }}
        />
      )}
    </>
  );
}
