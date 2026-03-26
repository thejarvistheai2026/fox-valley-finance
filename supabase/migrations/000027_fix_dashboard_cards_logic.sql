-- Migration: Fix dashboard calculations to match expected business logic
-- Description:
-- 1. Total Estimated: All draft + active estimates (their total value)
-- 2. In-Progress Total: Only active estimates (their total value)
-- 3. Total Paid: ALL receipts linked to ANY estimate (complete payment history)
-- 4. Outstanding: In-Progress Total - receipts linked to active estimates
-- 5. HST Paid: HST from completed estimates (stored hst_amount)

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
    v_paid_to_active NUMERIC := 0;
    v_total_gst NUMERIC := 0;
    v_total_pst NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_completed_estimates_hst NUMERIC := 0;
    v_vendor_count BIGINT := 0;
    v_receipt_count BIGINT := 0;
BEGIN
    -- Card 1: Total Estimated = draft + active estimates
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_total_estimated
    FROM estimates
    WHERE status IN ('draft', 'active') AND NOT is_archived;

    -- Card 2: In-Progress Total = active estimates only
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_current_total_estimate
    FROM estimates
    WHERE status = 'active' AND NOT is_archived;

    -- Card 3: Total Paid = ALL receipts linked to ANY estimate
    -- This represents complete payment history across all estimates
    SELECT
        COALESCE(SUM(total), 0),
        COALESCE(SUM(gst_amount), 0),
        COALESCE(SUM(pst_amount), 0),
        COALESCE(SUM(tax_total), 0),
        COUNT(*)
    INTO v_total_paid, v_total_gst, v_total_pst, v_total_tax, v_receipt_count
    FROM receipts r
    WHERE (p_start_date IS NULL OR r.date >= p_start_date)
      AND (p_end_date IS NULL OR r.date <= p_end_date)
      AND r.estimate_id IS NOT NULL;  -- Only receipts linked to estimates

    -- Calculate payments specifically to active estimates (for outstanding)
    SELECT COALESCE(SUM(r.total), 0)
    INTO v_paid_to_active
    FROM receipts r
    JOIN estimates e ON r.estimate_id = e.id
    WHERE (p_start_date IS NULL OR r.date >= p_start_date)
      AND (p_end_date IS NULL OR r.date <= p_end_date)
      AND e.status = 'active'
      AND NOT e.is_archived;

    -- Card 5: HST Paid = from completed estimates (stored hst_amount)
    -- This represents tax from finished work
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

    -- Card 4: Outstanding = In-Progress Total - Paid to Active Estimates
    -- Only count receipts linked to active estimates against outstanding

    -- Return the results
    RETURN QUERY SELECT
        v_total_estimated,
        v_current_total_estimate,
        v_total_paid,
        GREATEST(0, v_current_total_estimate - v_paid_to_active),
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
