-- Migration: Make vendor_id optional in documents table for mobile uploads
-- The mobile app uploads receipts before a vendor is assigned

-- Make vendor_id nullable
ALTER TABLE documents ALTER COLUMN vendor_id DROP NOT NULL;

-- Update the documents RLS policy to allow anonymous inserts without vendor_id
DROP POLICY IF EXISTS "Allow anonymous document uploads" ON documents;
CREATE POLICY "Allow anonymous document uploads"
  ON documents
  FOR INSERT
  TO anon
  WITH CHECK (true);
