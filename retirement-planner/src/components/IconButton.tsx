interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "outline" | "accent";
  accent?: string;
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function IconButton({ variant = "ghost", accent, size = "md", children, className = "", style, ...props }: IconButtonProps) {
  const padding = size === "sm" ? "p-[3px]" : "p-1";

  const base = `flex items-center justify-center ${padding} rounded cursor-pointer shrink-0`;

  const variantCls: Record<string, string> = {
    ghost: "border-none bg-transparent",
    outline: "bg-transparent",
    accent: "",
  };

  const variantStyle = (): React.CSSProperties => {
    if (variant === "outline") {
      return { border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "inherit" };
    }
    if (variant === "accent" && accent) {
      return {
        background: `color-mix(in srgb, ${accent} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
        color: accent,
        fontFamily: "inherit",
      };
    }
    return {};
  };

  return (
    <button type="button" className={`${base} ${variantCls[variant]} ${className}`} style={{ ...variantStyle(), ...style }} {...props}>
      {children}
    </button>
  );
}
