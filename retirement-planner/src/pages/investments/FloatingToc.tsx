import { useMemo, useState } from "react";
import type { getAccounts } from "#/serverFns/investments/accountFns";

type AccountItem = Awaited<ReturnType<typeof getAccounts>>[number];

const ACCENT = "var(--section-investments)";

export function FloatingToc({ accounts }: { accounts: AccountItem[] }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const groups = useMemo(
    () =>
      accounts.reduce<Map<string, AccountItem[]>>((m, a) => {
        if (!m.has(a.owner.name)) m.set(a.owner.name, []);
        m.get(a.owner.name)?.push(a);
        return m;
      }, new Map()),
    [accounts],
  );

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
