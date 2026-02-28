import { ChevronRight } from "lucide-react";

interface ExpandChevronProps {
  expanded: boolean;
  size?: number;
}

export function ExpandChevron({ expanded, size = 13 }: ExpandChevronProps) {
  return (
    <ChevronRight
      size={size}
      className="shrink-0"
      style={{
        color: "var(--text-dim)",
        transform: expanded ? "rotate(90deg)" : "none",
        transition: "transform 0.15s",
      }}
    />
  );
}
