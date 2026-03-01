import { Trash2 } from "lucide-react";
import { IconButton } from "#/components/IconButton";
import type { getSnapshots } from "#/serverFns/investments/accountFns";

type SnapshotItem = Awaited<ReturnType<typeof getSnapshots>>[number];

const fmtCAD = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

export function SnapshotLine({ snap, onDelete }: { snap: SnapshotItem; onDelete: (id: number) => void }) {
  return (
    <tr style={{ borderTop: "1px solid var(--border)" }}>
      <td className="py-1.5 px-2" style={{ color: "var(--text-muted)" }}>
        {fmtDate(snap.date)}
      </td>
      <td className="py-1.5 px-2 text-right num">{fmtCAD(snap.balance)}</td>
      <td className="py-1.5 px-2 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "var(--text-dim)" }}>
        {snap.note ?? ""}
      </td>
      <td className="py-1.5 px-1 w-6">
        <IconButton variant="ghost" aria-label="Delete snapshot" onClick={() => onDelete(snap.id)}>
          <Trash2 size={11} style={{ color: "var(--text-dim)" }} />
        </IconButton>
      </td>
    </tr>
  );
}
