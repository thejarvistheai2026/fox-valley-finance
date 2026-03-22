-- Fox Valley Finance Tracker - Seed Data
-- File: supabase/seed.sql
-- Description: Sample project with users, vendors, estimates, and receipts
-- Apply after running migrations and policies

-- ============================================================================
-- SAMPLE USER UUIDS
-- Replace with actual user UUIDs from your Supabase Auth after creating users
-- Or use these fixed UUIDs and create users with matching IDs via SQL
-- ============================================================================

-- For local development, you can create users with specific IDs:
-- Note: In production, users are created via Supabase Auth UI/API

-- ============================================================================
-- PROJECT SETUP
-- ============================================================================

-- Create the main project (Fox Valley Build)
INSERT INTO projects (id, name, description, created_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Fox Valley Build',
    'Residential home construction project in Fox Valley',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE VENDORS
-- ============================================================================

-- Contract Vendors (estimate-driven)
INSERT INTO vendors (
    id, project_id, name, type, contact_name, email, phone, address, 
    website, tax_province, notes, tags, is_archived
) VALUES 
-- Contract Vendor 1: Home Designer
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Elyse McCurdy Home Design',
    'contract',
    'Elyse McCurdy',
    'elyse@mccurdyhomedesign.ca',
    '416-555-0101',
    '123 Design St, Toronto, ON M5A 1A1',
    'https://mccurdyhomedesign.ca',
    'ON',
    'Kitchen and bathroom design specialist. Great to work with on the main floor layout.',
    ARRAY['design', 'kitchen', 'bathroom'],
    FALSE
),
-- Contract Vendor 2: Framing Contractor
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'Premier Framing Solutions',
    'contract',
    'Mike Johnson',
    'mike@premierframing.ca',
    '905-555-0202',
    '456 Builder Ave, Mississauga, ON L5B 2C3',
    'https://premierframing.ca',
    'ON',
    'Full house framing including roof. Licensed and insured.',
    ARRAY['framing', 'structural', 'major'],
    FALSE
),
-- Contract Vendor 3: Electrical Contractor
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    'Voltex Electrical Services',
    'contract',
    'Sarah Chen',
    'sarah@voltex.ca',
    '647-555-0303',
    '789 Current Rd, Toronto, ON M6P 3K2',
    'https://voltex.ca',
    'ON',
    'ESA licensed. Full house rough-in and finish electrical.',
    ARRAY['electrical', 'esa', 'lighting'],
    FALSE
),
-- Contract Vendor 4: Roofing (Queois-based, QC tax)
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'Toitures Laurentides',
    'contract',
    'Jean-Pierre Dubois',
    'jp@toitureslaurentides.qc.ca',
    '450-555-0404',
    '12 Rue Principale, Saint-Sauveur, QC J0R 1R0',
    'https://toitureslaurentides.qc.ca',
    'QC',
    'Metal roofing specialist. Based in Quebec, applies GST+QST.',
    ARRAY['roofing', 'metal', 'exterior', 'quebec'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Retail Vendors (receipt-only)
INSERT INTO vendors (
    id, project_id, name, type, contact_name, email, phone, address, 
    website, tax_province, notes, tags, is_archived
) VALUES 
-- Retail Vendor 1: Home Depot
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'Home Depot',
    'retail',
    NULL,
    NULL,
    NULL,
    'Multiple locations',
    'https://homedepot.ca',
    'ON',
    'Go-to for plumbing fixtures, lumber, and hardware. Check online for better prices.',
    ARRAY['hardware', 'lumber', 'plumbing', 'retail'],
    FALSE
),
-- Retail Vendor 2: Lowe's
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '11111111-1111-1111-1111-111111111111',
    'Lowe''s',
    'retail',
    NULL,
    NULL,
    NULL,
    'Multiple locations',
    'https://lowes.ca',
    'ON',
    'Good for appliances and lighting fixtures. Price match policy.',
    ARRAY['appliances', 'lighting', 'retail'],
    FALSE
),
-- Retail Vendor 3: Amazon
(
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'Amazon',
    'retail',
    NULL,
    NULL,
    NULL,
    'Online',
    'https://amazon.ca',
    'ON',
    'Tools, smart home devices, and misc supplies. Fast delivery.',
    ARRAY['tools', 'smart-home', 'online', 'retail'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE ESTIMATES
-- ============================================================================

-- Estimate for Elyse McCurdy Home Design
INSERT INTO estimates (
    id, project_id, vendor_id, vendor_ref, title, date, 
    estimated_total, status, notes, tags, is_archived
) VALUES 
(
    'aaaaaaaa-bbbb-1111-2222-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Elyse McCurdy
    'Quote #Q-445',
    'Kitchen Design - Phase 1',
    '2026-02-15',
    14500.00,
    'active',
    'Includes 3D renderings, cabinet layout, and material recommendations.',
    ARRAY['kitchen', 'phase-1'],
    FALSE
),
(
    'aaaaaaaa-bbbb-1111-2222-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Quote #Q-446',
    'Master Bathroom Design',
    '2026-02-20',
    8500.00,
    'active',
    'Full bathroom design with walk-in shower and freestanding tub.',
    ARRAY['bathroom', 'master'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Estimate for Premier Framing Solutions
INSERT INTO estimates (
    id, project_id, vendor_id, vendor_ref, title, date, 
    estimated_total, status, notes, tags, is_archived
) VALUES 
(
    'bbbbbbbb-cccc-2222-3333-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- Premier Framing
    'EST-2026-0892',
    'Complete House Framing',
    '2026-03-01',
    48750.00,
    'active',
    'Includes walls, floors, roof structure. Materials and labor included.',
    ARRAY['framing', 'full-house', 'structural'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Estimate for Voltex Electrical Services
INSERT INTO estimates (
    id, project_id, vendor_id, vendor_ref, title, date, 
    estimated_total, status, notes, tags, is_archived
) VALUES 
(
    'cccccccc-dddd-3333-4444-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc', -- Voltex
    'EL-2026-0341',
    'Electrical Rough-in and Finish',
    '2026-03-05',
    28500.00,
    'active',
    '200A panel upgrade, full rough-in, LED fixtures, smart switches.',
    ARRAY['electrical', 'panel', 'smart-home'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Estimate for Toitures Laurentides (Quebec vendor - QC tax)
INSERT INTO estimates (
    id, project_id, vendor_id, vendor_ref, title, date, 
    estimated_total, status, notes, tags, is_archived
) VALUES 
(
    'dddddddd-eeee-4444-5555-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd', -- Toitures
    'DEV-2026-0124',
    'Standing Seam Metal Roof',
    '2026-03-10',
    32500.00,
    'active',
    'Black standing seam metal roof with snow guards. 50-year warranty.',
    ARRAY['roofing', 'metal', 'exterior'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE RECEIPTS
-- ============================================================================

-- Receipts for Elyse McCurdy (Contract vendor with estimate linkage)
INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, created_by, notes, tags, is_archived
) VALUES 
-- Deposit for Kitchen Design
(
    'rec-kitchen-001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Elyse
    'aaaaaaaa-bbbb-1111-2222-aaaaaaaaaaaa', -- Kitchen Design estimate
    'INV-2026-0381',
    '2026-03-01',
    3850.00,
    192.50,   -- 5% of HST portion (500.00 * 5/13)
    308.00,   -- 8% of HST portion (500.00 * 8/13)
    4350.00,
    'deposit',
    'confirmed',
    NULL,
    '30% deposit for kitchen design phase 1',
    ARRAY['kitchen', 'deposit'],
    FALSE
),
-- Progress payment for Kitchen Design
(
    'rec-kitchen-002',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-bbbb-1111-2222-aaaaaaaaaaaa',
    'INV-2026-0422',
    '2026-03-15',
    5125.00,
    256.25,   -- HST federal portion
    410.00,   -- HST provincial portion
    5791.25,
    'progress',
    'confirmed',
    NULL,
    '40% progress payment - renderings delivered',
    ARRAY['kitchen', 'progress'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Receipts for Premier Framing
INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, created_by, notes, tags, is_archived
) VALUES 
-- Material deposit
(
    'rec-framing-001',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-cccc-2222-3333-bbbbbbbbbbbb',
    'F-2026-0156',
    '2026-03-10',
    15000.00,
    750.00,    -- 5% GST
    1200.00,   -- 8% PST
    16950.00,
    'deposit',
    'confirmed',
    NULL,
    '30% deposit for materials (lumber order placed)',
    ARRAY['framing', 'materials', 'deposit'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Receipts for Voltex Electrical (with inbox status for demo)
INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, created_by, notes, tags, is_archived
) VALUES 
-- Panel upgrade (already confirmed)
(
    'rec-elec-001',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    NULL, -- Not linked to specific estimate yet
    'VOLT-2026-0891',
    '2026-03-12',
    3800.00,
    190.00,
    304.00,
    4294.00,
    'additional',
    'confirmed',
    NULL,
    'Panel upgrade deposit - separate from main estimate',
    ARRAY['electrical', 'panel', 'deposit'],
    FALSE
),
-- Mobile capture sample (inbox status)
(
    'rec-elec-002-inbox',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    NULL,
    'VOLT-2026-0892',
    '2026-03-18',
    1250.00,
    62.50,
    100.00,
    1412.50,
    NULL,
    'inbox',
    NULL,
    'Rough-in progress payment - needs confirmation',
    ARRAY['electrical'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Receipts for Toitures Laurentides (Quebec vendor - GST + QST)
INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, created_by, notes, tags, is_archived
) VALUES 
-- Deposit (Quebec tax: 5% GST + 9.975% QST)
(
    'rec-roof-001',
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'dddddddd-eeee-4444-5555-dddddddddddd',
    'T-2026-0078',
    '2026-03-15',
    9750.00,
    487.50,    -- 5% GST
    972.56,    -- 9.975% QST
    11210.06,
    'deposit',
    'confirmed',
    NULL,
    '30% deposit - metal roofing materials ordered from Quebec',
    ARRAY['roofing', 'quebec', 'deposit'],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Retail receipts (no estimate linkage)
INSERT INTO receipts (
    id, project_id, vendor_id, estimate_id, vendor_ref, date, 
    subtotal, gst_amount, pst_amount, total, payment_type, 
    status, created_by, notes, tags, is_archived
) VALUES 
-- Home Depot purchases
(
    'rec-hd-001',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    NULL,
    'HOMEDEPOT-20260316-143022',
    '2026-03-16',
    254.35,
    12.72,    -- 5% of HST (33.08 * 5/13)
    20.36,    -- 8% of HST (33.08 * 8/13)
    287.43,
    NULL,
    'confirmed',
    NULL,
    'PEX fittings + shutoff valves for basement rough-in',
    ARRAY['plumbing', 'basement'],
    FALSE
),
(
    'rec-hd-002',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    NULL,
    'HOMEDEPOT-20260318-091233',
    '2026-03-18',
    445.80,
    22.29,
    35.66,
    503.75,
    NULL,
    'confirmed',
    NULL,
    '2x4 lumber and plywood sheathing',
    ARRAY['lumber', 'framing'],
    FALSE
),
-- Lowe's purchases
(
    'rec-lowes-001',
    '11111111-1111-1111-1111-111111111111',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    NULL,
    'LOWES-20260317-112455',
    '2026-03-17',
    289.99,
    14.50,
    23.20,
    327.69,
    NULL,
    'confirmed',
    NULL,
    'LED pot lights (6-pack)',
    ARRAY['lighting', 'electrical'],
    FALSE
),
-- Amazon purchase
(
    'rec-amz-001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    NULL,
    'AMZ-112-4455232-3321123',
    '2026-03-14',
    156.49,
    7.82,
    12.52,
    176.83,
    NULL,
    'confirmed',
    NULL,
    'Smart thermostat and doorbell',
    ARRAY['smart-home', 'thermostat'],
    FALSE
),
-- Inbox sample from mobile capture
(
    'rec-inbox-sample',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', -- Home Depot
    NULL,
    'HOMEDEPOT-20260320-165412',
    '2026-03-20',
    89.97,
    4.50,
    7.20,
    101.67,
    NULL,
    'inbox',
    NULL,
    'Captured on mobile - needs confirmation and tagging',
    ARRAY[],
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE DOCUMENTS
-- ============================================================================

-- Documents attached to estimates
INSERT INTO documents (
    id, project_id, vendor_id, estimate_id, receipt_id, display_name,
    original_file_name, storage_path, file_type, file_size_bytes,
    notes, tags
) VALUES 
-- Kitchen design document
(
    'doc-kitchen-001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-bbbb-1111-2222-aaaaaaaaaaaa',
    NULL,
    'Kitchen Design Quote - Phase 1',
    'Quote_Q-445_KitchenDesign.pdf',
    '11111111-1111-1111-1111-111111111111/estimates/aaaaaaaa-bbbb-1111-2222-aaaaaaaaaaaa/Quote_Q-445_KitchenDesign.pdf',
    'application/pdf',
    2456000,
    'Original signed quote from Elyse',
    ARRAY['quote', 'kitchen', 'signed']
),
-- Framing estimate document
(
    'doc-framing-001',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-cccc-2222-3333-bbbbbbbbbbbb',
    NULL,
    'Framing Estimate - Complete House',
    'EST-2026-0892_Framing.pdf',
    '11111111-1111-1111-1111-111111111111/estimates/bbbbbbbb-cccc-2222-3333-bbbbbbbbbbbb/EST-2026-0892_Framing.pdf',
    'application/pdf',
    1824000,
    'Detailed breakdown of framing costs',
    ARRAY['estimate', 'framing']
)
ON CONFLICT (id) DO NOTHING;

-- Documents attached to receipts
INSERT INTO documents (
    id, project_id, vendor_id, estimate_id, receipt_id, display_name,
    original_file_name, storage_path, file_type, file_size_bytes,
    notes, tags
) VALUES 
-- Kitchen deposit receipt
(
    'doc-kitchen-deposit',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    NULL,
    'rec-kitchen-001',
    'Kitchen Deposit Invoice',
    'IMG_4392.jpg',
    '11111111-1111-1111-1111-111111111111/receipts/rec-kitchen-001/IMG_4392.jpg',
    'image/jpeg',
    3245000,
    'Photo of invoice from Elyse',
    ARRAY['invoice', 'kitchen', 'deposit']
),
-- Home Depot receipt
(
    'doc-hd-001',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    NULL,
    'rec-hd-001',
    'PEX Fittings Receipt',
    'receipt_20260316_143022.jpg',
    '11111111-1111-1111-1111-111111111111/receipts/rec-hd-001/receipt_20260316_143022.jpg',
    'image/jpeg',
    1892000,
    'Original receipt from Home Depot',
    ARRAY['receipt', 'plumbing']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INSERT STATEMENTS FOR PROJECT MEMBERS
-- 
-- IMPORTANT: After running seed data, you need to create users in Supabase Auth
-- and then update project_members with their actual UUIDs.
-- 
-- Example (run after creating users):
-- INSERT INTO project_members (project_id, user_id, role)
-- VALUES ('11111111-1111-1111-1111-111111111111', 'actual-user-uuid-1', 'owner'),
--        ('11111111-1111-1111-1111-111111111111', 'actual-user-uuid-2', 'member');
-- ============================================================================

-- Note: Uncomment and run after setting up actual users in Supabase Auth
-- INSERT INTO project_members (project_id, user_id, role)
-- VALUES 
--     ('11111111-1111-1111-1111-111111111111', 'REPLACE_WITH_USER_1_UUID', 'owner'),
--     ('11111111-1111-1111-1111-111111111111', 'REPLACE_WITH_USER_2_UUID', 'member')
-- ON CONFLICT (project_id, user_id) DO NOTHING;

-- ============================================================================
-- VERIFY SEED DATA
-- Run these queries to verify the seed data was inserted correctly:
-- 
-- SELECT * FROM projects;
-- SELECT * FROM vendors ORDER BY type, name;
-- SELECT * FROM estimates ORDER BY date;
-- SELECT * FROM receipts ORDER BY date;
-- SELECT * FROM documents;
-- SELECT * FROM vendor_financial_summary ORDER BY vendor_name;
-- SELECT * FROM project_summary;
-- ============================================================================
