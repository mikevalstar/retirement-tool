# Recommended Glide Path Generation

## Overview

When the glide paths page is empty, offer to generate a recommended set of waypoints based on industry-standard target-date fund glide paths. Requires birth year (from Settings) and asks for target retirement age during the wizard.

## User Experience

**Empty state enhancement:**
The existing "No waypoints yet" empty state gains a new secondary action: "Generate recommended path" (below "Add your first waypoint"). Clicking it opens the generation wizard.

**Precondition check:**
If no Person has a birth year configured, the wizard shows a blocking message: "To generate a recommended glide path, add your birth year in Settings first." with a link to Settings. The wizard cannot proceed until birth year is configured.

**Generation wizard (right slide-in panel):**
1. **Birth year confirmation** — Shows the configured birth year(s) from People. If multiple people, shows both and notes the glide path uses the older person's age for de-risking calculations.
2. **Target retirement age** — Number input, defaults to 65. Range: 55–75. Helper text: "This determines when the glide path reaches its midpoint de-risking level."
3. **Preview chart** — Shows the generated path with waypoints at: current year, retirement year, and several points through retirement. User can see the trajectory before accepting.
4. **Actions** — "Generate waypoints" (creates them) or "Cancel".

**After generation:**
- The waypoints are saved and the page shows the populated table and chart
- User can edit/delete individual waypoints just like manually-added ones

## Behavior

**Glide path formula (based on Vanguard/TSP/Fidelity industry standard):**
- Uses the older person's age if multiple People exist
- Current year waypoint: Equity allocation based on current age using linear decline from 90% at age 25 to 30% at age 85
- Retirement year waypoint: ~50-55% equities (depends on retirement age)
- Post-retirement waypoints: Continue declining to ~25-30% equities by age 80-85
- All waypoints: Fixed Income + Cash make up the remainder, split roughly 60/40 (e.g., at 50% equities → 30% fixed income, 20% cash)

**Generated waypoints:**
1. Current year (or nearest future Jan 1)
2. Retirement year (birth year + retirement age)
3. Retirement + 5 years
4. Retirement + 10 years
5. Retirement + 15 years (or age 85, whichever comes first)

**Allocation formula:**
```
equityPct = 90 - ((age - 25) / (85 - 25)) * 60
         = 90 - (age - 25) * 1.0
         = 115 - age (clamped to 30-90)
```

Examples:
- Age 35: 80% equities
- Age 45: 70% equities
- Age 55: 60% equities
- Age 65: 50% equities
- Age 75: 40% equities
- Age 85: 30% equities

Fixed income and cash split: 60/40 of the non-equity portion.

## Edge Cases

- Multiple people with birth years — use the older person's age (more conservative de-risking)
- Birth year in the future — blocked at Settings validation
- Retirement age < current age — wizard shows warning: "Retirement age is in the past. Choose a future retirement age."
- User already has waypoints — the "Generate recommended path" button is hidden (only shown in empty state)
- User deletes all waypoints — "Generate recommended path" button reappears

## Out of Scope

- Per-person glide paths (one portfolio-wide path only)
- Customizing the formula parameters (equity floor/ceiling, glide path shape)
- Regenerating/overwriting existing waypoints with a new recommendation
- Integration with scenarios feature (will be addressed separately)
