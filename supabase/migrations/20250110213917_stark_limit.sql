/*
  # Remove task assignee functionality

  1. Changes
    - Drop assignee_id column from process_tasks table
    - Remove related foreign key constraint
*/

-- Drop the assignee_id column and its constraint
ALTER TABLE process_tasks
DROP CONSTRAINT IF EXISTS process_tasks_assignee_id_fkey,
DROP COLUMN IF EXISTS assignee_id;
