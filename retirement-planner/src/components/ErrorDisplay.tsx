import { AlertCircle, ChevronDown, ChevronRight, X } from "lucide-react";
import { useState } from "react";

interface ErrorDisplayProps {
  error: unknown;
  onDismiss?: () => void;
}

function extractError(error: unknown): { type: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      type: error.constructor.name || "Error",
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === "string") {
    return { type: "Error", message: error };
  }
  return { type: "Unknown", message: JSON.stringify(error, null, 2) };
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  const [stackExpanded, setStackExpanded] = useState(false);
  const { type, message, stack } = extractError(error);

  return (
    <div
      style={{
        background: "color-mix(in srgb, var(--color-negative) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--color-negative) 30%, transparent)",
        borderRadius: 6,
        fontSize: 12,
        overflow: "hidden",
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px" }}>
        <AlertCircle size={13} style={{ color: "var(--color-negative)", flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11,
              color: "var(--color-negative)",
              fontWeight: 600,
              display: "block",
              marginBottom: 2,
            }}>
            {type}
          </span>
          <span style={{ color: "var(--text)", lineHeight: 1.5, display: "block", wordBreak: "break-word" }}>{message}</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
          {stack && (
            <button
              type="button"
              onClick={() => setStackExpanded((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-dim)",
                fontSize: 11,
                fontFamily: "inherit",
                padding: "2px 4px",
                borderRadius: 3,
              }}>
              {stackExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              Stack
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              style={{
                display: "flex",
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-dim)",
                padding: 2,
                borderRadius: 3,
              }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {stackExpanded && stack && (
        <pre
          style={{
            margin: 0,
            padding: "8px 12px",
            fontSize: 10.5,
            color: "var(--text-muted)",
            fontFamily: "JetBrains Mono, monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            overflowY: "auto",
            maxHeight: 220,
            borderTop: "1px solid color-mix(in srgb, var(--color-negative) 20%, transparent)",
            background: "color-mix(in srgb, var(--color-negative) 5%, transparent)",
            lineHeight: 1.6,
          }}>
          {stack}
        </pre>
      )}
    </div>
  );
}
