/*
  # Add assignee to process tasks

  1. Changes
    - Add assignee_id column to process_tasks table allowing NULL initially
    - Update existing tasks to set the assignee as the creator (user_id)
    - Add NOT NULL constraint after data is updated
    - Add foreign key constraint to auth.users

  2. Security
    - Maintains existing RLS policies
    - Assignee must be a valid user in the system
*/

-- Add column allowing NULL initially
ALTER TABLE process_tasks
ADD COLUMN assignee_id uuid REFERENCES auth.users(id);

-- Update existing tasks to set assignee as the creator
UPDATE process_tasks
SET assignee_id = user_id
WHERE assignee_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE process_tasks
ALTER COLUMN assignee_id SET NOT NULL;
