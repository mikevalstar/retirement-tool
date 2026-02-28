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
