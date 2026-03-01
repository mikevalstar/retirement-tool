import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { CodeFrame } from "./code-frame";
import { getStoredIDE, openInIDE } from "./ide-links";
import type { StackFrameRowProps } from "./types";

export function StackFrameRow({ frame, isUserCode, projectRoot, onToggle }: StackFrameRowProps) {
  const [showCode, setShowCode] = useState(false);

  const handleOpenInIDE = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (frame.file && frame.line) {
      openInIDE(frame.file, frame.line, frame.column);
    }
  };

  const handleToggleCode = () => {
    setShowCode(!showCode);
    onToggle();
  };

  const displayPath = projectRoot ? frame.file.replace(projectRoot, "").replace(/^\//, "") : frame.file;

  return (
    <div style={isUserCode ? frameRowStyles.userCodeContainer : frameRowStyles.internalContainer}>
      <button type="button" style={frameRowStyles.header} onClick={handleToggleCode} onKeyDown={(e) => e.key === "Enter" && handleToggleCode()}>
        <span style={frameRowStyles.expandIcon}>{showCode ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
        <span style={frameRowStyles.functionName}>{frame.functionName}</span>
        <span style={frameRowStyles.separator}>at</span>
        {frame.file && (
          <span style={frameRowStyles.fileInfo}>
            <span style={frameRowStyles.filePath}>{displayPath || frame.file}</span>
            <span style={frameRowStyles.lineNumber}>:{frame.line}</span>
          </span>
        )}
        {frame.isNative && <span style={frameRowStyles.nativeLabel}>[native]</span>}
      </button>
      {frame.file && frame.line > 0 && (
        <button type="button" style={frameRowStyles.ideButton} onClick={handleOpenInIDE} title={`Open in ${getStoredIDE()}`}>
          <ExternalLink size={12} />
        </button>
      )}
      {showCode && frame.file && frame.line > 0 && (
        <div style={frameRowStyles.codeWrapper}>
          <CodeFrame filePath={frame.file} line={frame.line} column={frame.column} />
        </div>
      )}
    </div>
  );
}

const frameRowStyles = {
  userCodeContainer: {
    borderBottom: "1px solid var(--border)",
    position: "relative" as const,
    display: "flex",
    alignItems: "flex-start",
    background: "transparent",
  },
  internalContainer: {
    borderBottom: "1px solid var(--border)",
    position: "relative" as const,
    display: "flex",
    alignItems: "flex-start",
    background: "var(--surface)",
    opacity: 0.8,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    cursor: "pointer",
    transition: "background 0.1s",
    background: "transparent",
    border: "none",
    flex: 1,
    textAlign: "left" as const,
    fontFamily: "var(--font-sans)",
    fontSize: "inherit",
    color: "inherit",
    minWidth: 0,
  },
  expandIcon: {
    color: "var(--text-dim)",
    flexShrink: 0,
    width: 12,
    display: "flex",
  },
  functionName: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--text)",
    maxWidth: 200,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  separator: {
    fontSize: 11,
    color: "var(--text-dim)",
    flexShrink: 0,
  },
  fileInfo: {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--accent)",
    minWidth: 0,
    flex: 1,
  },
  filePath: {
    color: "var(--text-muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  lineNumber: {
    color: "var(--text-dim)",
    flexShrink: 0,
  },
  ideButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 8px",
    marginTop: 6,
    marginRight: 8,
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    cursor: "pointer",
    color: "var(--text-muted)",
    flexShrink: 0,
    transition: "background 0.15s, color 0.15s",
  },
  nativeLabel: {
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    color: "var(--text-dim)",
    fontStyle: "italic" as const,
    flexShrink: 0,
  },
  codeWrapper: {
    padding: "0 12px 12px 32px",
    width: "100%",
  },
};
