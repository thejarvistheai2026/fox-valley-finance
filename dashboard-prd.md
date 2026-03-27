# Dashboard redesign — PRD

## Overview

The current dashboard displays seven summary cards in a flat grid. All cards sit at the same visual level, which makes it difficult to distinguish between potential spend, active cash flow, and historical totals. Completed estimates have no representation on the dashboard at all, creating a gap in long-term spend tracking.

This redesign organizes the dashboard into three distinct sections, each answering a different financial question.

---

## Section 1 — Budget

**Question answered:** What might I need to spend?

This section shows the total value of draft estimates — trades we've received quotes from but haven't locked in yet. These are potential commitments, not active obligations.

| Card | Calculation | Description |
|------|------------|-------------|
| Draft estimates | `SUM(estimated_total) WHERE status = 'draft'` | Total value of estimates not yet approved |

**Copy:**
- Section label: "Budget"
- Subtitle: "What might I need to spend?"
- Card subtitle: "Potential commitments not yet locked in"

---

## Section 2 — Active cash flow

**Question answered:** What vendors am I currently working with, and what do I owe?

This section tracks estimates that have been approved and are actively being worked. It shows the total commitment, what's been paid via deposits and advancements, and what's still outstanding.

| Card | Calculation | Description |
|------|------------|-------------|
| In-progress | `SUM(estimated_total) WHERE status = 'active'` | Total value of active estimates |
| Paid | `SUM(receipt totals) WHERE receipt.estimate_id IN (active estimates)` | Deposits and advancements made against active work |
| Outstanding | `MAX(0, In-progress − Paid)` | Remaining balance owed to active vendors |

**Copy:**
- Section label: "Active cash flow"
- Subtitle: "What's currently in progress with vendors?"
- In-progress subtitle: "Active estimates"
- Paid subtitle: "Deposits & advancements made"
- Outstanding subtitle: "Remaining balance owed"

---

## Section 3 — Total spend & tax

**Question answered:** What have I spent overall, and what's the HST breakdown for accounting?

This section captures completed work, miscellaneous expenses, and HST totals. This is where estimates go once they auto-complete (receipts ≥ estimate total), giving them a permanent home on the dashboard.

| Card | Calculation | Description |
|------|------------|-------------|
| Completed estimates | `SUM(estimated_total) WHERE status = 'completed'` | Fully paid vendor work |
| Misc. receipts | `SUM(receipt totals) WHERE estimate_id IS NULL` | Receipts not tied to any estimate |
| HST — estimates | `SUM(hst_amount) WHERE status = 'completed'` | HST from completed vendor estimates (13% of estimated_total, calculated at auto-complete) |
| HST — misc. | `SUM(tax_total) WHERE estimate_id IS NULL` | HST from unlinked receipts |

**Copy:**
- Section label: "Total spend & tax"
- Subtitle: "What have I spent overall?"
- Completed estimates subtitle: "Fully paid vendor work"
- Misc. receipts subtitle: "Not tied to an estimate"
- HST — estimates subtitle: "From completed estimates"
- HST — misc. subtitle: "From unlinked receipts"

---

## What changes from the current dashboard

1. **"Total - All Estimates" card is removed.** It previously summed draft + active, blending two different questions. Drafts and active estimates now live in their own sections.
2. **Completed estimates are now represented.** Previously they disappeared from the dashboard entirely after auto-completing.
3. **Cards are grouped into three labeled sections** instead of a flat seven-card grid.
4. **No logic changes required.** All existing calculations remain the same. The only structural change is splitting the draft/active filter on the old "Total - All Estimates" card into two separate section queries, and adding a new query for `status = 'completed'`.

---

## Layout

- **Budget:** 1 card, full width
- **Active cash flow:** 3 cards in a row (in-progress, paid, outstanding)
- **Total spend & tax:** 2 cards top row (completed estimates, misc. receipts), 2 cards bottom row (HST — estimates, HST — misc.)

Each section has a label and a one-line subtitle describing the question it answers. The "All time" filter dropdown remains and applies globally across all three sections.
