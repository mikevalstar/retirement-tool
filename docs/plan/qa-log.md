# Planning Q&A Log

A record of decisions made during planning sessions to avoid re-hashing prior discussions.

---

## UI Design (Overall) - 2026-02-28

**Q: How frequently will the app be used and in what mode?**
A: Two distinct modes. Monthly: credit card import + balance updates, quick and routine. Annual (tax time): deep dive across all domains, scenario comparison, year-ahead planning. Both modes must be well-served — fast for monthly, capable of sustained analysis for annual.

**Q: Desktop only or mobile too?**
A: Desktop only. If mobile ever happens, read-only and high-level only — not a priority.

**Q: What is the target aesthetic / reference apps?**
A: GitLab, Obsidian, Slack. Dense, dark, power-user. Never dumbed down.

**Q: Dark mode or light mode?**
A: Dark mode only.

**Q: Information density preference?**
A: Information dense — everything in one place. Whitespace is not a goal.

**Q: Navigation pattern?**
A: GitLab-style left sidebar with top-level sections, expandable in-place to show sub-pages.

**Q: Command palette?**
A: Yes — Ctrl+K, typeahead, available from anywhere. High priority.

**Q: Accent color / palette?**
A: Cyan / blue-cyan family as primary. Each section gets its own hue for quick orientation. Color used for indicators and headers, not heavy backgrounds.

**Q: Expense categories — flat or hierarchical?**
A: Hierarchical (e.g., Car → Gas / Insurance / Maintenance).

**Q: Multiple credit cards for monthly import?**
A: Yes — support importing from multiple cards in one session.

**Q: Left sidebar sub-navigation style?**
A: Sections expand in-place in the sidebar (GitLab style), not a landing page model.

**Q: Persistent "retirement health score" indicator?**
A: No — too gamified for now. Noted as a possible future idea.

**Q: Simulation output / charts design?**
A: To be designed iteratively once data entry screens are solid. Firm principle: every chart has an overview mode and a drill-down mode from the same view.

---

## Investment Accounts - 2026-02-28

**Q: Which Canadian account types are needed?**
A: TFSA, RRSP, RRIF, Regular Savings, Chequing. Fixed dropdown, no free-text type. LIRA, LIF, RESP, FHSA, corporate, pension are out of scope for this user.

**Q: How are two people represented in the app?**
A: Named — people are configured by name in Settings (established here, reused across all sections). Each account belongs to one person. No shared accounts; user picks an owner for joint accounts.

**Q: Balance tracking — snapshot log or current-value-only?**
A: Snapshot log. Each balance entry stores a date + value. Current balance = most recent snapshot by date (not by insertion order). Retroactive entries are allowed.

**Q: Can balance snapshots be edited?**
A: No — delete and re-add to correct a mistake. Delete icon on each snapshot, hover to reveal, immediate with no confirmation.

**Q: How are historical returns entered?**
A: Per-year table (year + return %). Includes an inline calculator helper: enter start balance, end balance, net contributions → calculates approximate return using `(end - start - net contributions) / start`. User can accept or override. Returns are delete-only (no inline edit).

**Q: Which account types show the returns section?**
A: TFSA and RRSP only (investment accounts). Chequing and Regular Savings hide the returns section as not relevant.

**Q: Monthly balance update flow — separate screen or part of Accounts?**
A: Right slide-in panel accessible from Dashboard shortcut and Accounts header. Flat list of all accounts, one shared date (defaults to today), single balance input per account. Leave blank to skip. Commits only accounts where a value was entered.

**Q: Long list navigation?**
A: Floating TOC panel on right edge of page — account names as jump links, grouped by owner. Appears when the list is long enough to need it.

**Q: Delete behavior?**
A: Immediate, no confirmation for both accounts and sub-records (snapshots, return entries). Audience of one — no guard rails.

---

## UI Design (Overall) - 2026-03-01

**Q: Should the app keep the default starter favicon?**
A: No. Use a custom favicon aligned with the dark/cyan visual system: dark rounded tile plus cyan trajectory line to reinforce the app's identity.

---

## Investments Dashboard - 2026-03-01

**Q: Include Chequing accounts in total portfolio value on the dashboard?**
A: Yes — include all accounts in the total.

**Q: What does the dashboard show?**
A: Four stat cards (total, Person A, Person B, last updated), account type breakdown table, weighted allocation bar (only if allocations are configured), quick actions (Update Balances button, sub-section links).

---

## Investment Allocations - 2026-03-01

**Q: Allocation granularity — 3 buckets or 5?**
A: 3 buckets: Equities / Fixed Income / Cash. Simpler, still practical.

**Q: Allocation level — per account or portfolio-wide?**
A: Per account. Different accounts serve different roles (e.g., RRSP = all equities, savings = all cash).

**Q: Chequing accounts in the allocations page?**
A: Excluded — implicitly 100% Cash, no configuration needed.

**Q: Are allocations pre-populated or blank when first set?**
A: Always blank. User enters from scratch.

---

## Investment Glide Paths - 2026-03-01

**Q: Year-based or age-based waypoints?**
A: Year-based. Stays correct if retirement target year changes.

**Q: "To" retirement or "through" retirement glide path?**
A: "Through" — allocation continues de-risking past retirement, reaching most conservative point around age 80–85. Matches major Canadian target-date fund approach. Page includes an explainer so the user understands why the path extends beyond retirement.

**Q: One glide path or per-account?**
A: One portfolio-wide glide path.

---

## Error Display (Ignition-style) - 2026-03-01

**Q: IDE integration — single IDE or multiple?**
A: Multiple IDEs via dropdown selector (VS Code, Cursor, Zed, Windsurf). Preference stored in localStorage, persisted across sessions.

**Q: Should current URL be shown?**
A: Yes — display current page URL in error header and include it in copied error text. Helps with reproduction and sharing context.

**Q: Source map support strategy?**
A: Rely on source maps being available in dev. Graceful fallback if unavailable. Use `error-stack-parser-es` or `stacktracey` for parsing.

**Q: React-specific features (component stack)?**
A: Out of scope for v1. Can be added later.

**Q: Exportability?**
A: Yes — all code in `src/lib/error-display/` folder, designed for extraction as standalone package later.
