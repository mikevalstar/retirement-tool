interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-[5px]">
      {/* biome-ignore lint/a11y/noLabelWithoutControl: Field is a layout wrapper; association is handled by the caller */}
      <label className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
