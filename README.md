# Fox Valley Finance Tracker

Personal finance tracking for residential home construction. Track estimates, receipts, invoices, and vendor payments with Canadian HST/QST tax visibility.

## Quick Links

- [Architecture Overview](#architecture-overview)
- [Local Development](#local-development)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYERS                           │
├─────────────────┬─────────────────┬───────────────────────────┤
│   Web App       │   Mobile App    │   OCR Edge Function       │
│   (React/Vite)  │   (Expo/RN)     │   (Deno/Claude API)       │
└────────┬────────┴────────┬────────┴───────────┬───────────────┘
         │                 │                    │
         └─────────────────┴────────────────────┘
                           │
              ┌────────────▼────────────┐
              │     Supabase Backend     │
              ├──────────────────────────┤
              │  PostgreSQL (Database)   │
              │  Auth (Magic Links)      │
              │  Storage (Receipts)      │
              │  Edge Functions (OCR)    │
              └──────────────────────────┘
```

### Project Structure

```
fox-valley-finance/
├── apps/
│   ├── web/                    # React web app
│   │   ├── src/
│   │   │   ├── pages/          # Dashboard, Vendors, Inbox, Search
│   │   │   ├── components/     # Forms, Lists, UI primitives
│   │   │   ├── lib/            # Supabase client, queries
│   │   │   └── types/          # TypeScript types
│   │   └── package.json
│   └── mobile/                 # Expo React Native app
│       ├── src/
│       │   ├── screens/        # Auth, Home, Vendor Detail, Capture
│       │   ├── components/     # Shared components
│       │   ├── lib/            # Supabase client
│       │   └── types/          # TypeScript types
│       └── package.json
├── supabase/
│   ├── migrations/             # Database schema
│   ├── functions/              # Edge Functions (OCR)
│   ├── policies.sql            # RLS policies
│   └── seed.sql                # Sample data
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase CLI (`brew install supabase/tap/supabase`)
- Docker (for Supabase local)

### 1. Clone & Install

```bash
cd ~/repos/fox-valley-finance

# Install web dependencies
cd apps/web && npm install

# Install mobile dependencies
cd ../mobile && npm install
```

### 2. Start Supabase Local

```bash
# From project root
supabase start

# Run migrations and seed data
supabase db reset

# Verify status
supabase status
```

**Note:** First run downloads Docker images (~5 min). Subsequent starts are instant.

### 3. Configure Environment

**Web App** (`apps/web/.env`):
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**Mobile App** (`apps/mobile/.env`):
```bash
EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321  # Android emulator
# OR
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321  # iOS simulator
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*Get actual values from `supabase status`*

### 4. Start Development Servers

```bash
# Terminal 1: Web app
cd apps/web && npm run dev
# → http://localhost:5173

# Terminal 2: Mobile app
cd apps/mobile && npx expo start
# → i: iOS simulator
# → a: Android emulator
# → w: Web
```

### 5. Set Up OCR (Optional)

```bash
# Set your Anthropic API key
supabase secrets set --project-ref your-project-ref ANTHROPIC_API_KEY=sk-ant-...

# Deploy function (for cloud)
supabase functions deploy ocr-extract
```

---

## Data Model

### Core Entities

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vendor    │────▶│  Estimate   │◀────│   Receipt   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    ▲                   │
      │                    │                   │
      └────────────────────┴───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Document   │
                    └─────────────┘
```

### Vendor Types

| Type | Description | Features |
|------|-------------|----------|
| **Contract** | Tradespeople with estimates | Estimate → Receipt linking, progress payments |
| **Retail** | Material suppliers | Standalone receipts, tagging |

### Tax Handling

| Province | GST | PST | Notes |
|----------|-----|-----|-------|
| **ON** | 5% | 8% | HST combined 13%, split for reporting |
| **QC** | 5% | 9.975% | GST + QST tracked separately |

### Receipt Status Flow

```
┌─────────┐    ┌───────────┐    ┌───────────┐
│ CAPTURE │───▶│   INBOX   │───▶│ CONFIRMED │
│ (Photo) │    │ (Review)  │    │ (Final)   │
└─────────┘    └───────────┘    └───────────┘
                      │
                      ▼
               ┌───────────┐
               │ DISCARDED │
               └───────────┘
```

---

## API Reference

### Supabase Client Functions

Location: `apps/web/src/lib/supabase.ts` and `apps/mobile/src/lib/supabase.ts`

#### Vendors

```typescript
// List all active vendors
const vendors = await getVendors({ archived: false });

// Get vendor by display ID (e.g., "VEN-0001")
const vendor = await getVendorByDisplayId('VEN-0001');

// Create vendor
const newVendor = await createVendor({
  name: 'Elite Electric',
  type: 'contract',
  tax_province: 'ON',
  tags: ['electrical'],
  is_archived: false,
});

// Archive vendor (soft delete)
await archiveVendor(vendorId);
```

#### Estimates

```typescript
// Get estimates for vendor
const estimates = await getEstimates(vendorId);

// Create estimate
const estimate = await createEstimate({
  vendor_id: vendorId,
  title: 'Kitchen Renovation',
  estimated_total: 25000,
  date: '2026-03-15',
  status: 'active',
});
```

#### Receipts

```typescript
// Get receipts with filters
const receipts = await getReceipts({
  vendorId: vendorId,
  status: 'inbox',     // or 'confirmed'
  dateRange: { start: '2026-01-01', end: '2026-03-31' },
});

// Create receipt
const receipt = await createReceipt({
  vendor_id: vendorId,
  subtotal: 1000,
  gst_amount: 50,
  pst_amount: 80,
  tax_total: 130,
  total: 1130,
  date: '2026-03-15',
  status: 'confirmed',
  tags: ['materials'],
});
```

#### Dashboard

```typescript
// Get summary metrics
const summary = await getDashboardSummary({
  start: '2026-01-01',
  end: '2026-03-31',
});
// Returns: { total_estimated, total_paid, total_outstanding, ... }

// Get vendor summaries
const vendorSummaries = await getVendorSummaries(dateRange);
```

### OCR Edge Function

**Endpoint:** `POST /functions/v1/ocr-extract`

**Request:**
```json
{
  "image": "base64-encoded-image-data",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "vendor_name": "Home Depot",
  "date": "2026-03-15",
  "subtotal": 100.00,
  "gst_amount": 5.00,
  "pst_amount": 8.00,
  "tax_total": 13.00,
  "total": 113.00,
  "vendor_ref": "HD-12345",
  "tax_province": "ON",
  "confidence": "high"
}
```

---

## Testing

### Running Tests

```bash
# TypeScript type checking
cd apps/web && npx tsc --noEmit

# Web build test
npm run build

# Mobile build test
cd ../mobile && npx expo prebuild
```

### Sample Test Data

The seed data (`supabase/seed.sql`) creates a realistic construction project:

- **15 Vendors**: Mix of contractors and retail
- **8 Estimates**: Range from $2K to $95K
- **45 Receipts**: Deposits, progress payments, final payments
- **Tax Scenarios**: Both Ontario HST and Quebec GST/QST

**Demo accounts:**
- Check `supabase/seed.sql` for UUIDs after running `supabase db reset`
- Or create new users via Supabase Studio: `http://localhost:54323`

### Manual Testing Checklist

- [ ] Create vendor (contract vs retail)
- [ ] Add estimate to contract vendor
- [ ] Add receipt linked to estimate
- [ ] Add unlinked receipt to retail vendor
- [ ] Verify dashboard totals update
- [ ] Test date range filters
- [ ] Export CSV from dashboard
- [ ] Test mobile capture flow (if OCR configured)

---

## Deployment

### Local → Cloud Migration

1. **Create Supabase Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Deploy Database**
   ```bash
   supabase db push
   ```

3. **Deploy Edge Function**
   ```bash
   supabase functions deploy ocr-extract
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

4. **Update Web Env**
   ```bash
   # Get new credentials from Supabase Dashboard
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. **Build & Deploy Web**
   ```bash
   cd apps/web
   npm run build
   # Deploy dist/ to Vercel/Netlify/static hosting
   ```

6. **Build & Deploy Mobile**
   ```bash
   cd apps/mobile
   eas build --platform ios
   eas build --platform android
   ```

### Environment-Specific Configs

| Environment | Supabase URL | Auth |
|-------------|--------------|------|
| Local | `localhost:54321` | Auto-confirmed |
| Staging | `*.supabase.co` | Magic links |
| Production | `*.supabase.co` | Magic links + custom domain |

---

## Troubleshooting

### Common Issues

**Build fails with "Cannot find module"**
```bash
# Clear all node_modules and reinstall
find . -name 'node_modules' -type d -exec rm -rf {} +
npm install
```

**Supabase start fails**
```bash
# Reset Docker state
supabase stop
supabase start
```

**Type errors in forms**
```bash
# Regenerate types from Supabase
supabase gen types typescript --local > apps/web/src/types/supabase.ts
```

**Mobile can't connect to local Supabase**
- iOS Simulator: Use `localhost:54321`
- Android Emulator: Use `10.0.2.2:54321` (maps to host localhost)
- Physical device: Use computer's LAN IP

### Getting Help

1. Check Supabase logs: `supabase logs functions ocr-extract --tail`
2. Open Supabase Studio: `http://localhost:54323`
3. View database tables and auth users directly

---

## License

Private project for personal construction finance tracking.

---

*Built with React, Expo, Supabase, and Claude.*