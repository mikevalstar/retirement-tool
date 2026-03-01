# Investment Allocations

## Overview

Per-account target allocation across three asset classes: Equities, Fixed Income, and Cash. Answers the question "what is this account actually invested in?" — which the simulation uses to model future returns per account.

## User Experience

**The list:**
Dense table — one row per investment account (Chequing accounts are excluded; they're implicitly 100% Cash and don't need configuration). Columns: account name, type, owner, Equities %, Fixed Income %, Cash %. Accounts with no allocation set show "—" in the three percentage columns with a subtle "Not set" indicator.

**Editing an allocation:**
Click any row to expand it in-place (accordion pattern). The expanded area shows three number inputs: Equities %, Fixed Income %, Cash %. A live running total displays below the inputs — shows the current sum and turns red if it doesn't equal 100. "Save" commits the values and collapses the row. "Cancel" collapses without saving. New allocations always start blank.

**Portfolio aggregate:**
Below the table, a summary row showing the weighted portfolio-wide allocation across all accounts that have allocations configured, weighted by current balance. This is the same number shown on the Investments Dashboard. Accounts without allocations are excluded from the aggregate and a note shows how many are missing (e.g., "3 accounts not yet configured — excluded from total").

## Behavior

- Chequing accounts do not appear in the allocations list.
- Any account without an allocation set is excluded from the portfolio aggregate.
- Saving an allocation with a sum other than 100 is not allowed — the Save button is disabled or the form shows an inline error until it sums correctly.
- Allocations can be updated any number of times — each save replaces the previous values.
- There is no history for allocations — only the current target is stored.

## Edge Cases

- All three fields set to 0 — sum is 0, not 100; Save is blocked.
- One field at 100, others at 0 — valid (e.g., a pure equity account).
- User types 33 / 33 / 33 — sum is 99, not 100; Save is blocked. User must adjust to reach exactly 100.
- No accounts with allocations — portfolio aggregate row is hidden entirely.
- Only one account exists and it's a Chequing account — page shows empty state: "No accounts to configure. Chequing accounts don't require allocation setup."

## Out of Scope

- Geographic sub-splits within Equities (Canadian / U.S. / International) — kept at the 3-bucket level
- Individual holdings or positions
- Historical allocation snapshots
- Tax-optimization or asset-location suggestions (which asset class to hold in which account type)
