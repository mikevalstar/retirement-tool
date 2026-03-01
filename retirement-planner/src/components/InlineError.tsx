import { AlertCircle, X } from "lucide-react";

interface InlineErrorProps {
  error: unknown;
  onDismiss?: () => void;
}

export function InlineError({ error, onDismiss }: InlineErrorProps) {
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    try {
      message = JSON.stringify(error);
    } catch {
      message = "An unknown error occurred";
    }
  }

  return (
    <div style={styles.container}>
      <AlertCircle size={14} style={{ color: "var(--color-negative)", flexShrink: 0, marginTop: 1 }} />
      <span style={styles.message}>{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} style={styles.dismiss} aria-label="Dismiss error">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 12px",
    background: "color-mix(in srgb, var(--color-negative) 10%, transparent)",
    border: "1px solid color-mix(in srgb, var(--color-negative) 30%, transparent)",
    borderRadius: 6,
    fontSize: 12,
  },
  message: {
    flex: 1,
    color: "var(--text)",
    lineHeight: 1.4,
  },
  dismiss: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    padding: 2,
    cursor: "pointer",
    color: "var(--text-muted)",
    borderRadius: 3,
  },
};
