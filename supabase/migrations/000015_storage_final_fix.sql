-- COMPLETE STORAGE FIX - Ensure bucket is public and policies allow access
-- This ensures public URLs work for all files

-- ============================================================================
-- STEP 1: ENSURE BUCKET EXISTS AND IS PUBLIC
-- ============================================================================

-- Update bucket to be public (if it exists)
UPDATE storage.buckets
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ]
WHERE id = 'documents';

-- Insert if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,
    10485760,
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- ============================================================================
-- STEP 3: CREATE MINIMAL PUBLIC ACCESS POLICIES
-- ============================================================================

-- SELECT: Allow ANYONE to read (public bucket needs public policy)
CREATE POLICY "Allow public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents');

-- INSERT: Only authenticated users can upload
CREATE POLICY "Allow authenticated uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- DELETE: Only authenticated users can delete
CREATE POLICY "Allow authenticated delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- ============================================================================
-- STEP 4: VERIFY CONFIGURATION
-- ============================================================================

SELECT
    b.id,
    b.name,
    b.public as is_public,
    b.file_size_limit,
    b.allowed_mime_types,
    (SELECT count(*) FROM storage.objects WHERE bucket_id = b.id) as object_count
FROM storage.buckets b
WHERE b.id = 'documents';

-- Show all policies for this bucket
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
