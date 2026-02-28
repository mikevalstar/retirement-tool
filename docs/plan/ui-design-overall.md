# Overall UI Design

## Overview

A dense, dark-mode desktop application with a power-user feel — closest in spirit to GitLab with touches of Obsidian's keyboard-first culture and Slack's organized-but-dense sidebar conventions. Information is always visible; nothing is hidden behind extra clicks unless you choose to drill in.

**Primary use patterns:**
- **Monthly sessions** — import credit card expenses, update account balances, run simulation
- **Annual deep dive (tax time)** — thorough review across all data domains, scenario comparison, planning adjustments for the year ahead

The app should serve both modes well: fast and frictionless for the monthly routine, capable of sustained deep analysis for the annual session.

---

## Color and Aesthetic

- **Background**: Very dark near-black (not pure black — dark navy/charcoal range) for reduced eye strain during long sessions
- **Primary accent**: Cyan / blue-cyan family — used for primary actions, active states, and the Dashboard section
- **Section colors**: Each domain gets a distinct hue for instant visual orientation. Colors appear as sidebar left-edge indicators, section headers, and chart keys — not heavy backgrounds:
  - Dashboard → cyan
  - Investments → blue-green
  - Income → teal
  - Expenses → amber (warm contrast against the cool palette)
  - Housing → indigo
  - Taxes → coral
  - Scenarios → violet
  - Simulation → bright cyan (the "payoff" section, visually emphasized)
- **Typography**: Monospace font for all numbers (easier to scan columns). Proportional font for everything else.

---

## Layout Shell

Three zones:

1. **Left sidebar** — fixed width, collapsible to icon-only mode (GitLab style) when horizontal space is needed
2. **Main content area** — where all data entry, charts, and views live
3. **Minimal top bar** — breadcrumb trail on the left, global actions on the right (Run Simulation + Ctrl+K trigger)

Complex entry (e.g., adding a new income stream, configuring a glide path) uses a **right slide-in panel** rather than modals or full-page redirects. You stay oriented in the section you're working in.

---

## Left Sidebar Navigation

Top-level items, each with its section color as a left-edge indicator. Sections expand in-place in the sidebar to reveal sub-pages (GitLab style) — no landing pages.

1. **Dashboard**
2. **Investments** → Accounts / Allocations / Glide Paths
3. **Income** → Employment / Social Security / Passive Streams
4. **Expenses** → Monthly Import / Budget Baseline / Categories
5. **Housing** → Mortgage / Home Equity / Future Events
6. **Taxes** → Overview / Roth Scenarios / RMDs
7. **Scenarios** → Configure / Compare
8. **Simulation** → Run / Results
9. *(divider)*
10. **Settings** *(pinned to bottom)*

Multiple sections can be expanded simultaneously. Collapse what you're not working in.

---

## Dashboard (Home / Landing)

The screen you land on every session. Designed to be actionable, not decorative.

**Top row — key numbers at a glance:**
- Total current net worth
- Last simulation run date + quick "Run Now" link
- Projected retirement date range (from last simulation)

**Middle row — quick-action shortcuts:**
- "Import Expenses" → jumps directly into CSV import flow
- "Update Balances" → jumps to the balance update table
- "Run Simulation" → triggers a simulation run

These cover the three most common session tasks. One click, no digging.

**Bottom row — compact timeline chart:**
- Net worth over time: historical actuals + projected band
- Intentionally simple here; detail and drill-down live in Simulation

---

## Monthly Import Flow (Expenses → Monthly Import)

The most-used screen. Should feel fast and frictionless — most months it's paste, skim, confirm.

1. **Paste or drop a CSV** export from any credit card. Multiple cards can be imported in one session (each as a separate import, merged into the same month).
2. **App parses the CSV** and displays a review table: merchant / amount / date / category picker.
3. **Known merchants auto-assign** their saved category (e.g., Esso → Car → Gas). These rows are collapsed by default — visible if you want to override, out of the way if you don't.
4. **Unknown merchants** surface at the top of the list for manual assignment. Once assigned, the mapping is saved permanently.
5. **Category picker is hierarchical** — select a parent category (Car) then a sub-category (Gas / Insurance / Maintenance). Frequently used paths appear first.
6. **Running sidebar** shows category totals building in real time as you assign — so you can see "Groceries: $340 · Dining: $210 · Car: $180..." as you work through the list.
7. **Confirm → saved** for the month.

---

## Balance Update (Quick Monthly Task)

A single-screen table: all accounts listed with their last recorded balance and last updated date. Tab through fields and type new values for anything that changed. No modals, no page transitions. Fast.

---

## Command Palette (Ctrl+K)

Available from anywhere in the app. Typeahead interface — same feel as VS Code's command palette or Claude's `/` menu.

Supports:
- Jump to any section or sub-page
- "Run simulation"
- "Import expenses"
- "Update balances"
- Search by account name, income source, merchant name, or category
- Switch active scenario

---

## Data Entry Style

- **Inline editing in tables** for simple value updates — no modals for things like updating a balance or tweaking a budget line
- **Right slide-in panel** for complex entry: adding a new account, configuring an income stream, setting up a glide path
- You stay oriented in the section you're in — no full-page redirects for entry tasks
- **Examples and hints throughout** — every input field that accepts a non-obvious value should show an example inline (placeholder text, ghost values, or a tooltip hint). The interface should teach you what good input looks like without requiring documentation. This applies across all data entry: account setup, income configuration, glide path parameters, budget categories, scenario settings. The command palette is one expression of this philosophy; it should carry through everywhere.

---

## Simulation Output / Charts

Intentionally not fully designed yet — will be iterated once data entry screens are solid.

**Firm principles locked in:**
- Every chart has an **overview mode** (at-a-glance) and a **drill-down mode** accessible from the same view
- Section colors carry through consistently into chart color keys

---

## Out of Scope (for now)

- Mobile design (future: read-only, high-level only if ever built)
- "Retirement health score" persistent indicator (noted as a possible future feature)
- Light mode
