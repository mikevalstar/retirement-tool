# Retirement Planning Tool — High-Level Overview

## Purpose

A personal retirement planning tool that models the full arc of financial life from today through retirement and beyond. The goal is to answer two core questions with real statistical confidence:

1. **When can I retire?**
2. **How much can I retire with?**

Rather than using static averages, this tool runs Monte Carlo-style simulations that produce honest error bars — a realistic range of outcomes based on how real life varies.

---

## Core Domains

### 1. Financial Assets & Investments
- Track current investment accounts (taxable, tax-deferred, tax-free)
- Record historical returns per account/asset class
- Model planned de-risking over time (e.g., shifting from equities to bonds as retirement approaches)
- Support custom allocation glide paths (not just age-based defaults)

### 2. Income
- Current employment income, with ability to project raises or career changes
- Part-time or consulting income in early retirement
- Social Security (with multiple claiming age scenarios)
- Pension income if applicable
- Rental or passive income streams

### 3. Expenses & Budget
- Set a current household budget as the baseline
- Categorize spending (housing, food, health, travel, discretionary, etc.)
- Project budget changes over time (kids leaving, mortgage payoff, healthcare costs rising)
- Model retirement spending phases:
  - **Go-Go years** — active retirement, higher discretionary spending (travel, hobbies)
  - **Slow-Go years** — moderate activity, reduced travel, stable costs
  - **No-Go years** — lower activity but higher healthcare costs
- Apply inflation assumptions per spending category

### 4. Housing & Major Assets
- Track mortgage balance, remaining term, and payoff date
- Model the financial impact of payoff (freed cash flow)
- Support future housing changes (downsizing, relocation, second property)
- Include home equity as an asset with its own appreciation model

### 5. Taxes
- Rough tax modeling across income sources and account types
- Roth conversion scenario planning
- Required Minimum Distribution (RMD) impact in later years

### 6. Risk & Variability
- Each input domain supports a variance/uncertainty model
- Market returns draw from historical distributions (not just averages)
- Sequence-of-returns risk explicitly modeled (bad early years are much worse than bad late years)
- Longevity risk: model across a range of lifespans

---

## Simulation Engine

The tool runs many thousands of simulated futures using the configured inputs and their variance models. Each simulation produces a year-by-year picture of:

- Net worth
- Annual cash flow (income minus expenses)
- Portfolio drawdown rate
- Probability of portfolio survival to a given age

Results are aggregated into percentile bands (e.g., 10th / 25th / 50th / 75th / 90th) so the user sees not just a "best guess" but a realistic range of outcomes. This is the core output that drives retirement decisions.

---

## Key Outputs & Scenarios

- **Retirement readiness by year** — "If I retire at 55 vs 60 vs 65, what does each look like?"
- **Safe withdrawal rate** — What drawdown rate keeps the portfolio solvent across most scenarios?
- **Spending flexibility** — How much does reducing Go-Go spending improve outcomes?
- **De-risking sensitivity** — How does the timing and aggressiveness of de-risking affect outcomes?
- **Housing impact** — What does downsizing at 65 add to the picture?
- **Social Security timing** — Take at 62 vs 67 vs 70?

---

## Data & Storage

- All data is entered manually by the user — no integrations or account syncing
- Everything is stored locally in a SQLite database
- No cloud sync, no external services

## User Workflow

1. **Data Entry** — User manually enters their current financial snapshot: accounts, income, mortgage, budget
2. **Scenario Configuration** — User defines planned changes over time (income growth, de-risking schedule, housing events, retirement date candidates)
3. **Run Simulation** — Tool runs the statistical model across all configured scenarios
4. **Review Results** — User explores output charts showing percentile bands across time
5. **Iterate** — Adjust assumptions, run again, compare scenarios side by side

---

## Guiding Principles

- **Honest over optimistic** — The tool should surface risk, not hide it
- **Personal over generic** — Defaults are starting points; everything is configurable to actual life
- **Iterative** — Start simple, add complexity as the model is validated against real data
- **Understandable** — Outputs should be readable by a person, not just a financial analyst

---

## Design

UI design decisions (layout, navigation, color system, data entry patterns, command palette, etc.) are documented separately:

→ [`docs/plan/ui-design-overall.md`](./ui-design-overall.md)
