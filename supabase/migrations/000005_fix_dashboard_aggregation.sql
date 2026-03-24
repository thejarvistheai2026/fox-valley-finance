-- Migration: Fix dashboard functions to include all receipts
-- Description: Rewrites aggregation to include retail receipts and standalone receipts

DROP FUNCTION IF EXISTS public.get_dashboard_summary(DATE, DATE);
DROP FUNCTION IF EXISTS public.get_vendor_summaries(DATE, DATE);

-- Dashboard summary that includes ALL receipts (contract + retail)
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_estimated NUMERIC := 0;
    v_total_paid NUMERIC := 0;
    v_total_gst NUMERIC := 0;
    v_total_pst NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_vendor_count BIGINT := 0;
    v_receipt_count BIGINT := 0;
BEGIN
    -- Get total estimates from active contract vendors
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_total_estimated
    FROM estimates
    WHERE status = 'active' AND NOT is_archived;

    -- Get totals from ALL receipts (both linked to estimates AND retail standalone)
    SELECT
        COALESCE(SUM(total), 0),
        COALESCE(SUM(gst_amount), 0),
        COALESCE(SUM(pst_amount), 0),
        COALESCE(SUM(tax_total), 0),
        COUNT(*)
    INTO v_total_paid, v_total_gst, v_total_pst, v_total_tax, v_receipt_count
    FROM receipts
    WHERE (p_start_date IS NULL OR receipts.date >= p_start_date)
      AND (p_end_date IS NULL OR receipts.date <= p_end_date);

    -- Get active vendor count
    SELECT COUNT(*) INTO v_vendor_count
    FROM vendors WHERE NOT is_archived;

    -- Return the results
    RETURN QUERY SELECT
        v_total_estimated,
        v_total_paid,
        GREATEST(0, v_total_estimated - v_total_paid),
        v_total_gst,
        v_total_pst,
        v_total_tax,
        v_vendor_count,
        v_receipt_count;
END;
$$;

-- Vendor summaries that properly aggregates both estimates and receipts
CREATE OR REPLACE FUNCTION public.get_vendor_summaries(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        -- Estimated total (sum of active estimates for this vendor)
        COALESCE((
            SELECT SUM(e.estimated_total)
            FROM estimates e
            WHERE e.vendor_id = v.id
              AND e.status = 'active'
              AND NOT e.is_archived
        ), 0) as estimated_total,
        -- Paid total (sum of ALL receipts for this vendor)
        COALESCE((
            SELECT SUM(r.total)
            FROM receipts r
            WHERE r.vendor_id = v.id
              AND (p_start_date IS NULL OR r.date >= p_start_date)
              AND (p_end_date IS NULL OR r.date <= p_end_date)
        ), 0) as paid_total,
        -- Outstanding (estimated - paid, but not below 0)
        GREATEST(0, COALESCE((
            SELECT SUM(e.estimated_total)
            FROM estimates e
            WHERE e.vendor_id = v.id
              AND e.status = 'active'
              AND NOT e.is_archived
        ), 0) - COALESCE((
            SELECT SUM(r.total)
            FROM receipts r
            WHERE r.vendor_id = v.id
              AND (p_start_date IS NULL OR r.date >= p_start_date)
              AND (p_end_date IS NULL OR r.date <= p_end_date)
        ), 0)) as outstanding,
        -- Tax totals from receipts
        COALESCE((
            SELECT SUM(r.gst_amount)
            FROM receipts r
            WHERE r.vendor_id = v.id
              AND (p_start_date IS NULL OR r.date >= p_start_date)
              AND (p_end_date IS NULL OR r.date <= p_end_date)
        ), 0) as gst_total,
        COALESCE((
            SELECT SUM(r.pst_amount)
            FROM receipts r
            WHERE r.vendor_id = v.id
              AND (p_start_date IS NULL OR r.date >= p_start_date)
              AND (p_end_date IS NULL OR r.date <= p_end_date)
        ), 0) as pst_total,
        COALESCE((
            SELECT SUM(r.tax_total)
            FROM receipts r
            WHERE r.vendor_id = v.id
              AND (p_start_date IS NULL OR r.date >= p_start_date)
              AND (p_end_date IS NULL OR r.date <= p_end_date)
        ), 0) as tax_total
    FROM vendors v
    WHERE NOT v.is_archived
    ORDER BY v.name;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vendor_summaries(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION public.get_vendor_summaries(DATE, DATE) TO anon;
