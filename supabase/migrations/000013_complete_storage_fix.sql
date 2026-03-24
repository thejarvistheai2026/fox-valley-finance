-- Complete storage bucket policy fix
-- Fixes public access to files while keeping upload/delete restricted

-- Step 1: Drop ALL existing policies on storage.objects
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- Step 2: Ensure bucket is public
UPDATE storage.buckets
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]
WHERE id = 'documents';

-- Step 3: Create minimal policies
-- SELECT: Allow anyone to read (needed for public URLs to work)
CREATE POLICY "Allow public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents');

-- INSERT: Allow authenticated uploads only
CREATE POLICY "Allow authenticated uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- DELETE: Allow authenticated delete only
CREATE POLICY "Allow authenticated delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Step 4: Verify
SELECT b.id, b.name, b.public, b.file_size_limit
FROM storage.buckets b
WHERE b.id = 'documents';
