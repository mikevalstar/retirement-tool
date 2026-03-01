# Housing

## Overview

Track real estate properties with mortgage details. A simple list showing each property's estimated value, outstanding mortgage balance, and interest rate — enough to model housing in retirement projections without overcomplicating.

## User Experience

**Properties list (Housing)**

A dense table showing all properties. Columns: property name, estimated value, mortgage balance, mortgage rate. An "Add Property" button sits above the table.

**Adding a property**

Clicking "Add Property" opens a right slide-in panel. Fields: name (free text, e.g., "Primary Residence", "Cottage"), estimated value (numeric), mortgage balance (numeric), mortgage rate (percentage). Save closes the panel and the new property appears in the table.

**Editing a property**

Click any row to expand in-place (accordion). The expanded area shows the same fields in an editable inline form. Tab → Enter to save changes.

**Removing a property**

Delete icon at the end of each table row. Immediate, no confirmation.

## Behavior

- Each property is standalone — no owner assignment (unlike accounts/income which are per-person)
- Estimated value is the current market value estimate, updated manually
- Mortgage balance is the remaining principal
- Mortgage rate is the annual interest rate (e.g., 5.25%)
- No mortgage payment calculations — this is for net worth tracking, not cash flow modeling
- No amortization schedule or payoff projections (belongs in simulation)

## Edge Cases

- No properties entered: Table shows empty state with "Add your first property" prompt
- Paid-off property: Mortgage balance of $0 is allowed, rate can be left blank
- Rental property: Allowed, but no rental income tracking here (that would be an income source)

## Out of Scope

- Mortgage payment schedules or amortization calculators
- Property tax or insurance tracking
- Rental income/expenses
- Property appreciation projections
- Multiple mortgages per property
- Home equity line of credit (HELOC)
