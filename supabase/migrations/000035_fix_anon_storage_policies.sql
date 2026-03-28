-- Migration: Fix anonymous storage policies for mobile app

-- Drop the old authenticated-only policy if it exists
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Create a new policy that allows both authenticated and anonymous uploads
CREATE POLICY "Allow uploads"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'documents');

-- Allow public reads
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
CREATE POLICY "Allow reads"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'documents');

-- Allow deletes for authenticated users only
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
CREATE POLICY "Allow deletes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');
