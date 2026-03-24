-- Migration: Add dashboard RPC functions and vendor website field
-- Description: Creates functions to calculate dashboard summary data

-- ============================================================================
-- FUNCTION: Get Dashboard Summary
-- Returns aggregated financial data for the dashboard
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_summary(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_estimated NUMERIC,
    total_paid NUMERIC,
    total_outstanding NUMERIC,
    total_gst NUMERIC,
    total_pst NUMERIC,
    total_tax NUMERIC,
    vendor_count BIGINT,
    receipt_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(e.estimated_total), 0) as total_estimated,
        COALESCE(SUM(r.total), 0) as total_paid,
        COALESCE(SUM(e.estimated_total) - COALESCE(SUM(r.total), 0), 0) as total_outstanding,
        COALESCE(SUM(r.gst_amount), 0) as total_gst,
        COALESCE(SUM(r.pst_amount), 0) as total_pst,
        COALESCE(SUM(r.tax_total), 0) as total_tax,
        (SELECT COUNT(*) FROM vendors WHERE NOT is_archived) as vendor_count,
        (SELECT COUNT(*) FROM receipts
         WHERE (start_date IS NULL OR receipts.date >= start_date)
           AND (end_date IS NULL OR receipts.date <= end_date)) as receipt_count
    FROM estimates e
    LEFT JOIN receipts r ON r.estimate_id = e.id
    WHERE e.status = 'active'
      AND NOT e.is_archived;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get Vendor Summaries
-- Returns per-vendor financial aggregations
-- ============================================================================

CREATE OR REPLACE FUNCTION get_vendor_summaries(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    display_id TEXT,
    project_id UUID,
    name TEXT,
    type TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    contact_name TEXT,
    notes TEXT,
    tags TEXT[],
    tax_province TEXT,
    is_archived BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    estimated_total NUMERIC,
    paid_total NUMERIC,
    outstanding NUMERIC,
    gst_total NUMERIC,
    pst_total NUMERIC,
    tax_total NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.display_id,
        v.project_id,
        v.name,
        v.type,
        v.email,
        v.phone,
        v.website,
        v.address,
        v.contact_name,
        v.notes,
        v.tags,
        v.tax_province,
        v.is_archived,
        v.created_at,
        v.updated_at,
        COALESCE(ven.estimated_total, 0) as estimated_total,
        COALESCE(vpay.paid_total, 0) as paid_total,
        COALESCE(ven.estimated_total, 0) - COALESCE(vpay.paid_total, 0) as outstanding,
        COALESCE(vpay.gst_total, 0) as gst_total,
        COALESCE(vpay.pst_total, 0) as pst_total,
        COALESCE(vpay.tax_total, 0) as tax_total
    FROM vendors v
    LEFT JOIN (
        -- Calculate estimated totals per vendor
        SELECT
            e.vendor_id,
            SUM(e.estimated_total) as estimated_total
        FROM estimates e
        WHERE e.status = 'active'
          AND NOT e.is_archived
        GROUP BY e.vendor_id
    ) ven ON ven.vendor_id = v.id
    LEFT JOIN (
        -- Calculate paid totals per vendor
        SELECT
            r.vendor_id,
            SUM(r.total) as paid_total,
            SUM(r.gst_amount) as gst_total,
            SUM(r.pst_amount) as pst_total,
            SUM(r.tax_total) as tax_total
        FROM receipts r
        WHERE (start_date IS NULL OR r.date >= start_date)
          AND (end_date IS NULL OR r.date <= end_date)
        GROUP BY r.vendor_id
    ) vpay ON vpay.vendor_id = v.id
    WHERE NOT v.is_archived
    ORDER BY v.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get Vendor Summary (single vendor)
-- Returns financial summary for a specific vendor
-- ============================================================================

CREATE OR REPLACE FUNCTION get_vendor_summary(p_vendor_id UUID)
RETURNS TABLE (
    estimated_total NUMERIC,
    paid_total NUMERIC,
    outstanding NUMERIC,
    gst_total NUMERIC,
    pst_total NUMERIC,
    tax_total NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(e.estimated_total), 0) as estimated_total,
        COALESCE(SUM(r.total), 0) as paid_total,
        COALESCE(SUM(e.estimated_total) - COALESCE(SUM(r.total), 0), 0) as outstanding,
        COALESCE(SUM(r.gst_amount), 0) as gst_total,
        COALESCE(SUM(r.pst_amount), 0) as pst_total,
        COALESCE(SUM(r.tax_total), 0) as tax_total
    FROM estimates e
    LEFT JOIN receipts r ON r.estimate_id = e.id
    WHERE e.vendor_id = p_vendor_id
      AND e.status = 'active'
      AND NOT e.is_archived;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
