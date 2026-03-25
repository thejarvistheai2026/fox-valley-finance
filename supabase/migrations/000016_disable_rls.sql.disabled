-- NUCLEAR OPTION: Disable RLS on storage.objects to test if that's the issue
-- This will confirm whether RLS is blocking public access

-- Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on storage.buckets
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename IN ('objects', 'buckets');
