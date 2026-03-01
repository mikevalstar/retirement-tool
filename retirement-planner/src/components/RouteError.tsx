import type { ErrorComponentProps } from "@tanstack/react-router";
import { ErrorDisplay } from "@/lib/error-display";

export function RouteError({ error, reset }: ErrorComponentProps) {
  return (
    <div style={containerStyles}>
      <ErrorDisplay error={error} defaultExpanded onRetry={reset} />
    </div>
  );
}

const containerStyles = {
  display: "flex",
  flexDirection: "column" as const,
  height: "100%",
  overflow: "auto",
};
