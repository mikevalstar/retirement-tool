interface OwnerBadgeProps {
  name: string;
}

export function OwnerBadge({ name }: OwnerBadgeProps) {
  return (
    <span
      className="inline-flex items-center py-0.5 px-2 rounded-xl text-[11px] font-medium whitespace-nowrap"
      style={{ background: "var(--surface-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
      {name}
    </span>
  );
}
