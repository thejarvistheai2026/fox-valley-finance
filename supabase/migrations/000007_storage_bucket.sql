-- Create the documents storage bucket if it doesn't exist
-- This bucket is used for storing PDFs and images attached to estimates, receipts, and vendors

-- Insert the bucket into storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,  -- Public bucket so files can be accessed via public URL
    10485760,  -- 10MB file size limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES
-- These policies control who can upload, view, and delete files
-- ============================================================================

-- Policy: Allow authenticated users to upload files
-- Path format: {project_id}/{entity_type}/{entity_id}/{filename}
CREATE POLICY "Allow authenticated uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND auth.role() = 'authenticated'
    );

-- Policy: Allow authenticated users to view files
CREATE POLICY "Allow authenticated select"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents'
        AND auth.role() = 'authenticated'
    );

-- Policy: Allow authenticated users to delete files
CREATE POLICY "Allow authenticated delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents'
        AND auth.role() = 'authenticated'
    );
