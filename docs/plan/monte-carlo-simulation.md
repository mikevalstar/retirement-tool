# Monte Carlo Simulation

## Overview

The simulation engine takes a configured scenario and runs thousands of randomized futures through it, producing a year-by-year picture of portfolio value across a range of outcomes. The primary output is a percentile band chart — not a single optimistic line — so the user sees both the upside and the tail risk side by side.

---

## User Experience

### Triggering a simulation

The "Run Simulation" button in the TopBar is always visible. Clicking it opens a **pre-run panel** (right slide-in) showing:
- Which scenario will be simulated (dropdown, defaults to the last-run scenario or first in list)
- The simulation mode: **Standard** or **Stress Test**
- A "Run" button that triggers the server-side simulation

While running, the button shows a spinner with "Crunching X,000 futures…" copy. The run typically completes in under 3 seconds.

On completion, the user is automatically navigated to the **Simulation results page** for that scenario.

### Simulation section — main results page

The Simulation section has its own top-level sidebar entry (section color: bright cyan `--section-simulation`). It has two sub-pages: **Results** and **Settings**.

**Results page**

At the top of the page: a **scenario selector** — a tab strip or compact dropdown showing all scenarios that have been run (i.e., have stored results). Clicking a scenario switches the view to its results. This makes it fast to compare "Conservative" vs "Retire at 60" without a separate compare flow.

The main content for the selected scenario:

**Summary bar** — 3 stat cards across the top:
- **Success rate** — % of simulations where portfolio was > $0 at the planning end year
- **Median final balance** — 50th percentile portfolio value at the planning end year
- **Median depletion year** — median year the portfolio hit $0 in failed runs (hidden if success rate > 95%)

**Portfolio value chart** — large area/band chart spanning today → planning end year:
- Five percentile bands plotted: 10th, 25th, 50th, 75th, 90th
- Bands filled with decreasing opacity from median outward — reads as a cone of uncertainty
- Vertical annotations at key milestone years: retirement, each CPP/OAS start date per person, housing sale events
- Hover interaction: vertical crosshair shows all 5 percentile values for that year in a tooltip
- The chart is the same chart used in the compare overlay (future phase)

**Assumptions panel** (collapsible, below chart):
- Scenario name and run timestamp
- Return assumptions used: expected return and std dev per asset class (snapshot of settings at run time)
- Starting portfolio value
- CPP/OAS base amounts used per person
- Simulation mode (Standard or Stress Test) + crash parameters if stress test

### Overlaying scenarios (interactive compare)

When two or more scenarios have results, a **"Compare" toggle** appears in the scenario selector area. Activating it lets the user pick a second scenario — the chart then overlays both scenarios' **median lines** (solid) and **10th/90th bands** (faint) in distinct colors (each scenario's section color). The summary bar splits into two columns, one per scenario. This is lightweight — no new page, just a toggle within the results view.

---

## Behavior

### What the simulation models year by year

Each year from today through the planning end year, the simulation does the following **in this order**:

1. **Add contributions** (accumulation phase, before retirement year): scenario waypoint amount for that year
2. **Add employment income** (accumulation phase only): sum of all income sources annualized; all sources stop at the household retirement year
3. **Add CPP/OAS income** (from the year each person reaches their claiming age, through end of plan): calculated monthly benefit × 12
4. **Add housing proceeds**: if a housing event is configured for this year, add its net proceeds
5. **Subtract spending** (drawdown phase, from retirement year onward): inflation-adjusted monthly phase amount × 12
6. **Apply portfolio return**: multiply running portfolio value by `(1 + drawn_return)`, where the return is drawn from the return distribution for this year

Portfolio never goes below $0 — once depleted, stays at $0 for all remaining years (ruin state).

### Return distribution — Standard mode

Returns are drawn from a **lognormal distribution** parameterized per asset class. The blended annual return for each year uses the glide path allocation for that year:

```
blended_μ = (equity_pct × equity_μ) + (fixed_pct × fixed_μ) + (cash_pct × cash_μ)
blended_σ = sqrt((equity_pct × equity_σ)² + (fixed_pct × fixed_σ)² + (cash_pct × cash_σ)²)
```

Draw is independent per year, per run (no autocorrelation — standard simplification for parametric Monte Carlo).

**Fallback if no glide path configured**: 100% equity during accumulation, linear de-risk from 60% equity at retirement to 30% equity at planning end year. This is clearly labeled as a fallback in the assumptions panel.

### Return distribution — Stress Test mode

Stress Test injects **market crash events** on top of the standard return model. Each year, the simulation first checks whether a crash occurs (Poisson process, one draw per year per run). If a crash is triggered, the return for that year is drawn from a **crash distribution** instead of the normal distribution.

The user picks a **crash severity profile** (in Simulation Settings or in the pre-run panel):

| Profile | Annual crash probability | Crash return range | Historical analogue |
|---|---|---|---|
| **Mild** | ~15% (once per ~7 years) | –20% to –40% | Dot-com, 2020 COVID |
| **Severe** | ~7% (once per ~14 years) | –35% to –60% | 2008 Financial Crisis |
| **Catastrophic** | ~3% (once per ~33 years) | –55% to –85% | 1929 Great Depression |

Crash return is drawn uniformly within the range. Crash years still apply the glide path allocation, so a heavily de-risked portfolio (low equity %) takes a smaller hit.

These profiles are based on observed S&P 500 bear market history: ~27 bear markets since 1928 (~1 every 3.5 years on average), with the most severe crashes occurring roughly once per generation.

The assumptions panel clearly labels stress test results with the profile used, so the user knows they're looking at a deliberately pessimistic scenario.

### CPP/OAS income calculation

**CPP at claim age (per person):**
- Base at 65: `$1,507.65/month` (2026 max) × CPP base multiplier (default 70%, user-settable in Simulation Settings)
- Adjustment: –0.6%/month before 65, +0.7%/month after 65, relative to claim age
- Claim age comes from `ScenarioCppOas.cppClaimAge` for this scenario

**OAS at claim age (per person):**
- Base at 65: `$742.31/month` (ages 65–74), `$816.54/month` (age 75+) — 2026 max
- Prorated by residence: `min(oasResidenceYears, 40) / 40`
- Deferral: +0.6%/month deferred past 65, relative to claim age
- Claim age comes from `ScenarioCppOas.oasClaimAge`

Benefits are fixed nominal amounts — not inflation-indexed in the simulation (conservative, since real CPP/OAS does index to CPI, so this understates income slightly).

### Spending (drawdown phase)

Spending phases are stored in today's dollars. Each year the simulation inflates:

```
actual_spending = monthly_amount × 12 × (1 + inflation_rate)^(year − current_year)
```

`inflation_rate` is the scenario's global rate. `current_year` is the calendar year the simulation is run (captured at run time).

The active phase for a given year is the phase whose `startYear` is ≤ that year (latest qualifying phase wins).

### Starting portfolio value

Sum of the most recent `BalanceSnapshot` for every account. All account types (TFSA, RRSP, RRIF, Regular Savings, Chequing) are pooled — no withdrawal sequencing or account-type distinction. This is an explicit simplification; tax-optimized withdrawal ordering is out of scope.

### Storing results

Simulation results are stored as a JSON blob on the Scenario record. Only the most recent run is stored — re-running overwrites. Stored data:

- Run timestamp
- Simulation mode + crash profile (if stress test)
- Return assumptions snapshot (the global settings at run time)
- CPP/OAS base multiplier used
- Starting portfolio value
- Per-year data: 10th / 25th / 50th / 75th / 90th percentile portfolio values (from today → planning end year)
- Success rate
- Median depletion year (for failed simulations)

---

## Simulation Settings

A sub-page at **Simulation → Settings**. Global settings that apply to all simulation runs.

**Return assumptions (per asset class):**

| Field | Default |
|---|---|
| Equities — expected annual return | 7% |
| Equities — annual std deviation | 15% |
| Fixed Income — expected annual return | 3.5% |
| Fixed Income — annual std deviation | 6% |
| Cash — expected annual return | 2% |
| Cash — annual std deviation | 1% |

**CPP/OAS:**
- CPP base multiplier (% of maximum benefit, default 70%)

**Simulation engine:**
- Number of runs (default 1,000, range 500–5,000)

Settings are seeded with defaults on first visit. All fields are editable inline with immediate save (no submit button — same pattern as other settings pages in the app).

---

## Edge Cases

- **No balance snapshots**: Simulation blocked with a clear message — "Add at least one account balance before running."
- **No spending phases**: Simulation blocked — "Scenario needs at least one spending phase."
- **No retirement year on scenario**: Simulation blocked — scenario is incomplete.
- **No glide path**: Falls back to default allocation profile (described above, labeled clearly in results).
- **No income sources**: Simulation runs without employment income — fine if user is already retired or entering post-retirement assumptions only.
- **No CPP/OAS claiming ages configured for a person**: That person's benefits are excluded from the simulation entirely.
- **Claiming age already passed**: Treat as if benefits started at the beginning of the simulation (today's year).
- **Multiple housing events in the same year**: All proceeds added to the portfolio in that year — no conflict.
- **Property sale year after planning end year**: Excluded from simulation silently (the scenario editor already flags this).
- **Scenario has no stored results yet**: The scenario tab in the results page shows an empty state with a "Run Simulation" call to action.
- **Simulation takes > 5 seconds**: Progress indicator with count-up of completed runs. No timeout — let it finish.

---

## Out of Scope

- **RRSP/TFSA withdrawal sequencing** — all accounts pooled; tax-optimized drawdown is a future feature
- **Tax modeling** — pre-tax throughout; marginal rates, RRSP deduction, OAS clawback all excluded
- **Autocorrelated returns** — each year drawn independently (sequence-of-returns risk is captured implicitly through variance)
- **Historical block resampling** — parametric only; block resampling considered future enhancement
- **Part-time income during early retirement** — income stops at household retirement year
- **Per-person retirement years** — single household retirement year
- **Inflation-indexed CPP/OAS** — treated as fixed nominal; slightly conservative
- **Run history** — only the most recent run stored per scenario
- **Export / report generation** — charts are screen-only for now
