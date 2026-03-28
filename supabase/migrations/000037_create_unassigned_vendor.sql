-- Migration: Create an "Unassigned" vendor for mobile receipt captures
-- Mobile receipts get captured before a vendor is known, then assigned on web app

-- Insert the unassigned vendor
INSERT INTO vendors (id, name, type, project_id, is_archived)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Unassigned',
  'retail',
  '11111111-1111-1111-1111-111111111111',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Update the anonymous receipt policy to allow this specific vendor
COMMENT ON POLICY "Allow anonymous inbox receipts" ON receipts IS
  'Mobile app captures receipts without auth - assigned to Unassigned vendor, triaged on web app';
