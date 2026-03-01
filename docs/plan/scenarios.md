# Scenarios

## Overview

A **scenario** is a named "what-if future" layered on top of today's financial data. It defines when the household retires, how savings accumulate until then, how spending unfolds through retirement phases, when government benefits are claimed, and what housing events happen. Multiple scenarios can be compared side by side. The simulation engine (built next) will consume one or more scenarios to produce percentile outcome bands.

---

## User Experience

The Scenarios section has two sub-pages: **Configure** (list and edit scenarios) and **Compare** (side-by-side view of exactly two scenarios).

The configure page shows a list of named scenarios. Clicking one opens a full dedicated edit page — not a panel — because a scenario has enough fields to warrant its own screen. Each section of the edit page is clearly delineated: identity, accumulation (pre-retirement), retirement phases (post-retirement), government benefits, and housing events.

When creating a new scenario, the app pre-fills sensible defaults: the retirement year from the glide path wizard in Settings (if available), an inflation rate of 3%, CPP/OAS claiming at 65 for both people, and a single spending phase labeled "Go-Go." The user works through and adjusts from there.

---

## Behavior

### Scenario identity
- A **name** (free text, e.g., "Conservative", "Retire at 60")
- A **planning end year**: the year the simulation stops — roughly the expected end of life for the longer-lived person. Expressed as a calendar year.
- A **global inflation rate** (annual %, default 3%)

### Retirement year
- A single **household retirement year** — the year both people are fully retired
- This is the boundary between accumulation (saving) and drawdown (spending) phases

### Savings contributions — pre-retirement
- A **step-function table** of annual contribution amounts by year
- The user enters waypoints: year + annual amount (e.g., 2026 → $24,000/year, 2028 → $18,000/year)
- Between waypoints, the amount stays flat (not interpolated — these are discrete planned changes)
- The system automatically adds a $0 entry at the retirement year — contributions stop at retirement
- Interface: a small table with an "add waypoint" button, similar in spirit to the glide path waypoints
- Visual: a step chart showing the shape of contributions over time

### Retirement spending phases — post-retirement
- An ordered list of **named phases**, each with a start year and a monthly spending target
- The first phase's start year is fixed to the retirement year
- Subsequent phases can be named anything — Go-Go, Slow-Go, No-Go are the suggested defaults but are free text
- The last phase runs through to the planning end year
- Phases can be added, reordered, or deleted
- Monthly amounts represent **today's dollars** — the simulation applies inflation when projecting actual year-by-year spending
- Visual: a step chart showing monthly spending by year across all phases

### CPP/OAS claiming ages
- **Per person**: CPP claiming age (60–70) and OAS claiming age (65–70)
- Birth year for each person is **required** in Settings — the scenario form blocks this section with a "configure birth year in Settings" message if missing
- The income section's calculated monthly amounts (from birth year) serve as the base; the simulation applies the CPP/OAS adjustment formula (CPP: −0.6%/month before 65, +0.7%/month after 65; OAS: +0.6%/month deferred past 65)
- If only one person is configured in Settings, CPP/OAS fields for the second person are hidden

### Housing events
- A list of planned **property sale events**, one per property maximum
- Each event: pick a property (from Housing), a sale year, and expected net proceeds
- The app **suggests** a net proceeds amount: current estimated property value × (1 + inflation rate)^(years from now to sale year). User can override freely.

---

## Compare View

- Select exactly **two** scenarios to compare
- Side-by-side display:
  - Retirement year
  - Planning end year + inflation rate
  - CPP/OAS claiming ages (per person, per scenario)
  - Contributions over time (small step chart)
  - Spending phases (small step chart or compact table)
  - Housing events (list)
- Pre-simulation: parameter comparison only — no outcome data
- Post-simulation (future phase): gains an overlay chart showing each scenario's median outcome line and percentile bands

---

## Edge Cases

- If no spending phases are defined, the scenario is flagged as incomplete — shown visually but not a hard block on saving
- If a phase start year is before the retirement year, show an inline validation note
- Phases are stored with an explicit sort order and auto-sorted by start year when saved
- If a property sale year is after the planning end year, show an inline note — but allow it
- If only one person is configured in Settings, second-person CPP/OAS fields are hidden entirely

---

## Out of Scope

- Working or part-time income during retirement
- Per-category inflation (single rate applies to all spending)
- RRSP/TFSA contribution room enforcement
- Pension income beyond CPP/OAS
- Inheritance or windfall events (candidate for a future "one-time events" feature)
- Comparing more than two scenarios simultaneously
