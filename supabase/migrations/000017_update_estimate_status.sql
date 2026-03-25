-- Migration: Update estimate status values
-- Changes: Rename 'revised' to 'draft', add 'completed', keep 'active' and 'declined'

-- First, update any existing 'revised' records to 'draft'
UPDATE estimates SET status = 'draft' WHERE status = 'revised';

-- Drop the old check constraint
ALTER TABLE estimates DROP CONSTRAINT IF EXISTS estimates_status_check;

-- Add the new check constraint with updated status values
ALTER TABLE estimates ADD CONSTRAINT estimates_status_check
  CHECK (status IN ('draft', 'active', 'completed', 'declined'));
