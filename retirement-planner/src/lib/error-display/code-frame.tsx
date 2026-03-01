import { useEffect, useState } from "react";
import type { CodeFrameProps } from "./types";

export function CodeFrame({ filePath, line, column = 1, sourceCode, contextLines = 3 }: CodeFrameProps) {
  const [code, setCode] = useState<string | null>(sourceCode || null);
  const [loading, setLoading] = useState(!sourceCode);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sourceCode) return;

    const fetchSource = async () => {
      try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error("Not found");
        const text = await response.text();
        setCode(text);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSource();
  }, [filePath, sourceCode]);

  if (loading) {
    return (
      <div style={codeFrameStyles.loading}>
        <span>Loading source...</span>
      </div>
    );
  }

  if (error || !code) {
    return (
      <div style={codeFrameStyles.error}>
        <span>Unable to load source file</span>
      </div>
    );
  }

  const lines = code.split("\n");
  const startLine = Math.max(1, line - contextLines);
  const endLine = Math.min(lines.length, line + contextLines);
  const displayLines = lines.slice(startLine - 1, endLine);
  const lineNumberWidth = String(endLine).length;

  return (
    <div style={codeFrameStyles.container}>
      <div style={codeFrameStyles.header}>
        <span style={codeFrameStyles.filePath}>{filePath}</span>
        <span style={codeFrameStyles.location}>
          line {line}, col {column}
        </span>
      </div>
      <pre style={codeFrameStyles.code}>
        <code>
          {displayLines.map((codeLine, idx) => {
            const lineNum = startLine + idx;
            const isErrorLine = lineNum === line;
            return (
              <div
                key={lineNum}
                style={{
                  ...codeFrameStyles.line,
                  ...(isErrorLine ? codeFrameStyles.errorLine : {}),
                }}>
                <span style={codeFrameStyles.lineNumber(lineNumberWidth)}>{lineNum}</span>
                <span style={codeFrameStyles.lineContent}>{codeLine || " "}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

const codeFrameStyles = {
  container: {
    background: "var(--surface)",
    borderRadius: 4,
    overflow: "hidden",
    margin: "4px 0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 10px",
    background: "var(--surface-raised)",
    borderBottom: "1px solid var(--border)",
  },
  filePath: {
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    color: "var(--text-muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  location: {
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    color: "var(--text-dim)",
    flexShrink: 0,
    marginLeft: 12,
  },
  code: {
    margin: 0,
    padding: "8px 0",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    lineHeight: 1.6,
    overflow: "auto",
    maxHeight: 200,
  },
  line: {
    display: "flex",
    padding: "0 10px",
    transition: "background 0.1s",
  },
  errorLine: {
    background: "color-mix(in srgb, var(--color-negative) 12%, transparent)",
    borderLeft: "3px solid var(--color-negative)",
    marginLeft: "-3px",
  },
  lineNumber: (width: number) => ({
    display: "inline-block",
    width: width * 8 + 12,
    minWidth: 24,
    textAlign: "right" as const,
    paddingRight: 12,
    color: "var(--text-dim)",
    userSelect: "none" as const,
    flexShrink: 0,
  }),
  lineContent: {
    color: "var(--text)",
    whiteSpace: "pre" as const,
  },
  loading: {
    padding: "12px 16px",
    fontSize: 11,
    color: "var(--text-dim)",
    fontStyle: "italic" as const,
  },
  error: {
    padding: "12px 16px",
    fontSize: 11,
    color: "var(--text-muted)",
    fontStyle: "italic" as const,
  },
};
