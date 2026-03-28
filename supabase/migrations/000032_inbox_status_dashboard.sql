-- Migration: Update dashboard functions to exclude inbox receipts
-- Inbox receipts should not count toward financial totals until confirmed

-- Update the dashboard summary function to only count confirmed receipts
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    -- Section 1: Budget (drafts - always all drafts, ignores date filter)
    total_draft_estimates NUMERIC,

    -- Section 2: Active cash flow
    total_active_estimates NUMERIC,      -- In-progress card
    total_paid_active NUMERIC,           -- Paid card (receipts to active estimates)
    total_outstanding NUMERIC,           -- Outstanding card

    -- Section 3: Total spend & tax
    total_completed_estimates NUMERIC,   -- Completed estimates card (respects date filter)
    total_individual_receipts NUMERIC,   -- Misc receipts card
    total_hst_completed NUMERIC,         -- HST from completed estimates
    total_hst_individual NUMERIC,        -- HST from unlinked receipts

    -- Extra fields for compatibility
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
    -- Section 1: Budget
    v_total_draft_estimates NUMERIC := 0;

    -- Section 2: Active cash flow
    v_total_active_estimates NUMERIC := 0;
    v_total_paid_active NUMERIC := 0;
    v_total_outstanding NUMERIC := 0;

    -- Section 3: Total spend & tax
    v_total_completed_estimates NUMERIC := 0;
    v_total_individual_receipts NUMERIC := 0;
    v_total_hst_completed NUMERIC := 0;
    v_total_hst_individual NUMERIC := 0;

    -- Extra fields
    v_total_gst NUMERIC := 0;
    v_total_pst NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_vendor_count BIGINT := 0;
    v_receipt_count BIGINT := 0;
BEGIN
    -- Section 1: Budget - Draft estimates (always all drafts, ignores date filter)
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_total_draft_estimates
    FROM estimates
    WHERE status = 'draft' AND NOT is_archived;

    -- Section 2: Active cash flow - Active estimates (ignores date filter per PRD)
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_total_active_estimates
    FROM estimates
    WHERE status = 'active' AND NOT is_archived;

    -- Section 2: Paid - Receipts linked to ACTIVE estimates (respects date filter)
    -- Only count CONFIRMED receipts, not inbox
    SELECT
        COALESCE(SUM(r.total), 0),
        COALESCE(SUM(r.gst_amount), 0),
        COALESCE(SUM(r.pst_amount), 0),
        COALESCE(SUM(r.tax_total), 0),
        COUNT(*)
    INTO v_total_paid_active, v_total_gst, v_total_pst, v_total_tax, v_receipt_count
    FROM receipts r
    JOIN estimates e ON r.estimate_id = e.id
    WHERE (p_start_date IS NULL OR r.date >= p_start_date)
      AND (p_end_date IS NULL OR r.date <= p_end_date)
      AND e.status = 'active'
      AND NOT e.is_archived
      AND r.status = 'confirmed';  -- Exclude inbox receipts

    -- Section 2: Outstanding = Active estimates - Paid
    v_total_outstanding := GREATEST(0, v_total_active_estimates - v_total_paid_active);

    -- Section 3: Completed estimates (respects date filter)
    SELECT COALESCE(SUM(estimated_total), 0)
    INTO v_total_completed_estimates
    FROM estimates
    WHERE (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
      AND status = 'completed'
      AND NOT is_archived;

    -- Section 3: Misc receipts - not linked to estimates (respects date filter)
    -- Only count CONFIRMED receipts, not inbox
    SELECT
        COALESCE(SUM(total), 0),
        COALESCE(SUM(tax_total), 0)
    INTO v_total_individual_receipts, v_total_hst_individual
    FROM receipts
    WHERE (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
      AND estimate_id IS NULL
      AND status = 'confirmed';  -- Exclude inbox receipts

    -- Section 3: HST from completed estimates (respects date filter)
    SELECT COALESCE(SUM(hst_amount), 0)
    INTO v_total_hst_completed
    FROM estimates
    WHERE (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
      AND status = 'completed'
      AND NOT is_archived;

    -- Get active vendor count
    SELECT COUNT(*) INTO v_vendor_count
    FROM vendors WHERE NOT is_archived;

    -- Return all values
    RETURN QUERY SELECT
        v_total_draft_estimates,
        v_total_active_estimates,
        v_total_paid_active,
        v_total_outstanding,
        v_total_completed_estimates,
        v_total_individual_receipts,
        v_total_hst_completed,
        v_total_hst_individual,
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

-- Drop and recreate vendor_financial_summary view to exclude inbox receipts
DROP VIEW IF EXISTS vendor_financial_summary;

CREATE VIEW vendor_financial_summary AS
SELECT
    v.id AS vendor_id,
    v.project_id,
    v.type AS vendor_type,
    v.name AS vendor_name,
    v.display_id AS vendor_display_id,

    -- Total estimated (Contract vendors only, active estimates)
    COALESCE(
        (SELECT SUM(e.estimated_total)
         FROM estimates e
         WHERE e.vendor_id = v.id
           AND e.status = 'active'
           AND NOT e.is_archived),
        0
    ) AS total_estimated,

    -- Total paid (confirmed receipts only - exclude inbox)
    COALESCE(
        (SELECT SUM(r.total)
         FROM receipts r
         WHERE r.vendor_id = v.id
           AND r.status = 'confirmed'
           AND NOT r.is_archived),
        0
    ) AS total_paid,

    -- GST total (confirmed only)
    COALESCE(
        (SELECT SUM(r.gst_amount)
         FROM receipts r
         WHERE r.vendor_id = v.id
           AND r.status = 'confirmed'
           AND NOT r.is_archived),
        0
    ) AS total_gst,

    -- PST total (confirmed only)
    COALESCE(
        (SELECT SUM(r.pst_amount)
         FROM receipts r
         WHERE r.vendor_id = v.id
           AND r.status = 'confirmed'
           AND NOT r.is_archived),
        0
    ) AS total_pst,

    -- Outstanding balance
    COALESCE(
        (SELECT SUM(e.estimated_total)
         FROM estimates e
         WHERE e.vendor_id = v.id
           AND e.status = 'active'
           AND NOT e.is_archived),
        0
    ) - COALESCE(
        (SELECT SUM(r.total)
         FROM receipts r
         WHERE r.vendor_id = v.id
           AND r.status = 'confirmed'
           AND NOT r.is_archived
           AND r.estimate_id IS NOT NULL),
        0
    ) AS outstanding_balance
FROM vendors v
WHERE NOT v.is_archived;
