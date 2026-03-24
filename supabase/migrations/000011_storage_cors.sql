-- Configure CORS for the documents bucket
-- This allows the web app to access files from the browser

-- Insert CORS configuration for the documents bucket
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'documents',
    'documents',
    true,
    10485760,
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    updated_at = NOW();

-- Note: CORS configuration in Supabase is typically done via the Dashboard
-- under Storage > Settings or via the CLI/API
-- The bucket being public should allow access with proper signed URLs

-- Ensure the bucket exists and has proper settings
SELECT * FROM storage.buckets WHERE id = 'documents';
