-- Migration: Add mobile_note column for quick capture notes
-- Mobile users can add a quick note when capturing, then process details on web

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS mobile_note TEXT;

COMMENT ON COLUMN receipts.mobile_note IS 'Quick note added during mobile capture, shown in inbox for context';
