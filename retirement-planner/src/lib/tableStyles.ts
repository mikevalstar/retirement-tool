import type React from "react";

export const thCls = (align: "left" | "right") =>
  `py-2 px-3 text-[11px] font-medium uppercase tracking-[0.05em] whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`;

export const thCSS: React.CSSProperties = { color: "var(--text-dim)" };
