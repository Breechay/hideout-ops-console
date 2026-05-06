# Operator Intelligence Roadmap

## Purpose

Define the next evolution of Hideout Ops Console from manual ledger into an operator guidance system grounded in Square + inventory + portion control.

## Doctrine

- Console is an operator instrument, not analytics theater.
- Direction beats decoration.
- Observations must be traceable to real inputs.
- No fake intelligence.
- No generic business advice.
- Every recommendation should answer: "What should the operator do today?"
- Human confirms decisions; system clarifies reality.

## 1) Current Phase: Square-Backed Ledger

- Square syncs revenue, orders, top item, and hourly windows.
- Today can auto-save Square-owned transaction facts after close.
- Manual fields remain operator-owned.

## 2) Next Phase: Reality Model

### Inputs Needed

- Square item-level sales quantities
- Menu item recipe map
- Ingredient cost table
- Portion assumptions
- Inventory counts
- Waste/spoilage/manual adjustment entries
- Staffing hours (if available later)

## 3) Computed Outputs

Per day, compute:

- Estimated ingredient usage by item sold
- Estimated COGS
- Gross margin by item
- Variance between expected inventory and actual inventory
- Low-stock warnings
- Over-portion suspicion
- Item profitability ranking
- Order mix shifts
- Hourly demand patterns

## 4) Operator Guidance Layer

Example guidance lines:

- "Erik's Addiction sold 18 times. Expected peanut butter use: X oz. Actual use appears high. Check scoop size."
- "Avocado toast is driving revenue but margin is thinner than bowls. Review price or portion."
- "7-10 AM underperformed. Do not add labor earlier tomorrow."
- "Top item strong, but average ticket low. Bundle opportunity: coffee + bowl."
- "Inventory variance is too high to trust COGS today. Count bananas before reordering."

## 5) Guardrails

Do not build:

- Vanity dashboards
- Charts without decisions
- AI summaries unsupported by data
- Automatic price changes
- Automatic ordering
- Customer marketing automation
- Notifications
- Gamification

## 6) Implementation Sequence

- Phase A - Square item quantities
- Phase B - Recipe/ingredient mapping
- Phase C - Ingredient usage model
- Phase D - Expected vs actual inventory
- Phase E - Margin + portion-control observations
- Phase F - Daily operator briefing

## 7) Data Model Sketch

Proposed minimal tables/objects:

- `menu_items`
- `ingredients`
- `recipes`
- `daily_inventory_counts`
- `waste_adjustments`
- `square_item_sales`
- `daily_operator_observations`

## 8) UI Principle

One primary read per day:

- What happened?
- What changed?
- What needs action?

Keep Today operational. Add guidance as a compact block, not a new dashboard.
