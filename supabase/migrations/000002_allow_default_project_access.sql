-- Migration: Allow any authenticated user to access the default project
-- This removes the requirement for users to be in project_members table
-- for the default project (11111111-1111-1111-1111-111111111111)

-- ============================================================================
-- HELPER FUNCTION: Check if user can access project
-- Updated to allow any authenticated user to access the default project
-- ============================================================================

CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow access to the default project for any authenticated user
    IF p_project_id = '11111111-1111-1111-1111-111111111111'::UUID THEN
        RETURN TRUE;
    END IF;

    -- For other projects, check project_members table
    RETURN EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = p_project_id
          AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- INSERT DEFAULT PROJECT MEMBERS FOR EXISTING USERS
-- This ensures existing authenticated users are added to the default project
-- ============================================================================

-- Add any existing auth users to the default project as members
INSERT INTO project_members (project_id, user_id, role)
SELECT
    '11111111-1111-1111-1111-111111111111'::UUID,
    id,
    CASE
        WHEN created_at = (SELECT MIN(created_at) FROM auth.users) THEN 'owner'
        ELSE 'member'
    END
FROM auth.users
WHERE id IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ============================================================================
-- TRIGGER: Auto-add new users to default project
-- Automatically adds any new user to the default project
-- ============================================================================

CREATE OR REPLACE FUNCTION add_user_to_default_project()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_members (project_id, user_id, role)
    VALUES ('11111111-1111-1111-1111-111111111111', NEW.id, 'member')
    ON CONFLICT (project_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION add_user_to_default_project();

-- ============================================================================
-- ADD EXISTING USERS TO DEFAULT PROJECT (if not already done)
-- Run this for any users that were created before the trigger
-- ============================================================================

DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN
        SELECT id FROM auth.users
        WHERE id NOT IN (
            SELECT user_id FROM project_members
            WHERE project_id = '11111111-1111-1111-1111-111111111111'
        )
    LOOP
        INSERT INTO project_members (project_id, user_id, role)
        VALUES ('11111111-1111-1111-1111-111111111111', user_record.id, 'member')
        ON CONFLICT (project_id, user_id) DO NOTHING;
    END LOOP;
END $$;
