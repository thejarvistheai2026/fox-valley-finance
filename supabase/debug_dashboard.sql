-- Debug: Check what's in the database
-- Run this in Supabase SQL Editor to verify data exists

-- Check vendors count
SELECT 'Vendors' as table_name, COUNT(*) as count FROM vendors WHERE NOT is_archived
UNION ALL
SELECT 'Estimates', COUNT(*) FROM estimates WHERE status = 'active' AND NOT is_archived
UNION ALL
SELECT 'Receipts', COUNT(*) FROM receipts;

-- Check estimates with their totals
SELECT
    e.display_id,
    e.title,
    v.name as vendor_name,
    e.estimated_total,
    e.status
FROM estimates e
JOIN vendors v ON v.id = e.vendor_id
WHERE e.status = 'active' AND NOT e.is_archived
LIMIT 5;

-- Check receipts with totals
SELECT
    r.display_id,
    r.total,
    r.date,
    v.name as vendor_name
FROM receipts r
JOIN vendors v ON v.id = r.vendor_id
LIMIT 5;

-- Test the dashboard function directly
SELECT * FROM get_dashboard_summary();

-- Test vendor summaries
SELECT name, estimated_total, paid_total, outstanding
FROM get_vendor_summaries()
WHERE estimated_total > 0 OR paid_total > 0
LIMIT 5;
