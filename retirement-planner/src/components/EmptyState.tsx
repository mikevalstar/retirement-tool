interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

export function EmptyState({ icon, title, description, accent }: EmptyStateProps) {
  return (
    <div
      className="py-12 px-6 rounded-lg text-center flex flex-col items-center gap-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="w-11 h-11 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)` }}>
        {icon}
      </div>
      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
        {title}
      </div>
      <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>
        {description}
      </div>
    </div>
  );
}
