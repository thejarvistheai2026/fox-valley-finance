-- Fix storage policies to allow public read access
-- The bucket is public but policies were restricting access

-- First, let's create a proper SELECT policy for public access
-- This allows anyone to view files (needed for public URLs to work)

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;

-- Create a proper public SELECT policy
CREATE POLICY "Allow public select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents');

-- Keep the other policies for upload/delete
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
CREATE POLICY "Allow authenticated delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Verify the policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
