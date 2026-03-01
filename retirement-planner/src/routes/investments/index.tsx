import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Calendar, LineChart as LineChartIcon, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "#/components/EmptyState";
import type { AccountType } from "#/generated/prisma/enums";
import { dayjs } from "#/lib/date";
import { fmtCAD, fmtDate, SECTION_ACCENT } from "#/lib/formatters";
import { UpdateBalancesPanel } from "#/pages/investments/UpdateBalancesPanel";
import type { PortfolioChartData } from "#/serverFns/investments/accountFns";
import { getAccounts, getPeople, getPortfolioChartData } from "#/serverFns/investments/accountFns";

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<AccountType, string> = {
  TFSA: "TFSA",
  RRSP: "RRSP",
  RRIF: "RRIF",
  REGULAR_SAVINGS: "Savings",
  CHEQUING: "Chequing",
};

// Type display order for breakdown table
const TYPE_ORDER: AccountType[] = ["RRSP", "TFSA", "RRIF", "REGULAR_SAVINGS", "CHEQUING"];

// Chart line color per account type — uses design system section CSS vars as a palette
const TYPE_CHART_COLOR: Record<AccountType, string> = {
  RRSP: "var(--section-investments)",
  TFSA: "var(--section-dashboard)",
  RRIF: "var(--section-income)",
  REGULAR_SAVINGS: "var(--section-expenses)",
  CHEQUING: "var(--section-housing)",
};

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/investments/")({
  component: InvestmentsDashboardPage,
  loader: async () => {
    const [accounts, people, chartData] = await Promise.all([getAccounts(), getPeople(), getPortfolioChartData()]);
    return { accounts, people, chartData };
  },
});

// ─── Types ─────────────────────────────────────────────────────────────────────

type AccountItem = Awaited<ReturnType<typeof getAccounts>>[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function latestBalance(account: AccountItem): number | null {
  return account.snapshots[0]?.balance ?? null;
}

function latestSnapshotDate(account: AccountItem): Date | null {
  return account.snapshots[0]?.date ?? null;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; stroke: string }>;
  label?: number;
}

function PortfolioChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length || label == null) return null;
  const typeEntries = payload.filter((p) => p.dataKey !== "total");
  const totalEntry = payload.find((p) => p.dataKey === "total");
  return (
    <div className="rounded-md px-3 py-2 text-[12px]" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)" }}>
      <div className="font-medium mb-2" style={{ color: "var(--text-muted)" }}>
        {dayjs(label).format("MMM D, YYYY")}
      </div>
      {typeEntries.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.stroke }}>{TYPE_LABEL[p.dataKey as AccountType]}</span>
          <span className="num" style={{ color: "var(--text)" }}>
            {fmtCAD(p.value)}
          </span>
        </div>
      ))}
      {totalEntry && (
        <div className="flex justify-between gap-4 mt-1 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-muted)" }}>Total</span>
          <span className="num font-medium" style={{ color: "var(--text)" }}>
            {fmtCAD(totalEntry.value)}
          </span>
        </div>
      )}
    </div>
  );
}

function PortfolioHistoryChart({ data }: { data: PortfolioChartData }) {
  if (data.series.length === 0) return null;

  const timestamps = data.series.map((d) => new Date(d.date).getTime());
  const xMin = Math.min(...timestamps);
  const xMax = Math.max(...timestamps);
  const domainMin = Math.max(0, Math.floor(Math.min(...data.series.map((d) => d.total)) * 0.9));

  const chartPoints = data.series.map((d) => ({ ...d, ts: new Date(d.date).getTime() }));

  return (
    <div className="rounded-lg px-4 pt-4 pb-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--text-dim)" }}>
        Portfolio History
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartPoints} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="ts"
            type="number"
            domain={[xMin, xMax]}
            tickFormatter={(v) => dayjs(v).format("MMM YY")}
            tick={{ fill: "var(--text-dim)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickCount={6}
          />
          <YAxis
            domain={[domainMin, "auto"]}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fill: "var(--text-dim)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<PortfolioChartTooltip />} />
          {data.types.map((type) => (
            <Line
              key={type}
              type="monotone"
              dataKey={type}
              stroke={TYPE_CHART_COLOR[type]}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
          <Line type="monotone" dataKey="total" stroke="var(--text)" strokeWidth={2} strokeDasharray="5 3" dot={false} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
      {/* Mini legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {data.types.map((type) => (
          <div key={type} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-dim)" }}>
            <div className="w-3 h-[2px]" style={{ backgroundColor: TYPE_CHART_COLOR[type] }} />
            {TYPE_LABEL[type]}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-dim)" }}>
          <div className="w-3 h-[2px]" style={{ backgroundColor: "var(--text)", opacity: 0.5 }} />
          Total
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  accent: string;
}) {
  return (
    <div
      className="flex-1 px-5 py-[18px] rounded-lg flex flex-col gap-[10px] min-w-0"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center gap-1.5">
        <Icon size={13} style={{ color: accent }} />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--text-dim)" }}>
          {label}
        </span>
      </div>
      <div className="num text-[28px] font-medium leading-none" style={{ color: "var(--text)" }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({
  to,
  search,
  icon: Icon,
  label,
  sub,
  accent,
}: {
  to: string;
  search?: Record<string, unknown>;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  sub: string;
  accent: string;
}) {
  return (
    <Link
      // biome-ignore lint/suspicious/noExplicitAny: unregistered route — remove cast when route is built
      to={to as any}
      // biome-ignore lint/suspicious/noExplicitAny: unregistered route — remove cast when route is built
      search={search as any}
      className="flex-1 flex items-center gap-[14px] px-[18px] py-[14px] rounded-lg cursor-pointer no-underline min-w-0"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        transition: "background 150ms, border-color 150ms",
      }}>
      <div
        className="w-[34px] h-[34px] rounded-[7px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)` }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-medium mb-0.5">{label}</div>
        <div className="text-xs" style={{ color: "var(--text-dim)" }}>
          {sub}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function InvestmentsDashboardPage() {
  const router = useRouter();
  const { accounts, people, chartData } = Route.useLoaderData();
  const [updatePanelOpen, setUpdatePanelOpen] = useState(false);

  // ── Derived totals ──────────────────────────────────────────────────────────

  const totalPortfolio = accounts.reduce((sum, a) => sum + (latestBalance(a) ?? 0), 0);
  const hasAnyBalance = accounts.some((a) => latestBalance(a) !== null);

  // Per-person totals — only show a card if that person has at least one account
  type PersonTotal = { person: (typeof people)[number]; total: number };
  const personTotals: PersonTotal[] = people.flatMap((p) => {
    const personAccounts = accounts.filter((a) => a.ownerId === p.id);
    if (personAccounts.length === 0) return [];
    const total = personAccounts.reduce((sum, a) => sum + (latestBalance(a) ?? 0), 0);
    return [{ person: p, total }];
  });

  // Most recent snapshot date across all accounts
  const allDates = accounts.flatMap((a) => (latestSnapshotDate(a) ? [latestSnapshotDate(a) as Date] : []));
  const lastUpdated = allDates.length > 0 ? allDates.reduce((a, b) => (a > b ? a : b)) : null;

  // ── Account type breakdown ──────────────────────────────────────────────────

  type BreakdownRow = { type: AccountType; count: number; balance: number };
  const typeMap = new Map<AccountType, BreakdownRow>();

  for (const account of accounts) {
    const bal = latestBalance(account) ?? 0;
    const existing = typeMap.get(account.type);
    if (existing) {
      existing.count++;
      existing.balance += bal;
    } else {
      typeMap.set(account.type, { type: account.type, count: 1, balance: bal });
    }
  }

  const breakdownRows: BreakdownRow[] = TYPE_ORDER.filter((t) => typeMap.has(t))
    .map((t) => typeMap.get(t) as BreakdownRow)
    .sort((a, b) => b.balance - a.balance);

  // ── Allocation bar (hidden until #22 allocations DB is built) ───────────────
  // No allocation data exists in the schema yet — this section will render once
  // issue #22 adds allocation fields. For now it is always hidden.
  const showAllocationBar = false;

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: SECTION_ACCENT }} />
            <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
              Investments
            </h1>
          </div>

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
        </div>

        {/* ── Empty state ── */}
        {accounts.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={20} style={{ color: SECTION_ACCENT }} />}
            title="No accounts yet"
            description="Go to Accounts to add your first investment account."
            accent={SECTION_ACCENT}
          />
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="flex gap-3.5">
              <StatCard
                label="Total Portfolio"
                value={hasAnyBalance ? fmtCAD(totalPortfolio) : "—"}
                sub={hasAnyBalance ? `${accounts.length} account${accounts.length === 1 ? "" : "s"}` : "No balances recorded yet"}
                icon={TrendingUp}
                accent={SECTION_ACCENT}
              />
              {personTotals.map((pt) => (
                <StatCard
                  key={pt.person.id}
                  label={pt.person.name}
                  value={fmtCAD(pt.total)}
                  sub={`${accounts.filter((a) => a.ownerId === pt.person.id).length} account${accounts.filter((a) => a.ownerId === pt.person.id).length === 1 ? "" : "s"}`}
                  icon={Users}
                  accent={SECTION_ACCENT}
                />
              ))}
              <StatCard
                label="Last Updated"
                value={lastUpdated ? fmtDate(lastUpdated) : "—"}
                sub={lastUpdated ? "Most recent balance snapshot" : "No snapshots recorded yet"}
                icon={Calendar}
                accent="var(--text-dim)"
              />
            </div>

            {/* ── Account type breakdown ── */}
            {breakdownRows.length > 0 && (
              <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="px-4 pt-3 pb-2 text-[11.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--text-dim)" }}>
                  By Account Type
                </div>
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th className="text-left px-4 py-2 font-medium text-[12px]" style={{ color: "var(--text-dim)" }}>
                        Type
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-[12px]" style={{ color: "var(--text-dim)" }}>
                        Accounts
                      </th>
                      <th className="text-right px-4 py-2 font-medium text-[12px]" style={{ color: "var(--text-dim)" }}>
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRows.map((row, i) => (
                      <tr
                        key={row.type}
                        style={{
                          borderTop: i === 0 ? undefined : "1px solid var(--border)",
                        }}>
                        <td className="px-4 py-[10px]">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: `color-mix(in srgb, ${SECTION_ACCENT} 70%, transparent)` }}
                            />
                            <span style={{ color: "var(--text)" }}>{TYPE_LABEL[row.type]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-[10px] text-right num" style={{ color: "var(--text-muted)" }}>
                          {row.count}
                        </td>
                        <td className="px-4 py-[10px] text-right num" style={{ color: "var(--text)" }}>
                          {fmtCAD(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Allocation bar (shown only when allocations configured — see #22) ── */}
            {showAllocationBar && (
              <div className="rounded-lg px-4 py-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: "var(--text-dim)" }}>
                  Portfolio Allocation
                </div>
                {/* Placeholder — will be built in #22 */}
              </div>
            )}

            {/* ── Portfolio History Chart ── */}
            {chartData.series.length > 1 && <PortfolioHistoryChart data={chartData} />}

            {/* ── Section links ── */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-[10px]" style={{ color: "var(--text-dim)" }}>
                Sections
              </div>
              <div className="flex gap-3.5">
                <SectionCard
                  to="/investments/accounts"
                  search={{ update: undefined }}
                  icon={TrendingUp}
                  label="Accounts"
                  sub="View and manage individual investment accounts"
                  accent={SECTION_ACCENT}
                />
                <SectionCard
                  to="/investments/allocations"
                  icon={LineChartIcon}
                  label="Allocations"
                  sub="Set equity / fixed income / cash targets per account"
                  accent={SECTION_ACCENT}
                />
                <SectionCard
                  to="/investments/glide-paths"
                  icon={RefreshCw}
                  label="Glide Paths"
                  sub="Define how allocations shift as you approach retirement"
                  accent={SECTION_ACCENT}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Update Balances Panel ── */}
      {updatePanelOpen && (
        <UpdateBalancesPanel
          accounts={accounts}
          onClose={() => setUpdatePanelOpen(false)}
          onSaved={() => {
            setUpdatePanelOpen(false);
            router.invalidate();
          }}
        />
      )}
    </>
  );
}
