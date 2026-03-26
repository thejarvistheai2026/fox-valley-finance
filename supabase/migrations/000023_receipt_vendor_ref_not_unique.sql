-- Migration: Remove unique constraint on receipts.vendor_ref
-- Description: Allow multiple receipts to share the same vendor reference number

-- Drop the existing unique constraint on receipts (vendor_id, vendor_ref)
-- This allows multiple receipts to have the same vendor reference number
-- which is needed when a vendor reference spans multiple receipts (e.g., deposit + final payment)

DO $$
BEGIN
    -- Check if the constraint exists before trying to drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'receipts_vendor_id_vendor_ref_key'
        AND conrelid = 'receipts'::regclass
    ) THEN
        ALTER TABLE receipts DROP CONSTRAINT receipts_vendor_id_vendor_ref_key;
    END IF;
END $$;

-- Add a comment explaining the change
COMMENT ON TABLE receipts IS 'Receipts table - vendor_ref is no longer unique per vendor, allowing multiple receipts with the same reference';
