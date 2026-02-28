# Investment Accounts

## Overview

Track all investment and cash accounts for two named people — recording balances as dated snapshots over time and capturing annual historical returns. Serves as the core data source for the retirement simulation and as the reference implementation pattern for all future CRUD sections in the app.

## User Experience

**Accounts list (Investments → Accounts)**

A dense table showing all accounts across both people. Columns: account name, type, owner, current balance (most recent snapshot), last updated date, and most recent recorded return %. Accounts are labeled by owner via a name badge or subtle indicator — not split into separate pages. An "Add Account" button sits above the table.

As the list grows, a floating table-of-contents panel appears on the right edge of the page — showing account names as jump links, grouped by owner. Lets you navigate a long scrollable list without losing context.

**Adding an account**

Clicking "Add Account" opens a right slide-in panel. Fields: name (free text), type (dropdown: TFSA / RRSP / RRIF / Regular Savings / Chequing), owner (dropdown of configured people names), initial balance, and as-of date for that balance. Save closes the panel and the new account appears in the table.

**Account detail**

Clicking any account row expands it in-place (accordion). The expanded area has two sections:

- **Balance history**: A dated list of snapshots — date, balance, optional note. Newest first. Each snapshot has a delete icon (hover to reveal). "Add Snapshot" opens an inline form directly below the header: date (defaults to today), balance, optional note. Tab → Enter to save.

- **Returns history**: A per-year table — year, return %. Each row has a delete icon (hover to reveal). "Add Return" opens a similar inline form. Next to the return % input is a "Calculate" link that expands a mini inline calculator: enter start balance, end balance, net contributions → shows calculated result. User accepts it into the field or types their own number. Formula: `(end - start - net contributions) / start`. Chequing and Regular Savings accounts do not show this section.

**Removing an account**

Delete icon at the end of each table row. Immediate, no confirmation. All snapshots and return history for that account are also removed.

**Monthly balance update (quick task)**

Accessible from the Dashboard "Update Balances" shortcut and a button in the Investments → Accounts header. Opens a right slide-in panel with all accounts as a simple vertical list: name, owner, last known balance + date, and a single balance input. Date defaults to today (editable once at the top, applies to all entries). Tab through fields — leave blank to skip. "Save" commits only the accounts where a value was entered.

## Behavior

- People are configured by name in Settings. Each account belongs to one person. No shared accounts — user picks an owner if an account is technically joint.
- Account types are a fixed dropdown: TFSA, RRSP, RRIF, Regular Savings, Chequing.
- Balance snapshots are not editable — delete and re-add to correct a mistake. The "current balance" displayed everywhere is always the snapshot with the most recent date, regardless of entry order.
- Return entries are also delete-only. The return calculator is a display helper — the user always controls what gets saved.
- The monthly update panel creates new balance snapshots only for accounts where a value was entered. It does not modify or remove existing snapshots.
- Retroactive snapshot entry is allowed (date can be anything). Current balance is determined by the snapshot with the latest date, not the most recently added.

## Edge Cases

- Two people with the same account type (e.g., both have TFSAs) — separate account records, no uniqueness constraint.
- Snapshot added for a date earlier than the current most-recent snapshot — allowed. Current balance still reflects the snapshot with the latest date.
- RRIF in the type dropdown but unused — fine, it's just an available option.
- Return calculator with zero contributions — net contributions = 0, formula still works correctly.
- Negative returns — shown as a negative %, valid and expected.
- Chequing / Regular Savings — Returns section hidden for these types.
- Monthly update panel with no changes entered — "Save" with all fields blank is a no-op.

## Out of Scope

- Multiple currencies (CAD only)
- Individual holdings / positions within an account
- TFSA / RRSP contribution room tracking
- Account-to-account transfers or linking
- Assumed future return rates (live in simulation configuration, not here)
- LIRA, LIF, RESP, FHSA, corporate, pension accounts

## Golden Master Patterns

This feature establishes the following conventions for all other sections:

| Pattern | Convention |
|---|---|
| List view | Dense table, expandable rows (accordion), no page navigation for detail |
| Adding a record | Right slide-in panel |
| Adding related history | Inline form inside the expanded row, Tab → Enter to commit |
| Inline helpers | Expand in-place, never a modal |
| Deleting a record | Icon on the row, immediate, no confirmation |
| Deleting a sub-record | Hover-to-reveal icon, immediate, no confirmation |
| Quick bulk update | Slide-in panel with flat list, one shared date, blank = skip |
| Floating navigation | TOC panel on right edge for long scrollable lists |
