-- Migration: Create todos table for shared project task management
-- Description: Stores todos and milestones that are visible to all users

CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    display_id TEXT NOT NULL UNIQUE,

    -- Todo details
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE, -- Optional, NULL for general todos

    -- Status
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    is_milestone BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Display ordering
    sort_order INTEGER DEFAULT 0
);

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_todos_project_id ON public.todos(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON public.todos(is_completed);
CREATE INDEX IF NOT EXISTS idx_todos_is_milestone ON public.todos(is_milestone);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view todos
CREATE POLICY "todos_select_all"
    ON public.todos FOR SELECT
    TO authenticated
    USING (true);

-- Policy: All authenticated users can create todos
CREATE POLICY "todos_insert_all"
    ON public.todos FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: All authenticated users can update todos
CREATE POLICY "todos_update_all"
    ON public.todos FOR UPDATE
    TO authenticated
    USING (true);

-- Policy: All authenticated users can delete todos
CREATE POLICY "todos_delete_all"
    ON public.todos FOR DELETE
    TO authenticated
    USING (true);

-- Grant permissions
GRANT ALL ON public.todos TO authenticated;
GRANT ALL ON public.todos TO anon;

-- Function to generate display_id
CREATE OR REPLACE FUNCTION generate_todo_display_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.display_id := 'TODO-' || LPAD(nextval('todos_display_id_seq')::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for display_id
CREATE SEQUENCE IF NOT EXISTS todos_display_id_seq START 1;

-- Create trigger
DROP TRIGGER IF EXISTS set_todo_display_id ON public.todos;
CREATE TRIGGER set_todo_display_id
    BEFORE INSERT ON public.todos
    FOR EACH ROW
    EXECUTE FUNCTION generate_todo_display_id();
