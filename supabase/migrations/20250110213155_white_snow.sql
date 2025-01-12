/*
  # Create public users view

  1. Changes
    - Create a public view for basic user information
    - Add policies to allow authenticated users to read user information

  2. Security
    - Only exposes id and email fields
    - Accessible only to authenticated users
*/

CREATE OR REPLACE VIEW public.users AS
SELECT id, email
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.users TO authenticated;

-- Update the task assignee query to use the new view
ALTER TABLE process_tasks
DROP CONSTRAINT process_tasks_assignee_id_fkey,
ADD CONSTRAINT process_tasks_assignee_id_fkey 
  FOREIGN KEY (assignee_id) 
  REFERENCES auth.users(id);
