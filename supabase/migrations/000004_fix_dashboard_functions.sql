-- Migration: Fix dashboard RPC functions
-- Description: Drop and recreate functions to ensure they exist

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_dashboard_summary(DATE, DATE);
DROP FUNCTION IF EXISTS get_vendor_summaries(DATE, DATE);

-- Create dashboard summary function with explicit schema
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
         WHERE ($1 IS NULL OR receipts.date >= $1)
           AND ($2 IS NULL OR receipts.date <= $2)) as receipt_count
    FROM estimates e
    LEFT JOIN receipts r ON r.estimate_id = e.id
    WHERE e.status = 'active'
      AND NOT e.is_archived;
END;
$$;

-- Create vendor summaries function
CREATE OR REPLACE FUNCTION public.get_vendor_summaries(
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
        COALESCE(ven.estimated_total, 0) as estimated_total,
        COALESCE(vpay.paid_total, 0) as paid_total,
        COALESCE(ven.estimated_total, 0) - COALESCE(vpay.paid_total, 0) as outstanding,
        COALESCE(vpay.gst_total, 0) as gst_total,
        COALESCE(vpay.pst_total, 0) as pst_total,
        COALESCE(vpay.tax_total, 0) as tax_total
    FROM vendors v
    LEFT JOIN (
        SELECT e.vendor_id, SUM(e.estimated_total) as estimated_total
        FROM estimates e
        WHERE e.status = 'active' AND NOT e.is_archived
        GROUP BY e.vendor_id
    ) ven ON ven.vendor_id = v.id
    LEFT JOIN (
        SELECT
            r.vendor_id,
            SUM(r.total) as paid_total,
            SUM(r.gst_amount) as gst_total,
            SUM(r.pst_amount) as pst_total,
            SUM(r.tax_total) as tax_total
        FROM receipts r
        WHERE ($1 IS NULL OR r.date >= $1)
          AND ($2 IS NULL OR r.date <= $2)
        GROUP BY r.vendor_id
    ) vpay ON vpay.vendor_id = v.id
    WHERE NOT v.is_archived
    ORDER BY v.name;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_vendor_summaries(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION public.get_vendor_summaries(DATE, DATE) TO anon;
