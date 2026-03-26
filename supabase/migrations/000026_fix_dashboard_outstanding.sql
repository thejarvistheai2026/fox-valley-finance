-- Migration: Fix dashboard outstanding calculation
-- Description: Only count receipts linked to active estimates when calculating outstanding
-- This fixes the issue where completing an estimate causes outstanding to show $0

DROP FUNCTION IF EXISTS public.get_dashboard_summary(DATE, DATE);

CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_estimated NUMERIC,
    current_total_estimate NUMERIC,
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
    v_current_total_estimate NUMERIC := 0;
    v_total_paid NUMERIC := 0;
    v_total_gst NUMERIC := 0;
    v_total_pst NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_completed_estimates_hst NUMERIC := 0;
    v_vendor_count BIGINT := 0;
    v_receipt_count BIGINT := 0;
BEGIN
    -- Get total estimates from draft + active contract vendors
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_total_estimated
    FROM estimates
    WHERE status IN ('draft', 'active') AND NOT is_archived;

    -- Get current total estimate (active only, not draft)
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_current_total_estimate
    FROM estimates
    WHERE status = 'active' AND NOT is_archived;

    -- Get totals from receipts linked to ACTIVE estimates (for outstanding calculation)
    -- This excludes receipts linked to completed estimates
    SELECT
        COALESCE(SUM(r.total), 0),
        COALESCE(SUM(r.gst_amount), 0),
        COALESCE(SUM(r.pst_amount), 0),
        COALESCE(SUM(r.tax_total), 0),
        COUNT(*)
    INTO v_total_paid, v_total_gst, v_total_pst, v_total_tax, v_receipt_count
    FROM receipts r
    LEFT JOIN estimates e ON r.estimate_id = e.id
    WHERE (p_start_date IS NULL OR r.date >= p_start_date)
      AND (p_end_date IS NULL OR r.date <= p_end_date)
      AND (
          -- Include receipts with no estimate (unlinked retail receipts)
          r.estimate_id IS NULL
          OR
          -- Include receipts linked to active estimates only
          (r.estimate_id IS NOT NULL AND e.status = 'active')
      );

    -- Get HST from completed estimates (stored hst_amount field)
    SELECT COALESCE(SUM(hst_amount), 0)
    INTO v_completed_estimates_hst
    FROM estimates
    WHERE status = 'completed'
      AND NOT is_archived;

    -- Add completed estimate HST to total tax
    v_total_tax := v_total_tax + v_completed_estimates_hst;
    v_total_gst := v_total_gst + v_completed_estimates_hst;

    -- Get active vendor count
    SELECT COUNT(*) INTO v_vendor_count
    FROM vendors WHERE NOT is_archived;

    -- Return the results
    RETURN QUERY SELECT
        v_total_estimated,
        v_current_total_estimate,
        v_total_paid,
        GREATEST(0, v_current_total_estimate - v_total_paid),
        v_total_gst,
        v_total_pst,
        v_total_tax,
        v_vendor_count,
        v_receipt_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(DATE, DATE) TO anon;
