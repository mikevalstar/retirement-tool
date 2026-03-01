# Investments Dashboard

## Overview

The landing page for the Investments section. Shows a portfolio summary at a glance — total value, breakdown by account type and owner, and current allocation. No detail here; this is the orientation screen before drilling into Accounts, Allocations, or Glide Paths.

## User Experience

**Header stat cards (four across):**
- Total portfolio value — sum of latest balance snapshots across all accounts (Chequing included)
- Person A total — sum of all accounts owned by the first person (named from Settings)
- Person B total — sum of all accounts owned by the second person
- Last updated — date of the most recent snapshot across all accounts

**Account type breakdown — compact table:**
One row per account type that has at least one account: RRSP, TFSA, RRIF, Regular Savings, Chequing. Columns: type label, number of accounts, combined balance. Sorted by combined balance descending.

**Portfolio allocation — shown only if at least one account has an allocation configured:**
A single horizontal stacked bar: Equities / Fixed Income / Cash. Weighted by current balance across all accounts with allocations set. Shows both % and dollar amount for each segment. Accounts without allocations configured are excluded from the calculation and a small note indicates how many accounts are excluded (e.g., "2 accounts not yet configured").

**Quick actions:**
- "Update Balances" button — same slide-in panel as the Accounts page header
- Sub-section links — compact row of links to Accounts, Allocations, Glide Paths for quick navigation

## Behavior

- Stat cards recalculate on every page load from the latest snapshot data.
- If no accounts exist, show an empty state pointing to Accounts → Add Account.
- If only one person has accounts, only show one person total card (or show both with $0 for the one without accounts).
- "Last updated" shows the single most recent snapshot date across all accounts. If no snapshots exist, shows "—".
- The allocation bar is hidden entirely if zero accounts have allocations set — don't show an empty or placeholder bar.

## Edge Cases

- All accounts belong to one person — show only their card, not a blank card for the other person.
- No snapshots recorded yet — all balance figures show "—", stat cards still render.
- Accounts exist but no allocations configured — allocation section is not shown.
- One account has an allocation, others don't — bar renders from the configured account only, with the "X accounts not configured" note.

## Out of Scope

- Historical net worth chart (lives in Simulation results)
- Return performance metrics (live on Accounts detail rows)
- Projected retirement date or simulation output (lives in Simulation)
