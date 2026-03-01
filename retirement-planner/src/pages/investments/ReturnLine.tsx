import { Trash2 } from "lucide-react";
import { IconButton } from "#/components/IconButton";
import { fmtReturn } from "#/lib/formatters";
import type { getReturns } from "#/serverFns/investments/accountFns";

type ReturnItem = Awaited<ReturnType<typeof getReturns>>[number];

export function ReturnLine({ ret, onDelete }: { ret: ReturnItem; onDelete: (id: number) => void }) {
  const pct = ret.returnPercent;
  return (
    <tr style={{ borderTop: "1px solid var(--border)" }}>
      <td className="py-1.5 px-2" style={{ color: "var(--text-muted)" }}>
        {ret.year}
      </td>
      <td className="py-1.5 px-2 text-right num">
        <span style={{ color: pct >= 0 ? "var(--color-positive)" : "var(--color-negative)" }}>{fmtReturn(pct)}</span>
      </td>
      <td className="py-1.5 px-1 w-6">
        <IconButton variant="ghost" aria-label="Delete return" onClick={() => onDelete(ret.id)}>
          <Trash2 size={11} style={{ color: "var(--text-dim)" }} />
        </IconButton>
      </td>
    </tr>
  );
}
