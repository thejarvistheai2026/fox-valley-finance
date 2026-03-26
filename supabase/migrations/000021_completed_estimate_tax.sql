-- Migration: Include tax from completed estimates in dashboard summary
-- Description: When an estimate is marked as 'completed', its tax portion is now counted toward total HST paid

DROP FUNCTION IF EXISTS public.get_dashboard_summary(DATE, DATE);

-- Dashboard summary with tax from completed estimates
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
    v_completed_estimates_tax NUMERIC := 0;  -- Tax from completed estimates
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

    -- Get totals from ALL receipts
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

    -- Calculate tax from completed estimates
    -- Based on vendor tax province: ON = 13% HST, QC = 5% GST + 9.975% QST = 14.975%
    SELECT COALESCE(SUM(
        CASE
            WHEN v.tax_province = 'ON' THEN e.estimated_total - (e.estimated_total / 1.13)
            WHEN v.tax_province = 'QC' THEN e.estimated_total - (e.estimated_total / 1.14975)
            ELSE e.estimated_total - (e.estimated_total / 1.13)  -- Default to ON rate
        END
    ), 0)
    INTO v_completed_estimates_tax
    FROM estimates e
    JOIN vendors v ON e.vendor_id = v.id
    WHERE e.status = 'completed'
      AND NOT e.is_archived;

    -- Add completed estimate tax to total tax
    v_total_tax := v_total_tax + v_completed_estimates_tax;

    -- For simplicity, add all completed estimate tax to GST (since we don't separate HST/QST for estimates)
    v_total_gst := v_total_gst + v_completed_estimates_tax;

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
