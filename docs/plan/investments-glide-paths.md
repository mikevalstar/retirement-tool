# Investment Glide Paths

## Overview

A planned schedule for how the portfolio's target allocation should shift over time as retirement approaches and continues through the retirement years. Answers the question "how should I de-risk my portfolio over time?" — and feeds directly into the simulation's future return modeling.

## How Glide Paths Work (on-page explanation)

The page includes a persistent explainer panel — visible whether or not any waypoints have been added — because the "through retirement" concept is non-obvious and easy to misconfigure.

**Explainer content:**
> A glide path is your de-risking plan. You set a series of yearly targets — for example: in 2030 be at 75% equities, in 2040 be at 55%, in 2050 be at 40%. The simulation interpolates between your waypoints to model how returns should shift year by year.
>
> **Why does the glide path continue past retirement?**
> If you retire at 65 and live to 90, your portfolio has a 25-year drawdown horizon. Locking into a fully conservative allocation at retirement leaves too little growth potential for those later decades. A "through retirement" glide path keeps de-risking gradually — reaching its most conservative point around age 80–85, not at the retirement date itself. This is the approach used by major Canadian target-date funds.
>
> **Tip:** Add at least 3–4 waypoints: one near today, one at your target retirement year, and one or two in the years well beyond retirement.

## User Experience

**The waypoint table:**
Columns: Year, Equities %, Fixed Income %, Cash %, (delete icon). Sorted by year ascending. Rows for years in the past are visually dimmed — they're historical reference points, not active targets. The current year (or the nearest future waypoint) is subtly highlighted as "your current position in the plan."

**Adding a waypoint:**
"Add Waypoint" button opens a right slide-in panel. Fields: Year (number input, four digits), Equities %, Fixed Income %, Cash % (three inputs with a live running total that turns red if not 100). If the entered year already has a waypoint, a warning appears inline: "A waypoint for [year] already exists — saving will replace it." Save closes the panel and the table re-sorts. Cancel discards.

**Deleting a waypoint:**
Trash icon on each row. Immediate, no confirmation.

**Visual: allocation trajectory chart**
Below the table, a simple line chart: X axis = years (spanning from the earliest to latest waypoint, extended slightly), Y axis = allocation %. Three lines: Equities (green), Fixed Income (muted blue), Cash (gray). The lines are straight between waypoints (linear interpolation — same as what the simulation uses). A vertical dashed line marks the current year. A second vertical dashed line marks the target retirement year if it's configured in Settings.

The chart is hidden if fewer than 2 waypoints exist — a prompt replaces it: "Add at least two waypoints to see your glide path trajectory."

Empty state (no waypoints at all): shows the explainer prominently + "Add your first waypoint" button.

## Behavior

- Waypoints are sorted by year at all times.
- The simulation uses linear interpolation between waypoints — no smoothing or curves.
- Waypoints in the past are stored and displayed but treated as historical by the simulation (it uses the current year as the starting point, not the first waypoint).
- There is one glide path for the portfolio as a whole — not per account.
- Adding a waypoint for a year that already exists replaces the old one (with on-panel warning).
- The allocation chart uses the same three colors as the allocation bar on the Dashboard and Allocations pages for visual consistency.

## Edge Cases

- Only one waypoint — chart is not shown (can't draw a line with one point); prompt to add more.
- Waypoints that don't form a clean declining equity curve — allowed. The tool doesn't enforce "correct" de-risking direction. User can model any path.
- All waypoints in the past — chart renders them dimmed; no future trajectory line is drawn. A warning note suggests adding future waypoints.
- Waypoint with sum ≠ 100 — Save is blocked until inputs sum to 100.
- Target retirement year not configured in Settings — the retirement year marker on the chart is simply omitted.
- Waypoints with a year gap of 1 year — valid; interpolation still works (two adjacent points produce a straight segment).

## Out of Scope

- Per-account glide paths (one portfolio-wide path only)
- Non-linear (curved) interpolation between waypoints
- Importing glide paths from target-date fund benchmarks

**Note:** Recommended glide path generation is covered in [`recommended-glide-path.md`](./recommended-glide-path.md).
