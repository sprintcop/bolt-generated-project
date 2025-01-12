/*
  # Fix users view and task assignee relationship

  1. Changes
    - Create view for users with proper permissions
    - Update task assignee foreign key
*/

-- Create view for users
CREATE OR REPLACE VIEW public.users AS
SELECT id, email
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.users TO authenticated;

-- Update task assignee foreign key
ALTER TABLE process_tasks
DROP CONSTRAINT IF EXISTS process_tasks_assignee_id_fkey,
ADD CONSTRAINT process_tasks_assignee_id_fkey 
  FOREIGN KEY (assignee_id) 
  REFERENCES auth.users(id);
