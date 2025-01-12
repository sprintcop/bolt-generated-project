/*
  # Update RLS policies to allow all authenticated users to read data

  1. Changes
    - Update all SELECT policies to allow any authenticated user to read data
    - Maintain existing policies for INSERT, UPDATE, and DELETE operations
    - This affects all tables in the system

  2. Security
    - All authenticated users can read all data
    - Users can only modify their own data
    - Maintains data integrity while allowing collaboration
*/

-- Update clients table policies
DROP POLICY IF EXISTS "Users can read own clients" ON clients;
CREATE POLICY "Users can read all clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Update processes table policies
DROP POLICY IF EXISTS "Users can read own processes" ON processes;
CREATE POLICY "Users can read all processes"
  ON processes
  FOR SELECT
  TO authenticated
  USING (true);

-- Update process_subjects table policies
DROP POLICY IF EXISTS "Users can read own process subjects" ON process_subjects;
CREATE POLICY "Users can read all process subjects"
  ON process_subjects
  FOR SELECT
  TO authenticated
  USING (true);

-- Update process_actions table policies
DROP POLICY IF EXISTS "Users can read own process actions" ON process_actions;
CREATE POLICY "Users can read all process actions"
  ON process_actions
  FOR SELECT
  TO authenticated
  USING (true);

-- Update process_tasks table policies
DROP POLICY IF EXISTS "Users can read own process tasks" ON process_tasks;
CREATE POLICY "Users can read all process tasks"
  ON process_tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Update task_comments table policies
DROP POLICY IF EXISTS "Users can read task comments" ON task_comments;
CREATE POLICY "Users can read all task comments"
  ON task_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Update process_hearings table policies
DROP POLICY IF EXISTS "Users can read own process hearings" ON process_hearings;
CREATE POLICY "Users can read all process hearings"
  ON process_hearings
  FOR SELECT
  TO authenticated
  USING (true);

-- Update hearing_comments table policies
DROP POLICY IF EXISTS "Users can read hearing comments" ON hearing_comments;
CREATE POLICY "Users can read all hearing comments"
  ON hearing_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Update process_terms table policies
DROP POLICY IF EXISTS "Users can read own process terms" ON process_terms;
CREATE POLICY "Users can read all process terms"
  ON process_terms
  FOR SELECT
  TO authenticated
  USING (true);

-- Update term_comments table policies
DROP POLICY IF EXISTS "Users can read term comments" ON term_comments;
CREATE POLICY "Users can read all term comments"
  ON term_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Update process_meetings table policies
DROP POLICY IF EXISTS "Users can read own process meetings" ON process_meetings;
CREATE POLICY "Users can read all process meetings"
  ON process_meetings
  FOR SELECT
  TO authenticated
  USING (true);

-- Update meeting_comments table policies
DROP POLICY IF EXISTS "Users can read meeting comments" ON meeting_comments;
CREATE POLICY "Users can read all meeting comments"
  ON meeting_comments
  FOR SELECT
  TO authenticated
  USING (true);
