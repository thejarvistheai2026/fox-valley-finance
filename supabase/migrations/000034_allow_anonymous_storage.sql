-- Migration: Allow anonymous uploads to storage for mobile app receipt capture

-- Allow anonymous users to upload to documents bucket
CREATE POLICY "Allow anonymous storage uploads"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'documents');

-- Allow anonymous users to read from documents bucket
CREATE POLICY "Allow anonymous storage select"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'documents');
