-- Migration: Fix todos RLS policies to ensure visibility
-- Description: The select policy may not be working correctly, add explicit anon policy

-- Drop existing policies and recreate to ensure they apply
DROP POLICY IF EXISTS "todos_select_all" ON public.todos;
DROP POLICY IF EXISTS "todos_select_anon" ON public.todos;

-- Policy: All users (authenticated and anon) can view todos
CREATE POLICY "todos_select_all"
    ON public.todos FOR SELECT
    TO authenticated, anon
    USING (true);

-- Also ensure the insert/update/delete policies include both roles
DROP POLICY IF EXISTS "todos_insert_all" ON public.todos;
CREATE POLICY "todos_insert_all"
    ON public.todos FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "todos_update_all" ON public.todos;
CREATE POLICY "todos_update_all"
    ON public.todos FOR UPDATE
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "todos_delete_all" ON public.todos;
CREATE POLICY "todos_delete_all"
    ON public.todos FOR DELETE
    TO authenticated, anon
    USING (true);

-- Refresh RLS
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
