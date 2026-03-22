-- Fox Valley Finance Tracker - Row Level Security Policies
-- File: supabase/policies.sql
-- Description: All RLS policies for multi-user project access
-- Apply this after running migrations to enable RLS

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Check if user is a member of a project
-- Used by all policies to enforce project-based access
-- ============================================================================

CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = p_project_id 
          AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PROJECTS TABLE
-- Users can only see projects they are members of
-- ============================================================================

-- Select policy: Users can view projects they belong to
CREATE POLICY "Users can view their projects"
    ON projects FOR SELECT
    USING (is_project_member(id, auth.uid()));

-- Insert policy: Only authenticated users can create projects (for setup)
CREATE POLICY "Authenticated users can create projects"
    ON projects FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Update policy: Users can update projects they belong to
CREATE POLICY "Users can update their projects"
    ON projects FOR UPDATE
    USING (is_project_member(id, auth.uid()));

-- Delete policy: Only project owners can delete (though soft delete preferred)
CREATE POLICY "Only owners can delete projects"
    ON projects FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = projects.id 
              AND user_id = auth.uid() 
              AND role = 'owner'
        )
    );

-- ============================================================================
-- PROJECT_MEMBERS TABLE
-- Users can view members of their projects
-- ============================================================================

-- Select policy: Users can view members of their projects
CREATE POLICY "Users can view project members"
    ON project_members FOR SELECT
    USING (is_project_member(project_id, auth.uid()));

-- Insert policy: Only project owners can add members
CREATE POLICY "Owners can add project members"
    ON project_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_members.project_id
              AND pm.user_id = auth.uid()
              AND pm.role = 'owner'
        )
    );

-- Update policy: Only project owners can update member roles
CREATE POLICY "Owners can update project members"
    ON project_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_members.project_id
              AND pm.user_id = auth.uid()
              AND pm.role = 'owner'
        )
    );

-- Delete policy: Only project owners can remove members (except self)
CREATE POLICY "Owners can remove project members"
    ON project_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_members.project_id
              AND pm.user_id = auth.uid()
              AND pm.role = 'owner'
        )
        OR user_id = auth.uid() -- Users can remove themselves
    );

-- ============================================================================
-- VENDORS TABLE
-- Users can only access vendors in their projects
-- ============================================================================

-- Select policy: Users can view vendors in their projects
CREATE POLICY "Users can view vendors in their projects"
    ON vendors FOR SELECT
    USING (is_project_member(project_id, auth.uid()));

-- Insert policy: Users can create vendors in their projects
CREATE POLICY "Users can create vendors in their projects"
    ON vendors FOR INSERT
    WITH CHECK (is_project_member(project_id, auth.uid()));

-- Update policy: Users can update vendors in their projects
CREATE POLICY "Users can update vendors in their projects"
    ON vendors FOR UPDATE
    USING (is_project_member(project_id, auth.uid()));

-- Delete policy: Users can delete vendors in their projects
-- Note: Soft delete via is_archived is preferred
CREATE POLICY "Users can delete vendors in their projects"
    ON vendors FOR DELETE
    USING (is_project_member(project_id, auth.uid()));

-- ============================================================================
-- ESTIMATES TABLE
-- Users can only access estimates in their projects
-- ============================================================================

-- Select policy: Users can view estimates in their projects
CREATE POLICY "Users can view estimates in their projects"
    ON estimates FOR SELECT
    USING (is_project_member(project_id, auth.uid()));

-- Insert policy: Users can create estimates in their projects
-- Must also verify the vendor belongs to the same project
CREATE POLICY "Users can create estimates in their projects"
    ON estimates FOR INSERT
    WITH CHECK (
        is_project_member(project_id, auth.uid())
        AND EXISTS (
            SELECT 1 FROM vendors v 
            WHERE v.id = estimates.vendor_id 
              AND v.project_id = estimates.project_id
        )
    );

-- Update policy: Users can update estimates in their projects
CREATE POLICY "Users can update estimates in their projects"
    ON estimates FOR UPDATE
    USING (is_project_member(project_id, auth.uid()));

-- Delete policy: Users can delete estimates in their projects
-- Note: Soft delete via is_archived is preferred
CREATE POLICY "Users can delete estimates in their projects"
    ON estimates FOR DELETE
    USING (is_project_member(project_id, auth.uid()));

-- ============================================================================
-- RECEIPTS TABLE
-- Users can only access receipts in their projects
-- ============================================================================

-- Select policy: Users can view receipts in their projects
CREATE POLICY "Users can view receipts in their projects"
    ON receipts FOR SELECT
    USING (is_project_member(project_id, auth.uid()));

-- Insert policy: Users can create receipts in their projects
-- Must also verify the vendor belongs to the same project
-- For mobile captures, sets created_by to the current user
CREATE POLICY "Users can create receipts in their projects"
    ON receipts FOR INSERT
    WITH CHECK (
        is_project_member(project_id, auth.uid())
        AND EXISTS (
            SELECT 1 FROM vendors v 
            WHERE v.id = receipts.vendor_id 
              AND v.project_id = receipts.project_id
        )
    );

-- Update policy: Users can update receipts in their projects
-- Includes changing status from 'inbox' to 'confirmed'
CREATE POLICY "Users can update receipts in their projects"
    ON receipts FOR UPDATE
    USING (is_project_member(project_id, auth.uid()));

-- Delete policy: Users can delete receipts in their projects
-- Note: Soft delete via is_archived is preferred
CREATE POLICY "Users can delete receipts in their projects"
    ON receipts FOR DELETE
    USING (is_project_member(project_id, auth.uid()));

-- ============================================================================
-- DOCUMENTS TABLE
-- Users can only access documents in their projects
-- ============================================================================

-- Select policy: Users can view documents in their projects
CREATE POLICY "Users can view documents in their projects"
    ON documents FOR SELECT
    USING (is_project_member(project_id, auth.uid()));

-- Insert policy: Users can create documents in their projects
-- Must verify the vendor belongs to the same project
CREATE POLICY "Users can create documents in their projects"
    ON documents FOR INSERT
    WITH CHECK (
        is_project_member(project_id, auth.uid())
        AND EXISTS (
            SELECT 1 FROM vendors v 
            WHERE v.id = documents.vendor_id 
              AND v.project_id = documents.project_id
        )
    );

-- Update policy: Users can update documents in their projects
CREATE POLICY "Users can update documents in their projects"
    ON documents FOR UPDATE
    USING (is_project_member(project_id, auth.uid()));

-- Delete policy: Users can delete documents in their projects
CREATE POLICY "Users can delete documents in their projects"
    ON documents FOR DELETE
    USING (is_project_member(project_id, auth.uid()));

-- ============================================================================
-- STORAGE BUCKET RLS (for document files)
-- These policies control access to the Supabase Storage bucket
-- ============================================================================

-- Note: These are typically applied via the Supabase Dashboard or CLI
-- The bucket should be created with name 'documents' and made private

/*
-- Example Storage bucket policies (apply via Supabase Dashboard):

-- Allow users to upload files to their project's folder
CREATE POLICY "Users can upload to their project folder" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'documents' 
        AND is_project_member(
            (storage.foldername(name))[1]::uuid, 
            auth.uid()
        )
    );

-- Allow users to view files in their project's folder
CREATE POLICY "Users can view files in their project folder" 
    ON storage.objects FOR SELECT 
    USING (
        bucket_id = 'documents' 
        AND is_project_member(
            (storage.foldername(name))[1]::uuid, 
            auth.uid()
        )
    );

-- Allow users to delete files in their project's folder
CREATE POLICY "Users can delete files in their project folder" 
    ON storage.objects FOR DELETE 
    USING (
        bucket_id = 'documents' 
        AND is_project_member(
            (storage.foldername(name))[1]::uuid, 
            auth.uid()
        )
    );
*/

-- ============================================================================
-- ADDITIONAL SECURITY NOTES
-- ============================================================================

/*
1. All tables use project-based RLS - users can only access data in projects
   they are members of. This allows the two homeowners to share all data.

2. The is_project_member() function is SECURITY DEFINER to bypass RLS 
   within the function itself, avoiding recursion issues.

3. For the mobile app OCR captures, receipts are inserted with status='inbox'
   and created_by set to auth.uid(). The RLS allows this because all members
   share the same project.

4. Soft deletes (is_archived) are preferred over hard deletes for all entities
   to preserve history and prevent accidental data loss.

5. The views (vendor_financial_summary, estimate_with_balance, project_summary)
   are automatically filtered by RLS on the underlying tables.

6. Storage bucket 'documents' should be created separately and the path format
   should be: {project_id}/{entity_type}/{entity_id}/{filename}
   Example: "a1b2c3d4-e5f6.../receipts/r2e3f4g5-h6i7.../receipt_001.jpg"
*/
