# Fox Valley Finance Tracker - Architecture

## System Overview

A full-stack application for tracking construction project finances with AI-powered receipt extraction.

---

## Directory Structure

```
fox-valley-finance/
├── apps/
│   ├── web/                          # React web application
│   │   ├── src/
│   │   │   ├── pages/               # Route-level pages
│   │   │   │   ├── dashboard.tsx    # Financial overview
│   │   │   │   ├── vendors.tsx      # Vendor list
│   │   │   │   ├── vendor-detail.tsx # Single vendor view
│   │   │   │   ├── inbox.tsx        # Receipt review queue
│   │   │   │   └── search.tsx       # Global search
│   │   │   ├── components/          # Reusable components
│   │   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   │   ├── vendor-form.tsx  # Create/edit vendor
│   │   │   │   ├── receipt-form.tsx # Create/edit receipt
│   │   │   │   ├── estimate-form.tsx # Create/edit estimate
│   │   │   │   ├── vendor-list.tsx  # Vendor display list
│   │   │   │   ├── date-range-filter.tsx
│   │   │   │   ├── tag-autocomplete.tsx
│   │   │   │   └── ...
│   │   │   ├── lib/                 # Utilities
│   │   │   │   └── supabase.ts      # All Supabase queries
│   │   │   ├── types/               # TypeScript types
│   │   │   │   └── index.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   └── mobile/                       # Expo React Native app
│       ├── src/
│       │   ├── screens/             # Screen components
│       │   │   ├── AuthScreen.tsx
│       │   │   ├── HomeScreen.tsx
│       │   │   ├── VendorDetailScreen.tsx
│       │   │   ├── ReceiptDetailScreen.tsx
│       │   │   ├── CaptureFlow/     # Camera/OCR screens
│       │   │   ├── InboxScreen.tsx
│       │   │   └── SearchScreen.tsx
│       │   ├── components/
│       │   ├── lib/
│       │   │   └── supabase.ts
│       │   ├── navigation/
│       │   ├── types/
│       │   └── hooks/
│       ├── App.tsx
│       ├── app.json
│       └── package.json
│
├── supabase/
│   ├── migrations/
│   │   └── 000001_initial_schema.sql  # Database schema
│   ├── functions/
│   │   └── ocr-extract/               # Edge Function
│   │       └── index.ts               # Claude OCR implementation
│   ├── policies.sql                   # RLS policies
│   ├── seed.sql                       # Sample data
│   └── config.toml                    # Supabase config
│
├── README.md
└── ARCHITECTURE.md                    # This file
```

---

## Data Flow

### 1. Receipt Capture Flow (Mobile)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  User takes │────▶│  Mobile app  │────▶│ Edge Function │────▶│   Claude    │
│    photo    │     │  encodes as  │     │  receives    │     │     API     │
└─────────────┘     │  base64      │     │  base64 img  │     └─────────────┘
                    └──────────────┘     └──────────────┘            │
                              │                                        │
                              │                                        ▼
                              │                               ┌─────────────┐
                              │                               │ Extracted   │
                              │                               │ data:       │
                              │                               │ - vendor    │
                              │                               │ - amounts   │
                              │                               │ - tax       │
                              │                               └─────────────┘
                              │                                        │
                              │                                        │
                              ▼                                        ▼
                    ┌──────────────┐                          ┌──────────────┐
                    │  Supabase    │◀─────────────────────────│  Edge Func   │
                    │  Storage     │   saves receipt image    │  returns     │
                    └──────────────┘                          │  JSON        │
                           │                                  └──────────────┘
                           │                                          │
                           ▼                                          ▼
                    ┌──────────────┐                          ┌──────────────┐
                    │  Receipt     │                          │  Pre-filled  │
                    │  document    │                          │  form in     │
                    │  saved with  │                          │  Inbox       │
                    │  status:     │                          │  for review  │
                    │  'inbox'     │                          └──────────────┘
                    └──────────────┘
```

### 2. Dashboard Data Flow (Web)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│   User      │────▶│   React      │────▶│  Supabase    │────▶│  PostgreSQL │
│   loads     │     │   useEffect  │     │  RPC calls:  │     │  Functions: │
│ dashboard   │     │   fetches    │     │              │     │              │
└─────────────┘     │   data       │     │ - get_dashboard_summary() │ - dashboard_summary_view │
                    └──────────────┘     │ - get_vendor_summaries()  │ - vendor_summary_view    │
                           │               └──────────────┘     │ - receipts table         │
                           │                      │               └─────────────┘
                           ▼                      │                      │
                    ┌──────────────┐             │                      │
                    │   Display    │◀────────────┴──────────────────────┘
                    │   KPIs:      │
                    │   - Total    │
                    │     Estimated│
                    │   - Total    │
                    │     Paid     │
                    │   - Outstanding│
                    │   - Tax      │
                    │     breakdown│
                    └──────────────┘
```

### 3. Receipt Confirmation Flow

```
User reviews    User confirms    Receipt status    Dashboard updates
in Inbox    ──▶  receipt    ──▶  → 'confirmed'  ──▶  totals recalculate
                                    via trigger
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VENDORS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)                    │ UUID                                           │
│ project_id (FK)            │ UUID → projects.id                             │
│ name                       │ TEXT                                           │
│ type                       │ ENUM: 'contract' | 'retail'                    │
│ contact_name               │ TEXT, nullable                                 │
│ email                      │ TEXT, nullable                                 │
│ phone                      │ TEXT, nullable                                 │
│ address                    │ TEXT, nullable                                 │
│ website                    │ TEXT, nullable                                 │
│ tax_province               │ ENUM: 'ON' | 'QC'                              │
│ notes                      │ TEXT, nullable                                 │
│ tags                       │ TEXT[]                                         │
│ is_archived                │ BOOLEAN, default false                         │
│ created_at                 │ TIMESTAMPTZ                                    │
│ updated_at                 │ TIMESTAMPTZ                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 1:N
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ESTIMATES                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)                    │ UUID                                           │
│ vendor_id (FK)             │ UUID → vendors.id                              │
│ title                      │ TEXT                                           │
│ vendor_ref                 │ TEXT                                           │
│ date                       │ DATE                                           │
│ estimated_total            │ NUMERIC(12,2)                                  │
│ status                     │ ENUM: 'active' | 'revised' | 'declined'       │
│ notes                      │ TEXT, nullable                                 │
│ tags                       │ TEXT[]                                         │
│ created_at                 │ TIMESTAMPTZ                                    │
│ updated_at                 │ TIMESTAMPTZ                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 1:N
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             RECEIPTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)                    │ UUID                                           │
│ vendor_id (FK)             │ UUID → vendors.id                              │
│ estimate_id (FK)           │ UUID → estimates.id, nullable                  │
│ vendor_ref                 │ TEXT, nullable                                 │
│ date                       │ DATE                                           │
│ subtotal                   │ NUMERIC(12,2)                                  │
│ gst_amount                 │ NUMERIC(10,2)                                  │
│ pst_amount                 │ NUMERIC(10,2)                                  │
│ tax_total                  │ NUMERIC(10,2)                                  │
│ total                      │ NUMERIC(12,2)                                  │
│ payment_type               │ ENUM: 'deposit' | 'progress' | 'final' | 'additional' │
│ status                     │ ENUM: 'inbox' | 'confirmed'                    │
│ notes                      │ TEXT, nullable                                 │
│ tags                       │ TEXT[]                                         │
│ created_by                 │ UUID → auth.users, nullable                    │
│ created_at                 │ TIMESTAMPTZ                                    │
│ updated_at                 │ TIMESTAMPTZ                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 1:0-1
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOCUMENTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)                    │ UUID                                           │
│ receipt_id (FK)            │ UUID → receipts.id, nullable                   │
│ storage_path               │ TEXT                                           │
│ file_type                  │ TEXT                                           │
│ file_size_bytes            │ INTEGER                                        │
│ ocr_confidence             │ ENUM: 'high' | 'medium' | 'low' | 'failed'   │
│ ocr_raw_response           │ JSONB, nullable                                │
│ created_at                 │ TIMESTAMPTZ                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Computed Views

**vendor_summary_view**: Real-time vendor financial summaries
```sql
SELECT 
  v.id,
  v.name,
  v.type,
  COALESCE(SUM(e.estimated_total), 0) as estimated_total,
  COALESCE(SUM(r.total), 0) as paid_total,
  COALESCE(SUM(r.gst_amount), 0) as gst_total,
  COALESCE(SUM(r.pst_amount), 0) as pst_total
FROM vendors v
LEFT JOIN estimates e ON e.vendor_id = v.id
LEFT JOIN receipts r ON r.vendor_id = v.id AND r.status = 'confirmed'
GROUP BY v.id, v.name, v.type;
```

**dashboard_summary_view**: Project-level KPIs
```sql
SELECT 
  SUM(estimated_total) as total_estimated,
  SUM(paid_total) as total_paid,
  SUM(estimated_total - paid_total) as total_outstanding,
  COUNT(DISTINCT vendor_id) as vendor_count,
  COUNT(*) as receipt_count
FROM vendor_summary_view;
```

---

## Security Model

### Row-Level Security (RLS)

All tables have RLS enabled. Policies:

```sql
-- Vendors: Users can only see vendors in their projects
CREATE POLICY "Users can view their project vendors"
  ON vendors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = vendors.project_id
    AND user_id = auth.uid()
  ));

-- Receipts: Users can only see receipts they created or in their projects
CREATE POLICY "Users can view project receipts"
  ON receipts FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM vendors v
      JOIN project_members pm ON v.project_id = pm.project_id
      WHERE v.id = receipts.vendor_id
      AND pm.user_id = auth.uid()
    )
  );
```

### Authentication

- **Method**: Magic links (passwordless)
- **Session**: JWT tokens stored in AsyncStorage (mobile) or memory (web)
- **Auto-refresh**: Handled by Supabase client

---

## API Design

### RESTful Endpoints (via Supabase)

| Resource | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| Vendors | GET | `/rest/v1/vendors` | List vendors |
| Vendors | POST | `/rest/v1/vendors` | Create vendor |
| Vendors | PATCH | `/rest/v1/vendors?id=eq.{id}` | Update vendor |
| Estimates | GET | `/rest/v1/estimates` | List estimates |
| Receipts | GET | `/rest/v1/receipts` | List receipts |
| Receipts | POST | `/rest/v1/receipts` | Create receipt |
| Dashboard | POST | `/rest/v1/rpc/get_dashboard_summary` | Get summary |

### Edge Functions

| Function | Method | Path | Description |
|----------|--------|------|-------------|
| OCR | POST | `/functions/v1/ocr-extract` | Extract receipt data |

---

## Performance Considerations

### Optimizations

1. **Database Indexes**
   - `vendors(project_id, is_archived)`
   - `receipts(vendor_id, status, date)`
   - `receipts(estimate_id)`

2. **Computed Fields**
   - Vendor totals calculated via materialized view
   - Refreshed on receipt status change via trigger

3. **Query Patterns**
   - Dashboard uses RPC (stored procedure) for complex aggregations
   - List views use cursor pagination (not yet implemented)

### Scaling Considerations

- Current design supports single-user or small team per project
- For multi-user: Add proper project membership enforcement
- For high volume: Consider archiving old receipts to separate table

---

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| **Supabase over Firebase** | PostgreSQL relational model fits finance data better |
| **Magic links over passwords** | Lower friction for personal use, still secure |
| **Edge Functions for OCR** | Keep API key server-side, scale independently |
| **NativeWind over StyleSheet** | Consistent Tailwind styling across web/mobile |
| **Claude over GPT-4 Vision** | Better accuracy on Canadian receipts in testing |
| **Zod over Yup** | Better TypeScript integration, smaller bundle |

---

## Future Considerations

### Potential Enhancements

1. **Multi-project support** - Currently single project in seed data
2. **Budget tracking** - Compare actuals vs budget categories
3. **Photo sync** - Auto-upload to cloud storage
4. **Offline support** - PouchDB or WatermelonDB for mobile
5. **Bank integration** - Import transactions via Plaid/Finicity
6. **Reporting** - PDF reports for tax time

### Technical Debt

- Form components need better validation error display
- Mobile navigation needs deep linking
- Search function could use full-text search (PostgreSQL tsvector)
- Receipt image compression before upload

---

*Last updated: 2026-03-21*