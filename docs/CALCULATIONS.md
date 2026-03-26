# Fox Valley Finance Tracker - Calculation Rules

This document defines the exact math used throughout the application. All calculations follow these simple, consistent rules.

## Basic Formula

For every estimate and receipt:

```
Total = Subtotal + HST
```

- **Subtotal**: Manually entered value (before tax)
- **HST**: Manually entered tax amount (optional, defaults to 0)
- **Total**: Automatically calculated as the sum

---

## Dashboard Cards (7 Cards)

### Card 1: Total - All Estimates
**Formula:**
```sql
SUM(estimated_total)
WHERE estimate.status IN ('draft', 'active')
  AND NOT estimate.is_archived
```

**What it means:** Sum of all draft and in-progress estimates (their total value including HST)

---

### Card 2: Total - In-Progress
**Formula:**
```sql
SUM(estimated_total)
WHERE estimate.status = 'active'
  AND NOT estimate.is_archived
```

**What it means:** Sum of only active/in-progress estimates

---

### Card 3: Total Paid
**Formula:**
```sql
SUM(receipt.total)
FROM receipts r
JOIN estimates e ON r.estimate_id = e.id
WHERE e.status = 'active'
  AND NOT e.is_archived
```

**What it means:** Sum of receipts linked to ACTIVE estimates only

---

### Card 4: Outstanding
**Formula:**
```
MAX(0, Total - In-Progress - Total Paid)
```

Or in SQL:
```sql
GREATEST(0,
  (SELECT SUM(estimated_total) FROM estimates WHERE status = 'active') -
  (SELECT SUM(r.total) FROM receipts r
   JOIN estimates e ON r.estimate_id = e.id
   WHERE e.status = 'active')
)
```

**What it means:** How much is left to pay on active work

---

### Card 5: Total - Individual Receipts
**Formula:**
```sql
SUM(receipt.total)
WHERE receipt.estimate_id IS NULL
```

**What it means:** Sum of all receipts NOT linked to any estimate (retail purchases like Home Depot)

---

### Card 6: Total - HST (Individual)
**Formula:**
```sql
SUM(receipt.tax_total)
WHERE receipt.estimate_id IS NULL
```

**What it means:** Tax amount from individual receipts (not linked to estimates)

---

### Card 7: Total - HST (Estimates)
**Formula:**
```sql
SUM(estimate.hst_amount)
WHERE estimate.status = 'completed'
  AND NOT estimate.is_archived
```

**What it means:** Tax amount stored on completed estimates (captured when estimate auto-completes)

**Note:** This is stored in the `hst_amount` field on the estimate when it's marked as completed.

---

## Vendor Detail Page Cards

The vendor detail page shows the same cards as the dashboard, but filtered to that specific vendor:

1. **Total - All Estimates**: Draft + Active for this vendor
2. **Total - In-Progress**: Active only for this vendor
3. **Total Paid**: Receipts linked to vendor's active estimates
4. **Outstanding**: In-Progress minus receipts to active
5. **Total - Individual Receipts**: Vendor's receipts not linked to estimates
6. **Total HST Paid**: HST from vendor's completed estimates + HST from receipts linked to completed estimates

---

## Estimate Status Flow & Auto-Complete

### Status Definitions

| Status | Meaning | Counts Toward |
|--------|---------|---------------|
| `draft` | Initial quote, not yet committed | Card 1 only |
| `active` | Work in progress, payments being made | Cards 1, 2, 3, 4 |
| `completed` | Work finished, fully paid | HST tracking only |
| `declined` | Quote rejected | Nothing |

### Auto-Complete Rule

An estimate automatically becomes `completed` when:

```
SUM(linked_receipts.total) >= estimate.estimated_total
```

When this happens:
1. Status changes to `completed`
2. `hst_amount` is calculated: `estimate.estimated_total * 0.13` (13% Ontario HST)
3. The HST amount flows to Card 7

### Auto-Revert Rule

If receipts are unlinked or deleted bringing the total below the estimate:

```
IF SUM(linked_receipts.total) < estimate.estimated_total AND status = 'completed':
    status = 'active'
    hst_amount = 0
```

---

## Receipt Types

### Type 1: Linked to Estimate
- Belongs to a contract vendor
- Reduces outstanding amount (if estimate is active)
- Counts toward Card 3 (Total Paid)

### Type 2: Individual (Unlinked)
- Belongs to a retail vendor (like Home Depot)
- Not associated with any estimate
- Counts toward Card 5 (Individual Receipts)
- Tax counts toward Card 6 (HST Individual)

---

## Database Schema Reference

### estimates table
```sql
- estimated_total: NUMERIC (subtotal + hst_amount, calculated)
- hst_amount: NUMERIC (manually entered or auto-calculated on complete)
- status: ENUM ('draft', 'active', 'completed', 'declined')
```

### receipts table
```sql
- total: NUMERIC (subtotal + tax, calculated)
- tax_total: NUMERIC (HST amount entered)
- estimate_id: UUID? (NULL for individual receipts)
```

---

## Common Questions

**Q: Why does Total Paid only count receipts to active estimates?**
A: Because once an estimate is completed, it's "done." Receipts to completed estimates don't reduce outstanding—they're just payment history.

**Q: What's the difference between Card 6 and Card 7?**
A: Card 6 is HST from retail receipts (Home Depot, etc.). Card 7 is HST from completed contract work (stored on the estimate).

**Q: Why doesn't the dashboard show draft estimates in "In-Progress"?**
A: Draft estimates are quotes that haven't been committed to. Only "active" estimates represent ongoing work.

---

## Date Range Filtering

All cards respect the date range filter (except Cards 1, 2, and 7 which are current snapshots):

- Cards 3, 4: Filter receipts by date
- Card 5, 6: Filter individual receipts by date
- Cards 1, 2, 7: Always show current totals (not date-filtered)

---

## Validation Checklist

When reviewing calculations, verify:

- [ ] Subtotal + HST = Total for every estimate/receipt
- [ ] Draft + Active = Card 1
- [ ] Active only = Card 2
- [ ] Receipts to active estimates = Card 3
- [ ] Card 2 - Card 3 = Card 4 (or 0 if negative)
- [ ] Unlinked receipts = Card 5
- [ ] Tax on unlinked receipts = Card 6
- [ ] Completed estimates HST = Card 7
