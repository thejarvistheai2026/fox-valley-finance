-- Migration: Update estimate_with_balance view to include hst_amount
-- Description: The view was created before hst_amount was added, so it doesn't include the column

DROP VIEW IF EXISTS public.estimate_with_balance;

CREATE OR REPLACE VIEW public.estimate_with_balance AS
SELECT
    e.*,
    COALESCE(
        (SELECT SUM(r.total)
         FROM receipts r
         WHERE r.estimate_id = e.id
           AND r.status = 'confirmed'
           AND NOT r.is_archived),
        0
    ) AS paid_to_date,
    e.estimated_total - COALESCE(
        (SELECT SUM(r.total)
         FROM receipts r
         WHERE r.estimate_id = e.id
           AND r.status = 'confirmed'
           AND NOT r.is_archived),
        0
    ) AS outstanding
FROM estimates e
WHERE NOT e.is_archived;

-- Grant permissions
GRANT SELECT ON public.estimate_with_balance TO authenticated;
GRANT SELECT ON public.estimate_with_balance TO anon;

COMMENT ON VIEW public.estimate_with_balance IS 'Estimates with computed paid_to_date and outstanding balance (includes hst_amount)';
