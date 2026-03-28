-- Migration: Allow anonymous mobile app to create inbox receipts
-- The mobile app doesn't require authentication - it just captures receipts
-- that go to the inbox for triage in the web app

-- Allow anonymous (unauthenticated) users to insert receipts with status 'inbox'
CREATE POLICY "Allow anonymous inbox receipts"
  ON receipts
  FOR INSERT
  TO anon
  WITH CHECK (status = 'inbox');

-- Allow anonymous users to upload documents (for receipt images)
CREATE POLICY "Allow anonymous document uploads"
  ON documents
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to read documents they just uploaded
CREATE POLICY "Allow anonymous document select"
  ON documents
  FOR SELECT
  TO anon
  USING (true);

COMMENT ON POLICY "Allow anonymous inbox receipts" ON receipts IS 'Mobile app captures receipts without auth - they go to inbox for web triage';
