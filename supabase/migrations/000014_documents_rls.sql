-- Enable RLS on documents table and add policies for access
-- This allows authenticated users to read their project's documents

-- First, ensure RLS is enabled on the documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated read documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated insert documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated update documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated delete documents" ON documents;

-- Policy: Allow authenticated users to read documents in their project
CREATE POLICY "Allow authenticated read documents"
    ON documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = documents.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Policy: Allow authenticated users to insert documents
CREATE POLICY "Allow authenticated insert documents"
    ON documents FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Policy: Allow authenticated users to delete their documents
CREATE POLICY "Allow authenticated delete documents"
    ON documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = documents.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Verify RLS is enabled
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'documents';
