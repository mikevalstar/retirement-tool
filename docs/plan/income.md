# Income

## Overview

Track employment income sources for each person and display projected government pension benefits (CPP/OAS) on the dashboard. Income sources are deliberately simple — just a job name and amount per person. Government pension projections are auto-calculated from birth year and displayed as estimates on the dashboard.

## User Experience

**Income Sources list (Income → Sources)**

A dense table showing all income sources across both people. Columns: source name, owner (person badge), amount, frequency. An "Add Source" button sits above the table.

**Adding an income source**

Clicking "Add Source" opens a right slide-in panel. Fields: name (free text, e.g., "Software Engineer", "Consulting"), owner (dropdown of configured people), amount (numeric), frequency (dropdown: Annual / Monthly). Save closes the panel and the new source appears in the table.

**Editing an income source**

Click any row to expand in-place (accordion). The expanded area shows the same fields in an editable inline form. Tab → Enter to save changes.

**Removing an income source**

Delete icon at the end of each table row. Immediate, no confirmation.

**Dashboard: Government Pension Projections**

A dedicated section on the Income dashboard (separate from the sources list) shows projected CPP and OAS amounts for each person. Each person gets a card with:
- CPP estimate at age 65 (max and estimated based on contribution assumptions)
- OAS estimate at age 65
- Assumed start age for projections (default 65, user can adjust in Settings)

Projections are calculated from the Person's birth year. If birth year is not set, the section shows a prompt to configure it in Settings.

## Behavior

**Income Sources**

- People are configured by name in Settings. Each income source belongs to one person.
- Frequency determines display: Annual amounts are shown as-is; Monthly amounts are multiplied by 12 and displayed as annual equivalent in the table (with a monthly indicator).
- Amounts are stored as entered — no pre/post-tax distinction. This is for cash flow projection, not tax calculation.
- No start/end dates — this represents current active income only. Career changes are handled by editing or replacing entries.

**Government Pension Projections (CPP)**

Sources (update annually):
- https://www.canada.ca/en/employment-social-development/programs/pensions/pension/statistics/2026-quarterly-january-march.html
- https://www.canada.ca/en/services/benefits/publicpensions/cpp/amount.html

Values (2026):
- Maximum CPP at 65: $1,507.65/month
- Average CPP at 65: ~$803.76/month
- Early retirement (60): 36% reduction → ~$965/month max
- Late retirement (70): 42% increase → ~$2,141/month max
- Projection uses a conservative estimate (e.g., 70% of max) unless user has actual contribution history
- Formula adjusts for age at claim: -0.6% per month before 65, +0.7% per month after 65

**Government Pension Projections (OAS)**

Sources (update quarterly):
- https://www.canada.ca/en/employment-social-development/programs/pensions/pension/statistics/2026-quarterly-january-march.html
- https://www.savvynewcanadians.com/monthly-oas-benefits-have-increased/

Values (Q1 2026):
- Maximum OAS at 65-74: $742.31/month
- Maximum OAS at 75+: $816.54/month (10% increase)
- Full OAS requires 40 years of Canadian residence after age 18
- Partial OAS: 1/40th per year of residence (minimum 10 years)
- If residence history unknown, assume full (40 years) for simplicity
- User can adjust assumed residence years in Settings if needed

**Calculation Notes**

- Both CPP and OAS are taxable income — projections are pre-tax
- OAS clawback (recovery tax) starts at ~$90,997 net income (2026) — out of scope for projections
- CPP enhancement (ongoing) increases benefits for higher earners — projections use current max

## Edge Cases

- Person without birth year configured: Pension projection section shows "Configure birth year in Settings" prompt instead of amounts.
- Person under 65: Show projected amounts at their expected claim age (default 65, adjustable).
- Person already over 65: Show amounts as "if claiming now" based on current age.
- No income sources entered: Table shows empty state with "Add your first income source" prompt.
- Multiple income sources per person: All listed, total shown as sum at bottom of person's section.
- Amount of $0: Allowed (e.g., tracking a job that's winding down).

## Out of Scope

- Historical income tracking (only current active sources)
- Variable/irregular income modeling (bonuses, commissions)
- Tax withholding or net income calculations
- CPP contribution history import or detailed calculation
- OAS residence history tracking beyond a simple years count
- Other government benefits (GIS, Allowance, Survivor benefits)
- Pension income from employers (private pensions tracked separately if needed)
- Part-time/consulting income projections for early retirement phase
- Income growth rate projections (belongs in scenarios/simulation)
