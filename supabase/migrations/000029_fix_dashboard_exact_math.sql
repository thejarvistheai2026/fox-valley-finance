-- Migration: Fix dashboard calculations per user exact specifications
-- Description: Complete rewrite to match simple, consistent math rules

DROP FUNCTION IF EXISTS public.get_dashboard_summary(DATE, DATE);

CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_estimated NUMERIC,              -- Card 1: All draft + active estimates
    current_total_estimate NUMERIC,     -- Card 2: Active estimates only
    total_paid NUMERIC,                 -- Card 3: Receipts linked to ACTIVE estimates
    total_outstanding NUMERIC,            -- Card 4: In-Progress minus receipts to active
    total_individual_receipts NUMERIC,  -- Card 5: Receipts NOT linked to estimates
    total_hst_individual_receipts NUMERIC, -- Card 6: HST from individual receipts
    total_hst_estimates NUMERIC,        -- Card 7: HST from completed estimates
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
    v_total_outstanding NUMERIC := 0;
    v_individual_receipts_total NUMERIC := 0;
    v_hst_individual_receipts NUMERIC := 0;
    v_hst_estimates NUMERIC := 0;
    v_total_gst NUMERIC := 0;
    v_total_pst NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_vendor_count BIGINT := 0;
    v_receipt_count BIGINT := 0;
BEGIN
    -- Card 1: Total - All Estimates (draft + active)
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_total_estimated
    FROM estimates
    WHERE status IN ('draft', 'active') AND NOT is_archived;

    -- Card 2: Total - In-Progress (active estimates only)
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_current_total_estimate
    FROM estimates
    WHERE status = 'active' AND NOT is_archived;

    -- Card 3: Total Paid = receipts linked to ACTIVE estimates only
    SELECT
        COALESCE(SUM(total), 0),
        COALESCE(SUM(gst_amount), 0),
        COALESCE(SUM(pst_amount), 0),
        COALESCE(SUM(tax_total), 0),
        COUNT(*)
    INTO v_total_paid, v_total_gst, v_total_pst, v_total_tax, v_receipt_count
    FROM receipts r
    JOIN estimates e ON r.estimate_id = e.id
    WHERE (p_start_date IS NULL OR r.date >= p_start_date)
      AND (p_end_date IS NULL OR r.date <= p_end_date)
      AND e.status = 'active'  -- Only receipts linked to active/in-progress estimates
      AND NOT e.is_archived;

    -- Card 4: Outstanding = In-Progress Total - Total Paid
    v_total_outstanding := GREATEST(0, v_current_total_estimate - v_total_paid);

    -- Card 5: Total - Individual Receipts (not linked to estimates)
    -- Card 6: Total - HST Individual Receipts (HST from those receipts)
    SELECT
        COALESCE(SUM(total), 0),
        COALESCE(SUM(tax_total), 0)
    INTO v_individual_receipts_total, v_hst_individual_receipts
    FROM receipts r
    WHERE (p_start_date IS NULL OR r.date >= p_start_date)
      AND (p_end_date IS NULL OR r.date <= p_end_date)
      AND r.estimate_id IS NULL;  -- Only receipts NOT linked to estimates

    -- Card 7: Total - HST Estimates (from completed estimates)
    SELECT COALESCE(SUM(hst_amount), 0)
    INTO v_hst_estimates
    FROM estimates
    WHERE status = 'completed'
      AND NOT is_archived;

    -- Get active vendor count
    SELECT COUNT(*) INTO v_vendor_count
    FROM vendors WHERE NOT is_archived;

    -- Return all 7 cards
    RETURN QUERY SELECT
        v_total_estimated,
        v_current_total_estimate,
        v_total_paid,
        v_total_outstanding,
        v_individual_receipts_total,
        v_hst_individual_receipts,
        v_hst_estimates,
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
