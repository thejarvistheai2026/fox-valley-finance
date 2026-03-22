# Fox Valley Finance Tracker — Product Requirements Document

**Version:** 1.0 (Draft)
**Date:** March 16, 2026
**Author:** [Your Name]
**Status:** Draft — awaiting review

---

## 1. Overview

Fox Valley Finance Tracker is a personal-use web and mobile application for tracking estimates, receipts, invoices, and vendor payments during the construction of a residential home. It provides a centralized record of what was quoted vs. what was actually paid, with per-vendor balance tracking and Canadian HST tax visibility.

### 1.1 Problem Statement

During residential home construction, homeowners deal with dozens of vendors — contractors who provide estimates and bill in stages, and retailers where materials are purchased ad hoc. Tracking what was quoted, what's been paid, what's outstanding, and how much HST has been collected across all vendors is tedious and error-prone when managed through spreadsheets, email, and paper files.

### 1.2 Target Users

- **Primary:** 2 beta users (homeowners managing a residential build)
- **Scale:** Personal use only. No multi-tenancy, no public registration.

### 1.3 Comparable Products

| Product | Relevance | Gap for our use case |
|---|---|---|
| **Remodelum** | Homeowner-focused renovation tracker with budget vs. actuals, contractor payments, invoice storage | Closest match. More complex than needed (project templates, cost estimation algorithms). No mobile OCR. |
| **Joist / GetCost** | Contractor-side estimate → invoice workflow | Built for the vendor, not the homeowner receiving the estimate. |
| **Expensify / SimplyWise** | Receipt scanning and expense categorization | No concept of estimates, vendor relationships, or outstanding balances. |
| **QuickBooks Self-Employed** | Expense tracking with receipt scanning and tax categorization | Overkill for personal use; subscription cost; not focused on estimate-to-payment tracking. |

Fox Valley is intentionally simpler than all of the above: no budgeting engine, no payment processing, no team collaboration. It's a focused tool for one job — know what you were quoted, what you've paid, and what you still owe, with receipts attached.

---

## 2. User Stories

### 2.1 Vendor Management

- **US-1:** As a user, I can create a new vendor with a name and optional contact info (phone, email, address, notes).
- **US-2:** As a user, I can categorize a vendor as either **Contract** (estimate-driven, e.g., electrician) or **Retail** (receipt-only, e.g., Home Depot).
- **US-3:** As a user, I can search and filter vendors by name or tag.
- **US-4:** As a user, I can edit or archive a vendor (soft delete — no hard deletes).

### 2.2 Estimates (Contract Vendors Only)

- **US-5:** As a user, I can add one or more estimates to a Contract vendor.
- **US-6:** Each estimate has: a title/description, date, estimated total (CAD), an optional attached document (PDF or image), and optional notes.
- **US-7:** As a user, I can mark an estimate as "Active," "Revised," or "Declined" to track which quote I accepted.
- **US-8:** As a user, I can view the outstanding balance for an estimate (estimate total minus sum of linked receipt/invoice totals).

### 2.3 Receipts / Invoices

- **US-9:** As a user, I can add a receipt or invoice to any vendor.
- **US-10:** Each receipt has: date, subtotal, HST amount, total (CAD), an optional attached document (PDF or image), optional notes, and optional tags (freeform, searchable).
- **US-11:** For Contract vendors, I can **optionally link** a receipt to a specific estimate (e.g., "Deposit — 30% of Estimate 001"). A receipt may also be unlinked (e.g., additional materials not covered by the original estimate).
- **US-12:** As a user, I can mark a receipt/invoice with a payment type label: "Deposit," "Progress Payment," "Final Payment," or "Additional" (freeform is also acceptable).
- **US-13:** For Retail vendors, receipts are standalone — no estimate linkage. Tags and notes serve as the primary organizational mechanism.

### 2.4 AI-Assisted Data Entry (Mobile)

- **US-14:** As a user on mobile, I can photograph a receipt or invoice and the app will extract: vendor name (suggested, not auto-created), date, subtotal, HST amount, and total.
- **US-15:** Extracted data pre-fills a form that I review and confirm before saving. The AI never auto-saves.
- **US-16:** The original image is always stored as the attached document, regardless of extraction success.

### 2.5 Dashboard & Summary Views

#### Date Range Filter
- **US-17:** As a user, I can filter the dashboard by a preset date range: **Last 7 days, Last 30 days, Last 3 months, Last 6 months, All time.**
- The date range applies to **receipt/invoice activity** (payments made within that window). Estimate totals are always shown in full (unfiltered) since they represent total project commitments regardless of when they were created.

#### Top-Level Summary Cards
- **US-18:** As a user, I can see the following project-level KPIs at a glance:

| Metric | Description | Filtered by date range? |
|---|---|---|
| **Total Estimated** | Sum of all active estimates across all Contract vendors | No (always full project) |
| **Total Paid** | Sum of all receipt/invoice totals | Yes |
| **Total Outstanding** | Total Estimated − Total Paid (Contract vendors only) | No (always current) |
| **Total HST / Tax Paid** | Sum of all receipt tax_total (gst_amount + pst_amount). Expandable to show GST vs. provincial breakdown. | Yes |
| **# of Vendors** | Count of active (non-archived) vendors | No |
| **# of Receipts / Invoices** | Count of receipts in the selected period | Yes |

#### Per-Vendor Summary Table
- **US-19:** Below the summary cards, I can see a **vendor table** showing per-vendor: estimated total, paid total (within date range), outstanding balance, and HST paid (within date range). Sortable by any column.
- **US-20:** For Contract vendors, I can drill into an estimate and see all linked receipts and the remaining balance.

#### Recent Activity Feed
- **US-21:** As a user, I can see a chronological list of the most recent receipts/invoices added (within the date range), showing vendor name, date, total, and payment type — so I can quickly see what's been logged recently.

#### Export
- **US-22:** As a user, I can export a summary report as CSV (all vendors, or filtered by vendor and date range).

#### Future (v2) — Not in Scope
- Cost breakdown by tag (e.g., total spent on "plumbing" vs. "electrical")
- Cost breakdown by vendor type (Contract vs. Retail)
- Charts / visualizations (bar chart of monthly spend, pie chart by vendor)
- Budget vs. actual variance tracking

### 2.7 Vendor Detail Page (CRM View)

Each vendor has a dedicated detail page that serves as the single source of truth for that relationship. The layout adapts based on vendor type.

#### Common Header (Both Types)

- **US-25:** The top of every vendor page shows: vendor name, display_id (e.g., VEN-0001), type badge ("Contract" or "Retail"), and archive status.
- **US-26:** Below the header, a **contact card** displays: contact name, phone (click-to-call on mobile), email (click-to-email), website (click-to-open), address, and general notes. All fields are inline-editable.
- **US-27:** A **vendor financial summary bar** shows: total estimated (Contract only), total paid, outstanding balance (Contract only), total HST paid.

#### Contract Vendor Layout

For vendors like a framing company, roofer, or designer — the page is organized around estimates and their linked invoices.

- **US-28:** An **Estimates section** lists all estimates as expandable rows in a table:

  | Column | Example |
  |---|---|
  | Display ID | EST-0012 |
  | Vendor Ref | Quote #Q-445 |
  | Title | Kitchen Design - Phase 1 |
  | Date | 2026-02-15 |
  | Estimated Total | $14,500.00 |
  | Paid to Date | $4,350.00 |
  | Outstanding | $10,150.00 |
  | Status | Active |

- **US-29:** Expanding an estimate row reveals its **linked receipts/invoices** nested beneath it:

  | Column | Example |
  |---|---|
  | Display ID | REC-0047 |
  | Vendor Ref | INV-2026-0381 |
  | Date | 2026-03-01 |
  | Payment Type | Deposit |
  | Total | $4,350.00 |
  | HST | $500.00 |
  | Notes | 30% deposit |

- **US-30:** An **Unlinked Receipts section** below the estimates table shows any receipts for this vendor that are not associated with an estimate (e.g., additional materials, ad-hoc charges).

- **US-31:** A **Documents section** shows all documents attached to this vendor (across all estimates and receipts), with display name, type icon (PDF/image), vendor ref, and upload date. Clicking opens a preview or download.

#### Retail Vendor Layout

For vendors like Home Depot or Lowe's — there are no estimates, so the page is a simple chronological receipt log.

- **US-32:** A **Receipts table** lists all receipts in reverse chronological order:

  | Column | Example |
  |---|---|
  | Display ID | REC-0052 |
  | Vendor Ref | HOMEDEPOT-20260316-143022 |
  | Date | 2026-03-16 |
  | Total | $287.43 |
  | HST | $33.08 |
  | Tags | plumbing, basement |
  | Notes | PEX fittings + shutoff valves |

- **US-33:** Tags are prominently displayed and clickable — clicking a tag filters the receipt list to that tag.
- **US-34:** A **Documents section** identical to the Contract layout.

#### Shared Behaviors

- **US-35:** From any vendor page, the user can add a new estimate (Contract only), add a new receipt, or attach a new document via action buttons.
- **US-36:** All tables on the vendor page are sortable by any column and filterable by date range.
- **US-37:** The vendor page URL includes the display_id for easy bookmarking and sharing (e.g., `/vendors/VEN-0001`).

### 2.9 Capture Inbox & Smart Recommendations

Mobile captures land in a triage inbox on the web/iPad app. The inbox helps the user quickly associate, tag, and enrich receipts that were captured in the field with minimal data.

#### Inbox Basics
- **US-40:** Receipts captured on mobile are saved with a status of `inbox` and appear in a dedicated "Inbox" section on the web/iPad dashboard.
- **US-41:** The inbox shows a count badge in the main navigation (e.g., "Inbox (3)") so the user knows there are unprocessed captures waiting.
- **US-42:** Each inbox item shows: thumbnail of the captured image, AI-extracted vendor name, date, total, HST, and the auto-assigned display_id. Essentially a preview card of what was captured.

#### Smart Recommendations
- **US-43:** For each inbox item, the system suggests a **vendor match** based on the AI-extracted vendor name, using fuzzy matching against existing vendors. Example: OCR extracts "HOME DEPOT #3029" → system recommends "Home Depot (VEN-0001)."
- **US-44:** If the matched vendor is a Contract type, the system also suggests a **likely estimate** to link to, based on: the most recent active estimate for that vendor, or the estimate with the largest outstanding balance.
- **US-45:** The system suggests **tags** based on: tags previously used with this vendor (e.g., if every Home Depot receipt has been tagged "lumber" or "plumbing," those are offered as chips), and keywords in the OCR-extracted text or user notes (e.g., "PEX" → suggest "plumbing").
- **US-46:** Suggestions are presented as one-click accept actions — the user taps a chip to confirm each suggestion, or overrides manually.

#### Processing Flow
- **US-47:** The user processes an inbox item by: confirming or changing the vendor, optionally linking to an estimate, adding payment type / tags / notes, and clicking "Confirm." The receipt status changes from `inbox` to `confirmed` and it appears on the vendor's detail page.
- **US-48:** The user can also process an inbox item inline (without opening a full edit form) — just confirm the vendor suggestion and click "Quick confirm" to move it out of the inbox with the AI-extracted data as-is. Detailed enrichment can be done later from the vendor page.
- **US-49:** The inbox is sorted by capture date (newest first) and can be filtered by suggested vendor.

#### Data Model Addition

A `status` column is added to the `receipts` table:

| Column | Type | Notes |
|---|---|---|
| status | text | "inbox" (mobile capture, unprocessed), "confirmed" (processed and associated). Default: "confirmed" for web-created receipts, "inbox" for mobile captures. |

> **Note:** "Inbox" receipts are excluded from dashboard totals and vendor financial summaries until confirmed. This prevents half-entered mobile captures from skewing the numbers. Once confirmed, they're counted like any other receipt.

### 2.10 Search & Navigation

- **US-50:** As a user, I can search across all vendors, estimates, receipts, notes, and tags from a single search bar.
- **US-51:** As a user, I can filter receipts by date range, vendor, and tag.

---

## 3. Data Model

### 3.1 Entity Relationship

```
Project
 ├── project_members (User ↔ Project join)
 │
 └── Vendor
      ├── type: "contract" | "retail"
      ├── name, contact info, notes, tags[]
      │
      ├── Estimate (only if type = "contract")
      │    ├── title, date, estimated_total, status
      │    ├── vendor_ref, notes, tags[]
      │    └── Document (attached file)
      │
      └── Receipt
           ├── date, subtotal, hst_amount, total
           ├── vendor_ref, payment_type, status (inbox/confirmed)
           ├── notes, tags[]
           ├── estimate_id (nullable FK → Estimate)
           ├── created_by (FK → auth.users — who captured it)
           └── Document (attached file)
```

All data is scoped to a **project**, not a user. Both users are members of the same project and see identical data. The `created_by` field on receipts tracks who captured the record (useful for inbox — "Mike captured 3 receipts today").

### 3.2 Key Tables (Supabase / PostgreSQL)

#### ID Strategy — Three Layers

Every estimate, receipt, and document has up to **three identifiers** serving different purposes:

| Layer | Column | Purpose | Example |
|---|---|---|---|
| **Internal ID** | `id` (uuid) | Primary key for joins, FKs, and API calls. Never shown to users. | `a3f7b2c1-8e4d-...` |
| **Internal display ID** | `display_id` | Fox Valley's own human-readable tracking number. Auto-generated, always present, globally unique. Used in the UI, search results, and when referring to records internally. | `REC-0047`, `EST-0012` |
| **Vendor reference** | `vendor_ref` | The vendor's own invoice/estimate/document number, exactly as printed on their paperwork. Used for cross-referencing with the vendor ("I'm calling about your invoice INV-2026-0381"). | `INV-2026-0381`, `Quote #Q-445` |

**`display_id` generation:** Auto-incrementing per entity type via PostgreSQL sequences, formatted with a prefix:

| Entity | Format | Example |
|---|---|---|
| Vendor | `VEN-XXXX` | VEN-0001 |
| Estimate | `EST-XXXX` | EST-0012 |
| Receipt | `REC-XXXX` | REC-0047 |
| Document | `DOC-XXXX` | DOC-0103 |

Implementation: one sequence per prefix, assigned via a trigger on insert. The `display_id` is a unique, indexed text column.

**`vendor_ref` rules:**
- For **Contract vendors** (estimates and invoices): user enters the vendor's own reference number. This is the number printed on the vendor's estimate or invoice. Required for estimates, strongly encouraged for receipts.
- For **Retail vendors** (receipts): typically no meaningful vendor reference exists. The system auto-generates a fallback in the format `{VENDOR_SHORT_NAME}-{YYYYMMDD}-{HHMMSS}` (e.g., `HOMEDEPOT-20260316-143022`). User can override if the receipt has a transaction number they want to record.
- `vendor_ref` is **not unique** globally (two vendors could both have "INV-001"), but should be **unique within a vendor** (enforced via a compound unique index on `vendor_id + vendor_ref`).
- Included in the `search_vector` so users can search by vendor reference number.

**UI display:** The primary identifier shown in lists and search results is `display_id`. The `vendor_ref` appears as a secondary label (e.g., "REC-0047 · Vendor ref: INV-2026-0381").

---

**vendors**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default: `gen_random_uuid()` |
| display_id | text (unique) | Auto-generated, e.g., "VEN-0001" |
| user_id | uuid (FK → auth.users) | |
| name | text | Required |
| type | text | "contract" or "retail" |
| email | text | Optional |
| phone | text | Optional |
| address | text | Optional |
| notes | text | Optional |
| tags | text[] | Searchable freeform tags |
| is_archived | boolean | Default false |
| search_vector | tsvector | Auto-generated (see Search section) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**estimates**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default: `gen_random_uuid()` |
| display_id | text (unique) | Auto-generated, e.g., "EST-0012" |
| vendor_id | uuid (FK → vendors) | |
| vendor_ref | text | Vendor's own estimate/quote number, e.g., "Quote #Q-445" |
| title | text | e.g., "Kitchen Design - Phase 1" |
| date | date | |
| estimated_total | numeric(12,2) | CAD |
| status | text | "active", "revised", "declined" |
| notes | text | Optional |
| tags | text[] | Searchable freeform tags |
| search_vector | tsvector | Auto-generated |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Unique constraint:** `UNIQUE(vendor_id, vendor_ref)` — a vendor can't have two estimates with the same reference.

**receipts**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default: `gen_random_uuid()` |
| display_id | text (unique) | Auto-generated, e.g., "REC-0047" |
| vendor_id | uuid (FK → vendors) | |
| estimate_id | uuid (FK → estimates) | Nullable. Only for contract vendors. |
| vendor_ref | text | Vendor's invoice number or auto-generated fallback for retail |
| date | date | |
| subtotal | numeric(12,2) | Pre-tax amount |
| gst_amount | numeric(12,2) | Federal GST portion (5%). For Ontario HST vendors, this is the federal portion of the 13% HST. |
| pst_amount | numeric(12,2) | Provincial tax portion. For Ontario: 8% (provincial HST). For Quebec: 9.975% (QST). |
| tax_total | numeric(12,2) | gst_amount + pst_amount. Equals the full HST amount for Ontario vendors. |
| total | numeric(12,2) | Final paid amount (subtotal + tax_total) |
| payment_type | text | "deposit", "progress", "final", "additional", or freeform |
| status | text | "inbox" (mobile capture, pending review) or "confirmed" (processed). Default: "confirmed" for web-created, "inbox" for mobile captures. |
| created_by | uuid (FK → auth.users) | Who captured/created this receipt. Used in inbox to show "Mike added 3 receipts." |
| notes | text | Optional |
| tags | text[] | Searchable freeform tags |
| search_vector | tsvector | Auto-generated |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Unique constraint:** `UNIQUE(vendor_id, vendor_ref)` — prevents duplicate invoice numbers within the same vendor.

**documents**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Default: `gen_random_uuid()` |
| display_id | text (unique) | Auto-generated, e.g., "DOC-0103" |
| vendor_id | uuid (FK → vendors) | Required — every doc belongs to a vendor |
| estimate_id | uuid (FK → estimates) | Nullable |
| receipt_id | uuid (FK → receipts) | Nullable |
| vendor_ref | text | Nullable. Vendor's own document number if applicable (e.g., a contract number) |
| display_name | text | User-editable label, e.g., "Revised kitchen quote - March 2026" |
| original_file_name | text | Original upload filename, e.g., "IMG_4392.jpg" |
| storage_path | text | Path in Supabase Storage bucket |
| file_type | text | MIME type: "application/pdf", "image/jpeg", etc. |
| file_size_bytes | integer | |
| notes | text | Optional — e.g., "page 2 has the HST breakdown" |
| tags | text[] | Searchable freeform tags |
| search_vector | tsvector | Auto-generated |
| created_at | timestamptz | |

> **Document ownership rule:** A document always belongs to a vendor (required `vendor_id`). It may *optionally* also be linked to a specific estimate or receipt. This means you can attach a general document to a vendor (e.g., a contract or warranty) without forcing it onto a specific estimate or receipt.

---

### 3.3 Search Strategy (PostgreSQL Full-Text Search)

Each table has a `search_vector` column of type `tsvector`, maintained automatically via a PostgreSQL trigger that fires on INSERT and UPDATE.

**What feeds each search vector:**

| Table | Fields indexed in search_vector |
|---|---|
| vendors | name, contact_name, contact_email, notes, tags, display_id |
| estimates | title, vendor_ref, notes, tags, display_id |
| receipts | vendor_ref, notes, tags, payment_type, display_id |
| documents | display_name, vendor_ref, original_file_name, notes, tags, display_id |

**Unified search** is implemented as a PostgreSQL view or function that unions search results across all four tables, ranked by relevance:

```sql
-- Example: unified search function
CREATE OR REPLACE FUNCTION search_all(query text, p_user_id uuid)
RETURNS TABLE (
  entity_type text,
  entity_id uuid,
  display_id text,
  headline text,
  rank real
) AS $
  SELECT 'vendor', id, display_id,
    ts_headline('english', name || ' ' || coalesce(notes,''), plainto_tsquery(query)),
    ts_rank(search_vector, plainto_tsquery(query))
  FROM vendors
  WHERE user_id = p_user_id AND search_vector @@ plainto_tsquery(query)

  UNION ALL

  SELECT 'estimate', e.id, e.display_id,
    ts_headline('english', e.title || ' ' || coalesce(e.notes,''), plainto_tsquery(query)),
    ts_rank(e.search_vector, plainto_tsquery(query))
  FROM estimates e
  JOIN vendors v ON e.vendor_id = v.id
  WHERE v.user_id = p_user_id AND e.search_vector @@ plainto_tsquery(query)

  UNION ALL

  SELECT 'receipt', r.id, r.display_id,
    ts_headline('english', coalesce(r.notes,'') || ' ' || coalesce(r.payment_type,''), plainto_tsquery(query)),
    ts_rank(r.search_vector, plainto_tsquery(query))
  FROM receipts r
  JOIN vendors v ON r.vendor_id = v.id
  WHERE v.user_id = p_user_id AND r.search_vector @@ plainto_tsquery(query)

  UNION ALL

  SELECT 'document', d.id, d.display_id,
    ts_headline('english', coalesce(d.display_name,'') || ' ' || coalesce(d.notes,''), plainto_tsquery(query)),
    ts_rank(d.search_vector, plainto_tsquery(query))
  FROM documents d
  JOIN vendors v ON d.vendor_id = v.id
  WHERE v.user_id = p_user_id AND d.search_vector @@ plainto_tsquery(query)

  ORDER BY rank DESC
  LIMIT 50;
$ LANGUAGE sql STABLE;
```

**Indexes:**
```sql
CREATE INDEX idx_vendors_search ON vendors USING GIN (search_vector);
CREATE INDEX idx_estimates_search ON estimates USING GIN (search_vector);
CREATE INDEX idx_receipts_search ON receipts USING GIN (search_vector);
CREATE INDEX idx_documents_search ON documents USING GIN (search_vector);
```

> **Note:** At 2 users and a few hundred rows, full-text search is technically overkill — a simple `ILIKE` on concatenated fields would work fine. But `tsvector` is essentially free to set up in PostgreSQL and will handle ranking, stemming (e.g., "plumb" matches "plumbing"), and multi-field search cleanly from day one. It also means the search bar works identically across web and mobile with a single RPC call.

### 3.5 Tax Handling (Ontario HST + Quebec GST/QST)

Since some vendors are based in Quebec, the app must handle two different Canadian tax regimes:

| | Ontario | Quebec |
|---|---|---|
| **Tax type** | HST (harmonized) | GST + QST (separate) |
| **Federal rate** | 5% (bundled into 13% HST) | 5% GST |
| **Provincial rate** | 8% (bundled into 13% HST) | 9.975% QST |
| **Total rate** | 13% | 14.975% |
| **How it appears on invoices** | Single "HST" line | Two separate lines: "GST" and "QST" |

**How this works in the app:**

- Each vendor has a `tax_province` field ("ON" or "QC"), set when the vendor is created.
- Each receipt stores `gst_amount` (federal) and `pst_amount` (provincial) separately.
- For Ontario vendors: the receipt form labels these as "HST (federal portion)" and "HST (provincial portion)," or the user can enter a single HST amount and the app splits it (5/13 federal, 8/13 provincial).
- For Quebec vendors: the receipt form labels these as "GST" and "QST."
- `tax_total` = `gst_amount` + `pst_amount` regardless of province.
- Dashboard summaries show: **Total GST paid** (federal — relevant for GST191 rebate filing) and **Total provincial tax paid** (Ontario HST provincial + Quebec QST), plus combined total tax.

**Why this matters for the HST rebate:**
The GST/HST New Housing Rebate (Form GST191) requires you to report the federal GST portion separately from the provincial portion. By splitting the tax at the receipt level, the CSV export can directly provide the numbers needed for the rebate filing — no manual recalculation needed.

### 3.6 CSV Export — GST191-Friendly Format

The CSV export should produce a format that maps directly to the HST New Housing Rebate filing requirements:

```
display_id, vendor_name, vendor_ref, date, subtotal, gst_amount, pst_amount, tax_total, total, payment_type, tags, notes
REC-0047, "Elyse McCurdy Home Design", INV-2026-0381, 2026-03-01, 3850.00, 192.50, 308.00, 500.50, 4350.50, Deposit, "design,kitchen", "30% deposit"
REC-0052, "Home Depot", HD-20260316-143022, 2026-03-16, 254.35, 12.72, 20.36, 33.08, 287.43, , "plumbing,basement", "PEX fittings"
```

The export should also include a **summary row** at the bottom with totals: total subtotal, total GST, total provincial tax, total tax, total paid. Filterable by vendor, date range, and tags.

### 3.7 Computed Values (not stored, derived in queries or views)

- **Vendor estimated total** = SUM(estimates.estimated_total) WHERE status = 'active' AND vendor_id = X
- **Vendor paid total** = SUM(receipts.total) WHERE vendor_id = X AND status = 'confirmed'
- **Vendor GST total** = SUM(receipts.gst_amount) WHERE vendor_id = X AND status = 'confirmed'
- **Vendor provincial tax total** = SUM(receipts.pst_amount) WHERE vendor_id = X AND status = 'confirmed'
- **Vendor tax total** = Vendor GST total + Vendor provincial tax total
- **Vendor outstanding** = Vendor estimated total − Vendor paid total
- **Estimate outstanding** = estimate.estimated_total − SUM(receipts.total WHERE estimate_id = Y AND status = 'confirmed')
- **Project totals** = aggregation of all vendor totals (confirmed receipts only)
- **Project GST total** = SUM across all vendors (the number for your GST191 filing)

> **Note:** For Retail vendors, "outstanding" is not meaningful (no estimate to compare against). The dashboard should show estimated vs. paid only for Contract vendors, and just total spent for Retail vendors.

---

## 4. Architecture & Tech Stack

### 4.1 Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Web frontend** | React (Vite) + Tailwind CSS + shadcn/ui | Fast to build, good component library, responsive |
| **Mobile app** | Expo (React Native) + NativeWind (Tailwind) | Shared JS/TS codebase with web; camera access for OCR |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) | All-in-one BaaS; free tier sufficient for 2 users |
| **Auth** | Supabase Auth — magic link (email) | Simplest auth flow; no passwords to manage |
| **File storage** | Supabase Storage | Private bucket for PDFs and images |
| **AI / OCR** | Supabase Edge Function → Claude API (Anthropic) | Send receipt image, receive structured JSON; ~97% accuracy on text receipts |

### 4.2 Architecture Diagram

```
┌─────────────┐     ┌─────────────┐
│   Web App   │     │ Mobile App  │
│  (React)    │     │  (Expo)     │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │    Supabase SDK   │
       ▼                   ▼
┌──────────────────────────────────┐
│         Supabase Platform        │
│                                  │
│  ┌────────┐  ┌────────────────┐  │
│  │  Auth  │  │   PostgreSQL   │  │
│  │(magic  │  │   (vendors,    │  │
│  │ link)  │  │   estimates,   │  │
│  └────────┘  │   receipts,    │  │
│              │   documents)   │  │
│  ┌────────┐  └────────────────┘  │
│  │Storage │                      │
│  │(PDFs,  │  ┌────────────────┐  │
│  │images) │  │ Edge Function  │  │
│  └────────┘  │ (OCR: sends    │  │
│              │  image → Claude │  │
│              │  API, returns  │  │
│              │  structured    │  │
│              │  JSON)         │  │
│              └────────────────┘  │
└──────────────────────────────────┘
                    │
                    ▼
           ┌────────────────┐
           │  Claude API    │
           │  (Anthropic)   │
           └────────────────┘
```

### 4.3 OCR Edge Function Design

The Edge Function receives an image (base64 or Supabase Storage URL), sends it to the Claude API with a structured extraction prompt, and returns JSON.

**Prompt template (simplified):**
```
You are a receipt/invoice data extractor for Canadian documents.
Extract the following fields from the attached image and return
valid JSON only:

{
  "vendor_name": string | null,
  "date": "YYYY-MM-DD" | null,
  "subtotal": number | null,
  "gst_amount": number | null,
  "pst_amount": number | null,
  "tax_total": number | null,
  "total": number | null,
  "vendor_ref": string | null,
  "tax_province": "ON" | "QC" | null,
  "confidence": "high" | "medium" | "low"
}

Rules:
- Determine the tax province from the receipt.
- If you see a single "HST" line, the province is "ON".
  Split HST into federal (5/13) and provincial (8/13).
  gst_amount = HST × 5/13, pst_amount = HST × 8/13.
- If you see separate "GST" and "QST" lines, the province is "QC".
  gst_amount = GST amount, pst_amount = QST amount.
- vendor_ref is the invoice number, receipt number, or transaction
  number printed on the document.
- If a field is not visible or legible, return null.
- Do not guess. Return null for uncertain values.
```

**Cost estimate:** At ~$0.01–0.02 per receipt image via Claude Sonnet, processing 500 receipts would cost approximately $5–10 total. Negligible for personal use.

---

## 5. Platform-Specific Scope

### 5.1 Web / iPad App (Full Management Interface)

The web app (and iPad via responsive browser) is the primary management interface where all detailed work happens:

- Vendor CRUD (create, edit, archive, search)
- Vendor detail / CRM page (contact card, financial summary, estimate ↔ receipt tables)
- Estimate CRUD (add, edit, change status, attach document, view linked receipts)
- Receipt CRUD (add, edit, link/unlink to estimate, attach document)
- All three receipt-add flows (from estimate row, general + new, retail quick-add)
- Document management (upload, rename, tag, attach to vendor/estimate/receipt)
- Manual data entry for all fields (including HST)
- Dashboard with date range filter, project + per-vendor summaries
- Search and filter across all entities
- CSV export

### 5.2 Mobile App — Phone (Quick Capture + Lookup Only)

The mobile phone app is intentionally minimal — optimized for two jobs:

**Job 1: Quick capture (get the receipt into the system fast)**
1. Open app → tap "Capture receipt"
2. Select or search for a vendor (or create a new one — name + type only)
3. Take photo of receipt / invoice (camera) or pick from gallery
4. AI extracts: vendor name suggestion, date, subtotal, HST, total, vendor ref
5. User reviews pre-filled form, corrects if needed, adds optional notes
6. Save — receipt + image are stored immediately
7. Detailed editing (linking to estimate, adding tags, payment type) is deferred to web/iPad

**Job 2: Quick lookup (answer a question on the spot)**
- Search by vendor name, display ID, vendor ref, or tag
- View vendor detail page (read-only: contact info, financial summary, receipt list)
- View a specific receipt or estimate detail (read-only)
- Open / preview attached documents

**Not on mobile phone (by design):**
- Dashboard / summary views
- Estimate creation or management
- Receipt-to-estimate linking
- Document renaming, tagging, or management
- CSV export
- Vendor editing beyond name + type
- Bulk operations

> **Design rationale:** The phone app's capture flow intentionally collects the minimum viable data — vendor, amounts, photo. Everything else (tags, payment type, estimate linking, notes) can be added later from the web/iPad where you have a proper screen and keyboard. This keeps the "standing at the Home Depot checkout" flow under 30 seconds.

---

## 6. Auth & Security

- **Auth method:** Supabase magic link (passwordless email login)
- **User provisioning:** Manual — create 2 user accounts in Supabase dashboard, create 1 project, add both users as project members via SQL. No public sign-up, no invite flow.
- **Row Level Security (RLS):** All tables enforce project membership. The pattern:
  ```sql
  -- Example RLS policy for vendors (same pattern for all tables)
  CREATE POLICY "Users can access vendors in their projects"
    ON vendors FOR ALL
    USING (
      project_id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.uid()
      )
    );
  ```
  This means both users see all data for their shared project. There is no per-user data isolation within a project.
- **Storage:** Private bucket with RLS. Signed URLs for document access (short-lived, e.g., 60 min expiry). Storage path convention: `{project_id}/{entity_type}/{entity_id}/{filename}`.
- **API keys:** Claude API key stored as a Supabase secret (environment variable on Edge Functions), never exposed to client.

---

## 7. Open Questions & Decisions — All Resolved

| # | Question | Decision |
|---|---|---|
| 1 | **Should the two users share the same data?** | **Yes.** Project model added — `projects` table, `project_members` join table, `project_id` on vendors, RLS policies use project membership. |
| 2 | **Inline PDF/image preview, or download?** | **Inline image preview; PDF opens in new tab / system viewer.** No custom PDF renderer needed. |
| 3 | **Tags: freeform arrays or managed tag table?** | **Freeform `text[]` with autocomplete from existing tags.** Normalize to lowercase on save to prevent duplicates like "Kitchen" vs "kitchen." |
| 4 | **HST rate: hardcode or configurable?** | **Default 13% (Ontario), override per receipt.** Don't auto-calculate — trust the receipt. The HST field is always manually entered or OCR-extracted, never computed. |
| 5 | **Estimate revisions: separate records or edit in place?** | **Separate records.** Mark the old estimate as "Revised," create a new one as "Active." Preserves history and keeps the data model simple. |
| 6 | **Monorepo for shared web + mobile code?** | **Yes — Turborepo or Nx.** Shared `/packages/types` (TypeScript interfaces) and `/packages/supabase` (client init + query functions). UI components are NOT shared — web uses React + shadcn, mobile uses Expo + NativeWind. |
| 7 | **OCR failure handling?** | **Always show the form.** Pre-fill whatever was extracted (even if partial/empty). Show a yellow "low confidence" badge when confidence is below threshold. Never block the capture flow — OCR failure just means manual entry. |
| 8 | **Supabase plan?** | **Start on Free.** Upgrade to Pro ($25/mo) when auto-pausing becomes a problem or storage approaches 1 GB. Risk accepted and documented in G-11. |

---

## 8. PRD Review — Identified Gaps & Risks

The following gaps were identified during a full review of this document. Items marked **[Must Fix]** should be resolved before development begins. Items marked **[Should Address]** should be resolved during M1–M2. Items marked **[Nice to Have]** can wait for later milestones.

### Data Model Gaps

| # | Gap | Severity | Recommendation |
|---|---|---|---|
| G-1 | ~~**Shared data access is unresolved.**~~ **RESOLVED.** Project model added — `projects` table, `project_members` join table, `project_id` on vendors, RLS policies use project membership. | ~~**[Must Fix]**~~ Done | Implemented in schema v1.0. |
| G-2 | **No `updated_at` trigger.** The schema shows `updated_at` columns but doesn't specify how they're maintained. | **[Should Address]** | Add a Postgres trigger: `CREATE OR REPLACE FUNCTION update_updated_at() ... NEW.updated_at = now(); ...` applied to all tables. |
| G-3 | **Soft delete on vendors but not on estimates or receipts.** Vendors have `is_archived` but estimates and receipts don't. What happens when a user wants to undo a receipt entry? | **[Should Address]** | Add `is_archived boolean DEFAULT false` to estimates and receipts. Archived records are hidden from default views but retained in the DB. Dashboard computed values should exclude archived records. |
| G-4 | **No audit trail / edit history.** If a receipt total is edited after initial entry, there's no record of the change. For a personal finance tracker this is low risk, but worth noting. | **[Nice to Have]** | Consider a simple `audit_log` table (entity_type, entity_id, field_changed, old_value, new_value, changed_at, changed_by) for v2. |
| G-5 | **Documents table allows both `estimate_id` and `receipt_id` to be null, or both to be set.** No constraint enforces that a document is linked to at most one parent (beyond the vendor). | **[Should Address]** | Add a check constraint: `CHECK (NOT (estimate_id IS NOT NULL AND receipt_id IS NOT NULL))` — a document can be linked to a vendor alone, a vendor + estimate, or a vendor + receipt, but not both an estimate and a receipt simultaneously. |

### UX / Feature Gaps

| # | Gap | Severity | Recommendation |
|---|---|---|---|
| G-6 | **No "undo" or "move to inbox" for confirmed receipts.** If a user confirms an inbox item too quickly with wrong data, there's no way to send it back to inbox. | **[Should Address]** | Allow status to be changed back from "confirmed" to "inbox" via an "Edit / Re-process" action on the receipt detail page. |
| G-7 | **Receipt-to-estimate linking is one-way.** A receipt can be linked to one estimate, but there's no UI described for *re-linking* a receipt to a different estimate if it was associated incorrectly. | **[Should Address]** | Add an "unlink / re-link" action on the receipt detail view. The mockup for Flow 1 already shows an "unlink" option — make sure the reverse (linking an unlinked receipt to an estimate) is equally easy. |
| G-8 | **No way to merge duplicate vendors.** OCR might create "Home Depot" and "HOME DEPOT" as separate vendors from inbox quick-confirm. | **[Nice to Have]** | v2 feature: vendor merge tool that reassigns all estimates, receipts, and documents from vendor A to vendor B, then archives vendor A. |
| G-9 | **Mobile capture doesn't pre-select vendor.** If the user is already on a vendor's detail page (lookup flow) and wants to capture a receipt for that vendor, they should be able to start the capture with the vendor pre-selected. | **[Should Address]** | Add a "Capture receipt" button on the mobile vendor detail view that pre-fills the vendor in the capture flow. |
| G-10 | **No batch operations.** If the user has 10 inbox items from the same Home Depot run, they have to process them one by one. | **[Nice to Have]** | v2: batch confirm — select multiple inbox items, assign same vendor + tags, confirm all at once. |

### Infrastructure / Operational Gaps

| # | Gap | Severity | Recommendation |
|---|---|---|---|
| G-11 | **Supabase free tier will auto-pause.** Free projects pause after 7 days of inactivity. During a home build there may be weeks with no app activity (e.g., waiting on permits). A paused project means the mobile capture flow fails silently. | **[Risk Accepted]** | Starting on free per user decision. Mitigations: (1) set a calendar reminder to open the app weekly, (2) upgrade to Pro ($25/mo) at first sign of pausing issues or when file storage approaches 1 GB. |
| G-12 | **No backup or export strategy beyond CSV.** If Supabase goes down or the project is accidentally deleted, all data is lost. | **[Should Address]** | Pro plan includes daily backups. Additionally, implement a periodic full-data JSON export (all tables + storage manifest) that can be downloaded manually. This is also useful for portability. |
| G-13 | **File storage limits not specified.** No maximum file size per upload is defined. A user could upload a 40 MB PDF scan and hit the 50 MB per-file limit on the free tier. | **[Should Address]** | Set Supabase Storage bucket limit to 10 MB per file. Receipt photos should be compressed client-side before upload (resize to max 2000px wide, JPEG quality 80%). PDFs are passed through as-is. |
| G-14 | **OCR Edge Function error handling is underspecified.** What happens if the Claude API is down, rate-limited, or returns malformed JSON? | **[Should Address]** | Edge Function should: retry once after 2s, then return a "manual entry" fallback response with all fields null and confidence "failed." The mobile app always shows the form regardless — OCR failure just means the user types everything manually. Never block the capture flow. |
| G-15 | **No monitoring or alerting.** If the Edge Function starts failing or the DB fills up, nobody knows. | **[Nice to Have]** | Supabase dashboard has basic monitoring. For v1, check it manually once a week. For v2, add Sentry to the Edge Function and a weekly Supabase health check. |
| G-16 | **Claude API key rotation / cost tracking.** The PRD specifies storing the API key as a Supabase secret but doesn't address rotation or cost monitoring. | **[Nice to Have]** | Set a monthly spend cap on the Anthropic account ($10/mo is more than enough). Review usage monthly via the Anthropic dashboard. |

---

## 9. Out of Scope (v1)

- Multi-project support (this is a single residential build)
- Budget planning / cost estimation engine
- Payment processing or invoicing (this is tracking, not billing)
- Multi-currency (CAD only)
- Notifications or reminders (e.g., "vendor X has an outstanding balance over 30 days")
- Collaboration features beyond shared data access (no comments, no @mentions)
- Receipt OCR from the web app (web = manual entry + file upload only; OCR is mobile-only)
- Offline mobile support (requires internet for Supabase + OCR)
- Vendor merge tool (v2 — see gap G-8)
- Batch inbox processing (v2 — see gap G-10)
- Cost breakdown by tag or charts/visualizations (v2 — see dashboard section)
- Audit trail / edit history (v2 — see gap G-4)

---

## 10. Success Criteria

Given the personal-use nature, success is simple:

1. Both users can create vendors, attach estimates and receipts, and view summaries within 1 week of launch.
2. Mobile receipt capture (photo → extracted data → saved to inbox) takes under 30 seconds per receipt.
3. Processing an inbox item (confirm vendor match, link estimate, add tags) takes under 20 seconds per item on web/iPad.
4. At any point during the build, the user can answer: "How much did Vendor X quote me, how much have I paid them, and what do I still owe?" in under 10 seconds.
5. At tax time, the user can pull total HST paid across all vendors in one click.

---

## 11. Milestones (Suggested)

| Phase | Scope | Est. Effort |
|---|---|---|
| **M0: Decisions** | Resolve [Must Fix] items: shared data model (OQ #1), Supabase plan (OQ #8). Finalize schema. | 1–2 days |
| **M1: Foundation** | Supabase setup (DB schema, migrations, RLS, auth, storage bucket, `pg_trgm` extension). Web app scaffold with vendor CRUD and contact card. | 1 week |
| **M2: Core Web** | Estimate + Receipt CRUD, document upload, estimate ↔ receipt linking. Contract + Retail vendor detail pages with expandable tables. Receipt add flows (all 3 variants). | 1–2 weeks |
| **M3: Dashboard + Inbox** | Project summary dashboard with date range filter. Per-vendor summary table. Inbox view with smart recommendations (fuzzy vendor match, tag suggestions). Inbox processing flow. CSV export. | 1–2 weeks |
| **M4: Mobile MVP** | Expo app: auth (magic link), search, vendor lookup (read-only), receipt capture flow (camera → OCR Edge Function → confirm → save to inbox). | 1–2 weeks |
| **M5: Polish** | Edge cases, error handling (OCR failures, low confidence), inline image preview, tag autocomplete/normalization, soft delete on estimates/receipts, client-side image compression, UX refinements. | 1 week |

**Total estimated effort: 5–8 weeks** (solo developer, part-time)
