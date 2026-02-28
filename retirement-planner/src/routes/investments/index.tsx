import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronRight, Plus, RefreshCw, Trash2, TrendingUp, X } from "lucide-react";
import { Fragment, useState } from "react";
import type { AccountType } from "#/generated/prisma/enums";
import {
  createAccount,
  createBulkSnapshots,
  createReturn,
  createSnapshot,
  deleteAccount,
  deleteReturn,
  deleteSnapshot,
  getAccounts,
  getPeople,
  getReturns,
  getSnapshots,
} from "./accountFns";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "var(--section-investments)";
const ACCENT_HEX = "#10b981";

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

type AccountItem = Awaited<ReturnType<typeof getAccounts>>[number];
type SnapshotItem = Awaited<ReturnType<typeof getSnapshots>>[number];
type ReturnItem = Awaited<ReturnType<typeof getReturns>>[number];
type PersonItem = Awaited<ReturnType<typeof getPeople>>[number];

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

const iconBtnCls = "flex items-center justify-center p-1 rounded border-none bg-transparent cursor-pointer shrink-0";

const stubBtnCls = "flex items-center gap-1 py-[3px] px-2 rounded text-[11px] bg-transparent cursor-pointer";
const stubBtnCSS: React.CSSProperties = { border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "inherit" };

const thCls = (align: "left" | "right") =>
  `py-2 px-3 text-[11px] font-medium uppercase tracking-[0.05em] whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`;
const thCSS: React.CSSProperties = { color: "var(--text-dim)" };

const panelInputCls = "w-full rounded-md py-[7px] px-[10px] text-[13px] outline-none box-border";
const panelInputCSS: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  fontFamily: "inherit",
};

const panelCancelBtnCls = "py-[7px] px-4 rounded-md bg-transparent text-[13px] cursor-pointer";
const panelCancelBtnCSS: React.CSSProperties = { border: "1px solid var(--border)", color: "var(--text-muted)", fontFamily: "inherit" };

const panelSaveBtnCls = (enabled: boolean) => `py-[7px] px-4 rounded-md text-[13px] font-medium ${enabled ? "cursor-pointer" : "cursor-default"}`;
const panelSaveBtnCSS = (enabled: boolean): React.CSSProperties => ({
  background: enabled ? `color-mix(in srgb, ${ACCENT_HEX} 20%, transparent)` : "var(--surface-raised)",
  border: `1px solid ${enabled ? `color-mix(in srgb, ${ACCENT_HEX} 40%, transparent)` : "var(--border)"}`,
  color: enabled ? ACCENT : "var(--text-dim)",
  fontFamily: "inherit",
});

const inlineInputCls = "rounded py-1 px-1.5 text-xs outline-none box-border w-full";
const inlineInputCSS: React.CSSProperties = {
  background: "var(--app-bg)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  fontFamily: "inherit",
};

// ─── Owner Badge ──────────────────────────────────────────────────────────────

function OwnerBadge({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center py-0.5 px-2 rounded-xl text-[11px] font-medium whitespace-nowrap"
      style={{ background: "var(--surface-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
      {name}
    </span>
  );
}

// ─── Snapshot Row ─────────────────────────────────────────────────────────────

function SnapshotLine({ snap, onDelete }: { snap: SnapshotItem; onDelete: (id: number) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ borderTop: "1px solid var(--border)" }}>
      <td className="py-1.5 px-2" style={{ color: "var(--text-muted)" }}>
        {fmtDate(snap.date)}
      </td>
      <td className="py-1.5 px-2 text-right num">{fmtCAD(snap.balance)}</td>
      <td className="py-1.5 px-2 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "var(--text-dim)" }}>
        {snap.note ?? ""}
      </td>
      <td className="py-1.5 px-1 w-6">
        {hovered && (
          <button type="button" onClick={() => onDelete(snap.id)} className={iconBtnCls}>
            <Trash2 size={11} style={{ color: "var(--text-dim)" }} />
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Return Line ──────────────────────────────────────────────────────────────

function ReturnLine({ ret, onDelete }: { ret: ReturnItem; onDelete: (id: number) => void }) {
  const [hovered, setHovered] = useState(false);
  const pct = ret.returnPercent;
  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ borderTop: "1px solid var(--border)" }}>
      <td className="py-1.5 px-2" style={{ color: "var(--text-muted)" }}>
        {ret.year}
      </td>
      <td className="py-1.5 px-2 text-right num">
        <span style={{ color: pct >= 0 ? "#10b981" : "#ef4444" }}>{fmtReturn(pct)}</span>
      </td>
      <td className="py-1.5 px-1 w-6">
        {hovered && (
          <button type="button" onClick={() => onDelete(ret.id)} className={iconBtnCls}>
            <Trash2 size={11} style={{ color: "var(--text-dim)" }} />
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Add Snapshot Row ─────────────────────────────────────────────────────────

function AddSnapshotRow({ accountId, onSaved, onCancel }: { accountId: number; onSaved: () => void; onCancel: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = balance !== "" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await createSnapshot({ data: { accountId, date, balance: Number(balance), note: note.trim() || undefined } });
    onSaved();
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
    <tr style={{ borderTop: "1px solid var(--border)", background: `color-mix(in srgb, ${ACCENT_HEX} 5%, transparent)` }}>
      <td className="py-[5px] px-2">
        {/* biome-ignore lint/a11y/noAutofocus: intentional for inline form UX */}
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
        <button type="button" onClick={onCancel} className={iconBtnCls}>
          <X size={11} style={{ color: "var(--text-dim)" }} />
        </button>
      </td>
    </tr>
  );
}

// ─── Add Return Row ───────────────────────────────────────────────────────────

function AddReturnRow({ accountId, onSaved, onCancel }: { accountId: number; onSaved: () => void; onCancel: () => void }) {
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [returnPct, setReturnPct] = useState("");
  const [showCalc, setShowCalc] = useState(false);
  const [calcStart, setCalcStart] = useState("");
  const [calcEnd, setCalcEnd] = useState("");
  const [calcContribs, setCalcContribs] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = returnPct !== "" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await createReturn({ data: { accountId, year: Number(year), returnPercent: Number(returnPct) } });
    onSaved();
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

  const handleCalculate = () => {
    const start = Number(calcStart);
    const end = Number(calcEnd);
    const net = Number(calcContribs) || 0;
    if (start !== 0) {
      setReturnPct((((end - start - net) / start) * 100).toFixed(2));
      setShowCalc(false);
    }
  };

  const labelCls = "text-[10px] mb-[3px] uppercase tracking-[0.05em]";

  return (
    <>
      <tr style={{ borderTop: "1px solid var(--border)", background: `color-mix(in srgb, ${ACCENT_HEX} 5%, transparent)` }}>
        <td className="py-[5px] px-2">
          {/* biome-ignore lint/a11y/noAutofocus: intentional for inline form UX */}
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inlineInputCls}
            style={inlineInputCSS}
            autoFocus
          />
        </td>
        <td className="py-[5px] px-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={returnPct}
              onChange={(e) => setReturnPct(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className={`num ${inlineInputCls} text-right`}
              style={inlineInputCSS}
            />
            <button
              type="button"
              onClick={() => setShowCalc((v) => !v)}
              className="text-[10px] p-0 border-none bg-transparent cursor-pointer whitespace-nowrap shrink-0"
              style={{ color: showCalc ? ACCENT : "var(--text-dim)", fontFamily: "inherit" }}>
              Calc
            </button>
          </div>
        </td>
        <td className="py-[5px] px-1 w-6">
          <button type="button" onClick={onCancel} className={iconBtnCls}>
            <X size={11} style={{ color: "var(--text-dim)" }} />
          </button>
        </td>
      </tr>
      {showCalc && (
        <tr style={{ background: `color-mix(in srgb, ${ACCENT_HEX} 3%, transparent)` }}>
          <td colSpan={3} className="px-2 pt-2 pb-[10px]" style={{ borderTop: "1px dashed var(--border)" }}>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <div className={labelCls} style={{ color: "var(--text-dim)" }}>
                    Start
                  </div>
                  <input
                    type="number"
                    value={calcStart}
                    onChange={(e) => setCalcStart(e.target.value)}
                    placeholder="0"
                    className={`num ${inlineInputCls}`}
                    style={inlineInputCSS}
                  />
                </div>
                <div className="flex-1">
                  <div className={labelCls} style={{ color: "var(--text-dim)" }}>
                    End
                  </div>
                  <input
                    type="number"
                    value={calcEnd}
                    onChange={(e) => setCalcEnd(e.target.value)}
                    placeholder="0"
                    className={`num ${inlineInputCls}`}
                    style={inlineInputCSS}
                  />
                </div>
              </div>
              <div>
                <div className={labelCls} style={{ color: "var(--text-dim)" }}>
                  Net Contributions
                </div>
                <input
                  type="number"
                  value={calcContribs}
                  onChange={(e) => setCalcContribs(e.target.value)}
                  placeholder="0"
                  className={`num ${inlineInputCls}`}
                  style={inlineInputCSS}
                />
              </div>
              <button
                type="button"
                onClick={handleCalculate}
                className="py-[5px] px-[10px] rounded text-[11px] cursor-pointer self-start"
                style={{
                  background: `color-mix(in srgb, ${ACCENT_HEX} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${ACCENT_HEX} 30%, transparent)`,
                  color: ACCENT,
                  fontFamily: "inherit",
                }}>
                Accept
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Accordion Detail ─────────────────────────────────────────────────────────

function AccountDetail({
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

// ─── Floating TOC ─────────────────────────────────────────────────────────────

function FloatingToc({ accounts }: { accounts: AccountItem[] }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const groups = accounts.reduce<Map<string, AccountItem[]>>((m, a) => {
    if (!m.has(a.owner.name)) m.set(a.owner.name, []);
    m.get(a.owner.name)?.push(a);
    return m;
  }, new Map());

  return (
    <div className="sticky top-5 w-40 shrink-0 self-start">
      <div className="rounded-lg py-[10px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.07em] px-3 pb-2" style={{ color: "var(--text-dim)" }}>
          Jump to
        </div>
        {[...groups.entries()].map(([owner, accs]) => (
          <div key={owner}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.05em] px-3 pt-1 pb-0.5" style={{ color: ACCENT }}>
              {owner}
            </div>
            {accs.map((a) => (
              <a
                key={a.id}
                href={`#account-${a.id}`}
                className="block py-[3px] px-3 text-xs no-underline overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ color: hoveredId === a.id ? "var(--text)" : "var(--text-muted)" }}
                onMouseEnter={() => setHoveredId(a.id)}
                onMouseLeave={() => setHoveredId(null)}>
                {a.name}
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="py-12 px-6 rounded-lg text-center flex flex-col items-center gap-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div
        className="w-11 h-11 rounded-[10px] flex items-center justify-center"
        style={{ backgroundColor: `color-mix(in srgb, ${ACCENT_HEX} 10%, transparent)` }}>
        <TrendingUp size={20} style={{ color: ACCENT }} />
      </div>
      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
        No accounts yet
      </div>
      <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>
        Click "Add Account" to add your first investment account.
      </div>
    </div>
  );
}

// ─── Panel Field Wrapper ──────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Add Account Panel ────────────────────────────────────────────────────────

function AddAccountPanel({ people, onClose, onSaved }: { people: PersonItem[]; onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("TFSA");
  const [ownerId, setOwnerId] = useState<number>(people[0]?.id ?? 0);
  const [balance, setBalance] = useState("");
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
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
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.45)" }} />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-[380px] flex flex-col z-[101]"
        style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="py-[18px] px-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="m-0 text-[15px] font-semibold" style={{ color: "var(--text)" }}>
            Add Account
          </h2>
          <button type="button" onClick={onClose} className={iconBtnCls}>
            <X size={15} style={{ color: "var(--text-dim)" }} />
          </button>
        </div>

        {/* Fields */}
        <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">
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
        </div>

        {/* Footer */}
        <div className="py-3.5 px-5 flex gap-2 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose} className={panelCancelBtnCls} style={panelCancelBtnCSS}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canSave} className={panelSaveBtnCls(canSave)} style={panelSaveBtnCSS(canSave)}>
            {saving ? "Saving…" : "Save Account"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Update Balances Panel ────────────────────────────────────────────────────

function UpdateBalancesPanel({ accounts, onClose, onSaved }: { accounts: AccountItem[]; onClose: () => void; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const entries = accounts
    .map((a) => ({ accountId: a.id, balance: Number(values[a.id]) }))
    .filter((e) => values[e.accountId] !== undefined && values[e.accountId] !== "" && !Number.isNaN(e.balance));

  const handleSave = async () => {
    if (saving) return;
    if (entries.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    await createBulkSnapshots({ data: { date, entries } });
    onSaved();
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-[100]" style={{ background: "rgba(0,0,0,0.45)" }} />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-[420px] flex flex-col z-[101]"
        style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="py-[18px] px-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="m-0 text-[15px] font-semibold" style={{ color: "var(--text)" }}>
            Update Balances
          </h2>
          <button type="button" onClick={onClose} className={iconBtnCls}>
            <X size={15} style={{ color: "var(--text-dim)" }} />
          </button>
        </div>

        {/* As of date */}
        <div className="py-3.5 px-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Field label="As of Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={panelInputCls} style={panelInputCSS} />
          </Field>
        </div>

        {/* Account list */}
        <div className="flex-1 overflow-y-auto">
          {accounts.map((account) => {
            const snap = account.snapshots[0];
            return (
              <div key={account.id} className="py-[10px] px-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-[3px]">
                    <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                      {account.name}
                    </span>
                    <OwnerBadge name={account.owner.name} />
                  </div>
                  {snap ? (
                    <div className="text-[11px]" style={{ color: "var(--text-dim)" }}>
                      <span className="num">{fmtCAD(snap.balance)}</span>
                      {" · "}
                      {fmtDate(snap.date)}
                    </div>
                  ) : (
                    <div className="text-[11px] italic" style={{ color: "var(--text-dim)" }}>
                      No balance recorded
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  value={values[account.id] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [account.id]: e.target.value }))}
                  placeholder="—"
                  className={`num ${panelInputCls} !w-[120px] text-right`}
                  style={panelInputCSS}
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="py-3.5 px-5 flex gap-2 justify-end" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose} className={panelCancelBtnCls} style={panelCancelBtnCSS}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={panelSaveBtnCls(entries.length > 0)}
            style={panelSaveBtnCSS(entries.length > 0)}>
            {saving ? "Saving…" : entries.length > 0 ? `Save ${entries.length} Balance${entries.length !== 1 ? "s" : ""}` : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

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

  const closeUpdatePanel = () => {
    setUpdatePanelOpen(false);
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
      const [snaps, rets] = await Promise.all([getSnapshots({ data: { accountId: id } }), getReturns({ data: { accountId: id } })]);
      setDetails((prev) => ({
        ...prev,
        [id]: { snapshots: snaps, returns: rets, loading: false },
      }));
    }
  };

  const refreshDetail = async (id: number) => {
    const [snaps, rets] = await Promise.all([getSnapshots({ data: { accountId: id } }), getReturns({ data: { accountId: id } })]);
    setDetails((prev) => ({
      ...prev,
      [id]: { snapshots: snaps, returns: rets, loading: false },
    }));
  };

  const handleDeleteAccount = async (id: number) => {
    await deleteAccount({ data: { id } });
    if (expandedId === id) setExpandedId(null);
    router.invalidate();
  };

  const handleDeleteSnapshot = async (snapId: number, accountId: number) => {
    await deleteSnapshot({ data: { id: snapId } });
    refreshDetail(accountId);
    router.invalidate();
  };

  const handleDeleteReturn = async (retId: number, accountId: number) => {
    await deleteReturn({ data: { id: retId } });
    refreshDetail(accountId);
    router.invalidate();
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
              <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: ACCENT_HEX }} />
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
                  background: `color-mix(in srgb, ${ACCENT_HEX} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${ACCENT_HEX} 30%, transparent)`,
                  color: ACCENT,
                  fontFamily: "inherit",
                }}>
                <Plus size={13} />
                Add Account
              </button>
            </div>
          </div>

          {/* Accounts table */}
          {accounts.length === 0 ? (
            <EmptyState />
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
                          onClick={() => toggleExpand(account.id)}
                          onMouseEnter={() => setHoveredRowId(account.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          className="cursor-pointer"
                          style={{
                            borderTop: "1px solid var(--border)",
                            background: isExpanded
                              ? `color-mix(in srgb, ${ACCENT_HEX} 6%, transparent)`
                              : hoveredRowId === account.id
                                ? "var(--surface-raised)"
                                : "transparent",
                            transition: "background 0.1s",
                          }}>
                          {/* Name + chevron */}
                          <td className="py-[10px] px-3">
                            <div className="flex items-center gap-2">
                              <ChevronRight
                                size={13}
                                className="shrink-0"
                                style={{
                                  color: "var(--text-dim)",
                                  transform: isExpanded ? "rotate(90deg)" : "none",
                                  transition: "transform 0.15s",
                                }}
                              />
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
                              <span style={{ color: ret.returnPercent >= 0 ? "#10b981" : "#ef4444" }}>{fmtReturn(ret.returnPercent)}</span>
                            ) : (
                              <span style={{ color: "var(--text-dim)" }}>—</span>
                            )}
                          </td>

                          {/* Delete */}
                          <td className="py-[10px] px-2">
                            {hoveredRowId === account.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAccount(account.id);
                                }}
                                className={iconBtnCls}>
                                <Trash2 size={13} style={{ color: "var(--text-dim)" }} />
                              </button>
                            )}
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
