import type React from "react";

const ACCENT = "var(--section-investments)";

export const panelInputCls = "w-full rounded-md py-[7px] px-[10px] text-[13px] outline-none box-border";

export const panelInputCSS: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  fontFamily: "inherit",
};

export const panelCancelBtnCls = "py-[7px] px-4 rounded-md bg-transparent text-[13px] cursor-pointer";

export const panelCancelBtnCSS: React.CSSProperties = {
  border: "1px solid var(--border)",
  color: "var(--text-muted)",
  fontFamily: "inherit",
};

export const panelSaveBtnCls = (enabled: boolean) => `py-[7px] px-4 rounded-md text-[13px] font-medium ${enabled ? "cursor-pointer" : "cursor-default"}`;

export const panelSaveBtnCSS = (enabled: boolean): React.CSSProperties => ({
  background: enabled ? `color-mix(in srgb, ${ACCENT} 20%, transparent)` : "var(--surface-raised)",
  border: `1px solid ${enabled ? `color-mix(in srgb, ${ACCENT} 40%, transparent)` : "var(--border)"}`,
  color: enabled ? ACCENT : "var(--text-dim)",
  fontFamily: "inherit",
});
