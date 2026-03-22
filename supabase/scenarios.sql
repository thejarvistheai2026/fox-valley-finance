-- ============================================================================
-- FOX VALLEY FINANCE TRACKER - REALISTIC SCENARIOS
-- ============================================================================
-- 
-- This file contains detailed, realistic construction project scenarios
-- for testing various use cases including edge cases and complex workflows.
--
-- Apply after running main seed.sql:
--   psql $DATABASE_URL -f supabase/scenarios.sql
--
-- ============================================================================

-- ============================================================================
-- SCENARIO 1: COMPLEX KITCHEN RENOVATION
-- Multiple vendors, phased payments, change orders
-- ============================================================================

-- Additional kitchen-related vendors
INSERT INTO vendors (
    id, project_id, name, type, contact_name, email, phone, address, 
    tax_province, notes, tags, is_archived
) VALUES 
(
    'kitchen-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Custom Cabinetry Co',
    'contract',
    'Maria Garcia',
    'maria@customcabinets.ca',
    '416-555-5555',
    '45 Industrial Rd, Toronto, ON M6N 4X8',
    'ON',
    'Custom millwork and cabinets. 4-6 week lead time. Requires 50% deposit.',
    ARRAY['cabinets', 'millwork', 'kitchen', 'custom'],
    FALSE
),
(
    'kitchen-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Stone Countertops Ltd',
    'contract',
    'David Kim',
    'david@stonecountertops.ca',
    '647-555-6666',
    '78 Granite Ave, Etobicoke, ON M8Z 2P9',
    'ON',
    'Quartz and granite fabrication. Template measurement required.',
    ARRAY['countertops', 'stone', 'kitchen', 'fabrication'],
    FALSE
),
(
    'kitchen-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Plumbing Solutions Inc',
    'contract',
    'James Wilson',
    'james@plumbingsolutions.ca',
    '905-555-7777',
    '123 Pipe St, Toronto, ON M9A 1B2',
    'ON',
    'Licensed plumber for rough-in and fixture installation. Good with high-end fixtures.',
    ARRAY['plumbing', 'fixtures', 'kitchen', 'licensed'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Kitchen estimates with change order scenario
INSERT INTO estimates (
    id, project_id, vendor_id, vendor_ref, title, date, 
    estimated_total, status, notes, tags
) VALUES 
-- Original kitchen cabinet estimate
(
    'est-cabinets-orig',
    '11111111-1111-1111-1111-111111111111',
    'kitchen-1111-1111-1111-111111111111',
    'CC-2026-0891',
    'Custom Kitchen Cabinets - Base Contract',
    '2026-02-28',
    18500.00,
    'revised',
    'Original estimate for maple cabinets. Client upgraded to cherry after deposit.',
    ARRAY['cabinets', 'original']
),
-- Revised estimate (upgraded materials)
(
    'est-cabinets-rev',
    '11111111-1111-1111-1111-111111111111',
    'kitchen-1111-1111-1111-111111111111',
    'CC-2026-0891-R1',
    'Custom Kitchen Cabinets - Revised (Cherry Upgrade)',
    '2026-03-05',
    22400.00,
    'active',
    'Upgraded to cherry wood, soft-close hardware, and pull-out organizers.',
    ARRAY['cabinets', 'revised', 'upgrade']
),
-- Countertops estimate
(
    'est-countertops-001',
    '11111111-1111-1111-1111-111111111111',
    'kitchen-2222-2222-2222-222222222222',
    'SC-2026-0123',
    'Quartz Countertops - Calacatta Gold',
    '2026-03-10',
    8750.00,
    'active',
    'Includes template, fabrication, install, and cutouts for sink and cooktop.',
    ARRAY['countertops', 'quartz', 'high-end']
),
-- Plumbing fixtures estimate
(
    'est-plumbing-kitchen',
    '11111111-1111-1111-1111-111111111111',
    'kitchen-3333-3333-3333-333333333333',
    'PS-2026-0456',
    'Kitchen Plumbing - Fixtures Only',
    '2026-03-08',
    4200.00,
    'active',
    'Rough-in already completed. This is for fixture installation only.',
    ARRAY['plumbing', 'fixtures', 'installation']
)
ON CONFLICT (id) DO NOTHING;

-- Kitchen payment receipts showing phased workflow
INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, notes, tags
) VALUES 
-- Cabinet company deposit (on original estimate)
(
    'rec-cabinet-dep-orig',
    '11111111-1111-1111-1111-111111111111',
    'kitchen-1111-1111-1111-111111111111',
    'est-cabinets-orig',
    'CC-INV-2026-001',
    '2026-03-01',
    9250.00,  -- 50% of original
    462.50,   -- 5% GST portion of $925 HST
    740.00,   -- 8% PST portion of $925 HST
    10452.50,
    'deposit',
    'confirmed',
    'Original 50% deposit on maple cabinets',
    ARRAY['cabinets', 'deposit', 'original']
),
-- Additional deposit for upgrade
(
    'rec-cabinet-dep-upgrade',
    '11111111-1111-1111-1111-111111111111',
    'kitchen-1111-1111-1111-111111111111',
    'est-cabinets-rev',
    'CC-INV-2026-002',
    '2026-03-08',
    1950.00,  -- Difference for upgrade
    97.50,
    156.00,
    2203.50,
    'additional',
    'confirmed',
    'Additional deposit for cherry wood upgrade',
    ARRAY['cabinets', 'upgrade', 'additional']
),
-- Cabinet progress payment
(
    'rec-cabinet-progress',
    '11111111-1111-1111-1111-111111111111',
    'kitchen-1111-1111-1111-111111111111',
    'est-cabinets-rev',
    'CC-INV-2026-003',
    '2026-03-25',
    5600.00,
    280.00,
    448.00,
    6328.00,
    'progress',
    'confirmed',
    'Progress payment upon cabinet delivery',
    ARRAY['cabinets', 'progress']
),
-- Retail: Home Depot - cabinet hardware (not linked to estimate)
(
    'rec-hd-hardware',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    NULL,
    'HD-20260305-142233',
    '2026-03-05',
    425.50,
    21.28,
    34.04,
    480.82,
    'additional',
    'confirmed',
    'Cabinet handles and pulls (upgraded after design change)',
    ARRAY['hardware', 'retail', 'upgrades']
),
-- Countertops deposit
(
    'rec-countertop-dep',
    '11111111-1111-1111-1111-111111111111',
    'kitchen-2222-2222-2222-222222222222',
    'est-countertops-001',
    'SC-INV-2026-089',
    '2026-03-12',
    4375.00,  -- 50%
    218.75,
    350.00,
    4943.75,
    'deposit',
    'confirmed',
    'Deposit for quartz countertops',
    ARRAY['countertops', 'deposit']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SCENARIO 2: ELECTRICAL PHASED PAYMENTS
-- Shows progress payment workflow with ESA inspection milestone
-- ============================================================================

-- Additional electrical work (beyond the main estimate)
INSERT INTO estimates (
    id, project_id, vendor_id, vendor_ref, title, date, 
    estimated_total, status, notes, tags
) VALUES 
(
    'est-electrical-ev',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'EL-2026-0342',
    'EV Charger Installation',
    '2026-03-20',
    3200.00,
    'active',
    'Separate scope: Tesla charger outlet in garage. Requires 60A breaker.',
    ARRAY['electrical', 'ev-charger', 'garage', 'separate-scope']
)
ON CONFLICT (id) DO NOTHING;

-- Electrical receipts showing phased payments
INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, notes, tags
) VALUES 
-- Main electrical: Deposit
(
    'rec-elec-main-dep',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'cccccccc-dddd-3333-4444-cccccccccccc', -- Main electrical estimate
    'VOLT-2026-0156',
    '2026-03-10',
    8550.00,
    427.50,
    684.00,
    9661.50,
    'deposit',
    'confirmed',
    '30% deposit for electrical rough-in and panel upgrade',
    ARRAY['electrical', 'deposit', 'panel', 'rough-in']
),
-- Main electrical: Progress after rough-in
(
    'rec-elec-roughin',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'cccccccc-dddd-3333-4444-cccccccccccc',
    'VOLT-2026-0189',
    '2026-04-05',
    9500.00,
    475.00,
    760.00,
    10735.00,
    'progress',
    'confirmed',
    'Progress payment after rough-in complete and ESA rough-in inspection passed',
    ARRAY['electrical', 'progress', 'rough-in', 'esa-inspection']
),
-- Main electrical: Final after finish
(
    'rec-elec-final',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'cccccccc-dddd-3333-4444-cccccccccccc',
    'VOLT-2026-0241',
    '2026-05-15',
    10450.00,
    522.50,
    836.00,
    11808.50,
    'final',
    'confirmed',
    'Final payment after fixtures installed and ESA final inspection',
    ARRAY['electrical', 'final', 'fixtures', 'esa-inspection']
),
-- EV Charger: Separate payment
(
    'rec-elec-ev',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'est-electrical-ev',
    'VOLT-2026-0299',
    '2026-05-20',
    3200.00,
    160.00,
    256.00,
    3616.00,
    'final',
    'confirmed',
    'EV charger install - paid in full upon completion',
    ARRAY['electrical', 'ev-charger', 'garage']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SCENARIO 3: RETAIL PURCHASE PATTERNS
-- Shows how material purchases flow through without estimates
-- ============================================================================

-- Home Depot receipts - multiple visits
INSERT INTO receipts (
    id, project_id, vendor_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, notes, tags
) VALUES 
-- HD Visit 1: Initial supplies
(
    'rec-hd-001',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'HD-20260220-093412',
    '2026-02-20',
    342.89,
    17.14,
    27.43,
    387.46,
    'additional',
    'confirmed',
    'Safety equipment, tarps, extension cords for site prep',
    ARRAY['safety', 'site-prep', 'tools']
),
-- HD Visit 2: Framing materials (after framing estimate signed)
(
    'rec-hd-002',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'HD-20260315-114522',
    '2026-03-15',
    568.45,
    28.42,
    45.48,
    642.35,
    'additional',
    'confirmed',
    'Misc lumber, nails, and fasteners for framers',
    ARRAY['lumber', 'framing', 'fasteners']
),
-- HD Visit 3: Electrical supplies
(
    'rec-hd-003',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'HD-20260325-161230',
    '2026-03-25',
    234.99,
    11.75,
    18.80,
    265.54,
    'additional',
    'confirmed',
    'Boxes, wire nuts, and misc electrical supplies',
    ARRAY['electrical', 'supplies']
),
-- HD Visit 4: Paint and primer
(
    'rec-hd-004',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'HD-20260410-092145',
    '2026-04-10',
    489.67,
    24.48,
    39.17,
    552.32,
    'additional',
    'confirmed',
    'Primer, paint, rollers, and brushes',
    ARRAY['paint', 'finishing']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SCENARIO 4: QUEBEC VENDOR (GST + QST)
-- Demonstrates Quebec tax handling
-- ============================================================================

-- Receipts from Quebec roofer
INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, notes, tags
) VALUES 
-- QC Vendor: Deposit
(
    'rec-qc-roof-dep',
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'dddddddd-eeee-4444-5555-dddddddddddd',
    'DEV-2026-0124-DEP',
    '2026-04-01',
    9750.00,  -- 30% of $32,500
    487.50,   -- 5% GST
    972.56,   -- 9.975% QST
    11210.06,
    'deposit',
    'confirmed',
    '30% deposit for standing seam metal roof. QC vendor - GST+QST applies.',
    ARRAY['roofing', 'qc-vendor', 'gst-qst']
),
-- QC Vendor: Materials delivery
(
    'rec-qc-roof-mat',
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'dddddddd-eeee-4444-5555-dddddddddddd',
    'DEV-2026-0124-MAT',
    '2026-04-20',
    13000.00,
    650.00,   -- 5% GST
    1296.75,  -- 9.975% QST
    14946.75,
    'progress',
    'confirmed',
    'Payment upon materials delivery to site',
    ARRAY['roofing', 'qc-vendor', 'materials']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SCENARIO 5: INBOX/REVIEW QUEUE
-- Receipts captured by mobile but awaiting confirmation
-- ============================================================================

INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, notes, tags
) VALUES 
-- In inbox: Needs vendor assignment
(
    'rec-inbox-001',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', -- Temporarily assigned to Home Depot
    NULL,
    'HD-20260422-142233',
    '2026-04-22',
    156.78,
    7.84,
    12.54,
    177.16,
    'additional',
    'inbox',
    'Captured via mobile app. Needs review: Not sure if this is Home Depot or Rona.',
    ARRAY['review-needed']
),
-- In inbox: Vendor unclear
(
    'rec-inbox-002',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc', -- Temporarily Voltex
    NULL,
    'RECEIPT-001',
    '2026-04-23',
    245.00,
    12.25,
    19.60,
    276.85,
    'additional',
    'inbox',
    'Photo unclear. OCR suggests electrician but amount seems low for contract vendor.',
    ARRAY['review-needed', 'unclear-vendor']
),
-- In inbox: Amount discrepancy
(
    'rec-inbox-003',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-bbbb-1111-2222-aaaaaaaaaaaa',
    'INV-2026-XXXX',
    '2026-04-24',
    4500.00,
    225.00,
    360.00,
    5085.00,
    'progress',
    'inbox',
    'Amount doesnt match expected progress payment. Need to verify with Elyse.',
    ARRAY['review-needed', 'amount-discrepancy']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SCENARIO 6: ARCHIVED/OLD VENDORS
-- Shows how archived vendors appear in historical data
-- ============================================================================

-- Create an archived vendor (started but didnt work out)
INSERT INTO vendors (
    id, project_id, name, type, contact_name, email, phone, address, 
    tax_province, notes, tags, is_archived
) VALUES 
(
    'archived-1111-2222-3333-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Budget Framing Inc',
    'contract',
    'Tom Budget',
    'tom@budgetframing.ca',
    '416-555-9999',
    '99 Cheap St, Toronto, ON',
    'ON',
    'Started work but quality was poor. Terminated contract after deposit.',
    ARRAY['archived', 'terminated', 'quality-issues'],
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Receipt from archived vendor
INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, notes, tags, is_archived
) VALUES 
(
    'rec-archived-vendor',
    '11111111-1111-1111-1111-111111111111',
    'archived-1111-2222-3333-444444444444',
    NULL,
    'BF-2026-001',
    '2026-02-10',
    2500.00,
    125.00,
    200.00,
    2825.00,
    'deposit',
    'confirmed',
    'Deposit for framing - contract terminated due to quality issues. Deposit forfeited.',
    ARRAY['archived', 'deposit-forfeited'],
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DOCUMENTATION: Test Scenarios Summary
-- ============================================================================

-- After running this file, you can test:
--
-- 1. DASHBOARD VIEW:
--    - Total estimated: Should include all active estimates
--    - Total paid: Sum of all confirmed receipts
--    - Outstanding: Estimated - Paid (for contract vendors)
--    - GST/PST breakdown: Should show both ON and QC totals
--
-- 2. VENDOR DETAIL:
--    - Elyse McCurdy: Should show 2 estimates, multiple receipts with linkage
--    - Custom Cabinetry Co: Should show revised estimate history
--    - Toitures Laurentides: Should show GST+QST breakdown
--    - Budget Framing Inc: Should show as archived with warning
--
-- 3. INBOX:
--    - Should show 3 receipts needing review
--    - Test confirming receipt updates vendor totals
--
-- 4. SEARCH:
--    - Search "kitchen" should find vendors, estimates, and receipts
--    - Search "QC" should find Quebec vendor and receipts
--
-- 5. DATE RANGE FILTERING:
--    - Feb 2026: Should show early purchases and archived vendor
--    - Apr 2026: Should show electrical progress payments
--    - All time: Should show complete project picture
--
-- 6. CSV EXPORT:
--    - Export from dashboard should include all columns
--    - Verify HST splits for ON vendors
--    - Verify GST+QST for QC vendors
--