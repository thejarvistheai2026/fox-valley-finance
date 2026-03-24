-- Migration: Fix function overloading by using single signature
-- Description: Drops all overloaded versions and creates single functions

-- Drop all versions of the functions
DROP FUNCTION IF EXISTS public.get_dashboard_summary();
DROP FUNCTION IF EXISTS public.get_dashboard_summary(DATE, DATE);
DROP FUNCTION IF EXISTS public.get_dashboard_summary(p_start_date DATE, p_end_date DATE);

DROP FUNCTION IF EXISTS public.get_vendor_summaries();
DROP FUNCTION IF EXISTS public.get_vendor_summaries(DATE, DATE);
DROP FUNCTION IF EXISTS public.get_vendor_summaries(p_start_date DATE, p_end_date DATE);

-- Create single dashboard function with JSON parameter for date range
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
    p_date_range JSONB DEFAULT NULL
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
    v_start_date DATE;
    v_end_date DATE;
    v_total_estimated NUMERIC := 0;
    v_total_paid NUMERIC := 0;
    v_total_gst NUMERIC := 0;
    v_total_pst NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_vendor_count BIGINT := 0;
    v_receipt_count BIGINT := 0;
BEGIN
    -- Extract dates from JSON parameter
    IF p_date_range IS NOT NULL THEN
        v_start_date := (p_date_range->>'start')::DATE;
        v_end_date := (p_date_range->>'end')::DATE;
    END IF;

    -- Get total estimates from active contract vendors
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_total_estimated
    FROM estimates
    WHERE status = 'active' AND NOT is_archived;

    -- Get totals from ALL receipts
    SELECT
        COALESCE(SUM(total), 0),
        COALESCE(SUM(gst_amount), 0),
        COALESCE(SUM(pst_amount), 0),
        COALESCE(SUM(tax_total), 0),
        COUNT(*)
    INTO v_total_paid, v_total_gst, v_total_pst, v_total_tax, v_receipt_count
    FROM receipts
    WHERE (v_start_date IS NULL OR receipts.date >= v_start_date)
      AND (v_end_date IS NULL OR receipts.date <= v_end_date);

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

-- Create single vendor summaries function
CREATE OR REPLACE FUNCTION public.get_vendor_summaries(
    p_date_range JSONB DEFAULT NULL
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
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Extract dates from JSON parameter
    IF p_date_range IS NOT NULL THEN
        v_start_date := (p_date_range->>'start')::DATE;
        v_end_date := (p_date_range->>'end')::DATE;
    END IF;

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
        COALESCE((
            SELECT SUM(e.estimated_total)
            FROM estimates e
            WHERE e.vendor_id = v.id
              AND e.status = 'active'
              AND NOT e.is_archived
        ), 0) as estimated_total,
        COALESCE((
            SELECT SUM(r.total)
            FROM receipts r
            WHERE r.vendor_id = v.id
              AND (v_start_date IS NULL OR r.date >= v_start_date)
              AND (v_end_date IS NULL OR r.date <= v_end_date)
        ), 0) as paid_total,
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
              AND (v_start_date IS NULL OR r.date >= v_start_date)
              AND (v_end_date IS NULL OR r.date <= v_end_date)
        ), 0)) as outstanding,
        COALESCE((
            SELECT SUM(r.gst_amount)
            FROM receipts r
            WHERE r.vendor_id = v.id
              AND (v_start_date IS NULL OR r.date >= v_start_date)
              AND (v_end_date IS NULL OR r.date <= v_end_date)
        ), 0) as gst_total,
        COALESCE((
            SELECT SUM(r.pst_amount)
            FROM receipts r
            WHERE r.vendor_id = v.id
              AND (v_start_date IS NULL OR r.date >= v_start_date)
              AND (v_end_date IS NULL OR r.date <= v_end_date)
        ), 0) as pst_total,
        COALESCE((
            SELECT SUM(r.tax_total)
            FROM receipts r
            WHERE r.vendor_id = v.id
              AND (v_start_date IS NULL OR r.date >= v_start_date)
              AND (v_end_date IS NULL OR r.date <= v_end_date)
        ), 0) as tax_total
    FROM vendors v
    WHERE NOT v.is_archived
    ORDER BY v.name;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vendor_summaries(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.get_vendor_summaries(JSONB) TO anon;
