# Error Display (Ignition-style)

## Overview
A beautiful, developer-focused error display component that transforms raw JavaScript errors into an actionable debugging experience — complete with parsed stack traces, syntax-highlighted code frames, and smart suggestions. Designed for export as a standalone package.

## User Experience

**When an error occurs**, the developer sees:
1. **Error header** — error type in red, message prominently displayed, current URL shown, with quick actions (copy, retry, dismiss)
2. **Stack trace panel** — collapsible frames, each showing file path, line number, function name. Click to expand that frame's code context
3. **Code frames** — syntax-highlighted source code with 3-5 lines of context around the error line, the error line highlighted
4. **Context panel** (optional) — request info, route params, component stack (React), environment info
5. **Suggestions** (future) — AI-powered or pattern-based suggestions for common errors

**Key interactions:**
- Click a stack frame to see its code frame expanded inline
- Click file path to open in IDE (configurable dropdown: VS Code, Cursor, Zed, Windsurf)
- IDE preference stored in localStorage, persisted across sessions
- Copy full error with stack trace + URL to clipboard
- Keyboard navigation between frames (up/down arrows)

**IDE selector:**
- Dropdown in error header or settings area
- Options: VS Code, Cursor, Zed, Windsurf
- Stored in `localStorage` under key `error-display-ide`
- Deep link format per IDE:
  - VS Code: `vscode://file/{path}:{line}:{column}`
  - Cursor: `cursor://file/{path}:{line}:{column}`
  - Zed: `zed://file/{path}:{line}:{column}`
  - Windsurf: `windsurf://file/{path}:{line}:{column}`

**URL display:**
- Current page URL shown in error header (read-only, monospace)
- Included in copied error text
- Helps with reproduction and sharing error context

## Behavior

**Error parsing:**
- Accept `Error`, `string`, or unknown input
- Extract: type (constructor name), message, stack string
- Parse stack into structured frames: `{ file, line, column, functionName, isNative, isInternal }`
- Distinguish between:
  - User code (in project src/)
  - Dependencies (node_modules)
  - Native/browser internals
  - Framework internals (TanStack, React)

**Stack frame display:**
- User code frames shown first, emphasized
- Dependency/internal frames collapsed by default, expandable
- Each frame shows relative path (trimmed to project root)
- Line numbers are clickable (opens in configured IDE)

**Code frame rendering:**
- Fetch source file content (browser: via source map or direct fetch)
- Show 3 lines above + error line + 3 lines below
- Syntax highlight using Prism.js or similar (TypeScript/JSX-aware)
- Error line has red left border and subtle red background

**Source map support:**
- In dev, source maps are typically available
- Use `error-stack-parser-es` or `stacktracey` for parsing
- Map compiled line/column back to original source when possible
- Graceful fallback if source map unavailable

**Copy to clipboard:**
- Full error text format:
  ```
  Error: [message]
  
  URL: [current URL]
  
  Stack trace:
  [parsed stack frames with file:line:column]
  
  [timestamp]
  ```

## Package Structure (Export-Ready)

```
src/lib/error-display/
├── index.ts              # Public exports
├── types.ts              # All type definitions
├── parser.ts             # Stack trace parsing logic
├── ide-links.ts          # IDE deep link generators + localStorage management
├── code-frame.tsx        # Syntax-highlighted code frame component
├── stack-frame.tsx       # Individual stack frame component
├── stack-trace.tsx       # Stack trace panel (list of frames)
├── error-header.tsx      # Error type + message + URL + actions + IDE selector
├── error-display.tsx     # Main composite component
├── error-boundary.tsx    # Optional React error boundary wrapper
├── utils.ts              # Path trimming, formatting helpers
└── styles.ts             # CSS-in-JS or style objects (uses CSS vars)
```

## Edge Cases

- **No stack trace**: Show error message only, no stack panel
- **Minified code**: Show "source map not available" message, still show line numbers
- **Network errors fetching source**: Graceful degradation, show file path only
- **Circular error objects**: Handle without crashing
- **Non-Error thrown values**: Stringify safely, show as "Unknown error"
- **Multiple errors**: Show first error prominently, others in a list
- **Huge stack traces**: Virtualize or limit to first 50 frames
- **Missing IDE preference**: Default to VS Code, show selector on first use
- **URL unavailable** (e.g., non-browser): Hide URL section gracefully

## Out of Scope (v1)

- AI-powered suggestions (future enhancement)
- Remote error reporting (Flare/Sentry integration)
- Production error display (this is dev-only)
- Light mode (dark-only for now)
- Server-side error rendering (client-only for v1)

## Technical Notes

**Libraries to evaluate:**
- `error-stack-parser-es` — modern TS port of stack parser
- `stacktracey` — full-featured with source map support
- `react-syntax-highlighter` — code highlighting

**CSS Variables (inherits from host app):**
- `--app-bg`, `--surface`, `--surface-raised`
- `--text`, `--text-muted`, `--text-dim`
- `--color-negative`, `--border`
- Or provide own defaults if not present