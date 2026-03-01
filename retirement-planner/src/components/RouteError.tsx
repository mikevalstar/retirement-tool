import type { ErrorComponentProps } from "@tanstack/react-router";
import { Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ErrorDisplay } from "./ErrorDisplay";

export function RouteError({ error, reset }: ErrorComponentProps) {
  const [copied, setCopied] = useState(false);

  const copyError = () => {
    const text = error instanceof Error ? `${error.name}: ${error.message}\n\n${error.stack ?? ""}` : String(error);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <ErrorDisplay error={error} defaultExpanded />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12.5px]"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontFamily: "inherit",
            cursor: "pointer",
          }}>
          <RotateCcw size={12} />
          Try again
        </button>
        <button
          type="button"
          onClick={copyError}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12.5px]"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            color: copied ? "var(--color-positive)" : "var(--text-muted)",
            fontFamily: "inherit",
            cursor: "pointer",
          }}>
          <Copy size={12} />
          {copied ? "Copied!" : "Copy error"}
        </button>
      </div>
    </div>
  );
}
