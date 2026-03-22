# Fox Valley Finance Tracker - Session Memory

## Project Overview
Personal finance tracking app for residential home construction. Tracks estimates, receipts, invoices, and vendor payments with Canadian tax handling (HST/QST).

## Tech Stack
- Web: React 19, TypeScript, Tailwind CSS, Vite
- Mobile: Expo, React Native
- Backend: Supabase (PostgreSQL, Auth, Storage)
- OCR: Claude API via Edge Function

## Session Summary (2026-03-22)

### Bugs Fixed
1. **Vendor creation failing** - Missing `project_id` field in API call
   - Fixed in: `apps/web/src/lib/supabase.ts`, `apps/web/src/types/index.ts`

2. **Logo not clickable** - Added Link wrapper to sidebar logo
   - Fixed in: `apps/web/src/components/layout.tsx`

3. **Vendor detail "not found"** - Page was using mock data instead of Supabase
   - Fixed in: `apps/web/src/pages/vendor-detail.tsx`

4. **Actions menu not working** - Dropdown inside Link was triggering navigation
   - Fixed in: `apps/web/src/components/vendor-list.tsx`

5. **Tags not editable** - Added tags input field to vendor form
   - Fixed in: `apps/web/src/components/vendor-form.tsx`

6. **Inbox count stuck at 0** - Wired up to fetch actual inbox receipts
   - Fixed in: `apps/web/src/components/layout.tsx`

7. **Receipts not persisting** - Was using local state instead of database
   - Fixed in: `apps/web/src/pages/vendor-detail.tsx`

### Features Added
1. **Document upload for estimates** - Can attach PDF/image when creating estimate
   - New file: `apps/web/src/components/document-upload.tsx`
   - Modified: `apps/web/src/components/estimate-form.tsx`, `apps/web/src/lib/supabase.ts`

2. **Pre-selected estimate for receipts** - When clicking "Link Receipt" from an estimate, the estimate is pre-selected
   - Modified: `apps/web/src/components/receipt-form.tsx`, `apps/web/src/pages/vendor-detail.tsx`

### Type Fixes
Added `project_id` to TypeScript interfaces:
- `Vendor` interface
- `Estimate` interface
- `Receipt` interface
- `Document` interface

### Key Files Modified
- `apps/web/src/lib/supabase.ts` - Added project_id to create calls, added uploadDocument function
- `apps/web/src/types/index.ts` - Added project_id fields to all entity types
- `apps/web/src/pages/vendor-detail.tsx` - Real API calls for estimates and receipts
- `apps/web/src/components/vendor-form.tsx` - Added tags input
- `apps/web/src/components/estimate-form.tsx` - Added document upload
- `apps/web/src/components/receipt-form.tsx` - Added preSelectedEstimateId prop
- `apps/web/src/components/vendor-list.tsx` - Fixed actions menu
- `apps/web/src/components/layout.tsx` - Logo link, inbox count
- `apps/web/src/components/document-upload.tsx` - NEW file

## Known Limitations
- Supabase Storage bucket "documents" needs to be created manually if not exists
- Documents section "Upload Document" button not wired up (only works via estimate form)
- Mobile app not tested in this session

## Next Steps (if needed)
1. Create Supabase Storage bucket for documents
2. Wire up general document upload button
3. Test receipt image upload flow
4. Add error handling for file uploads

## Local Dev Setup Reminder
```bash
supabase start
supabase db reset
cd apps/web && npm run dev
```

Web app runs at http://localhost:5173
