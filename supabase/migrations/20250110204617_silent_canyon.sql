/*
  # Create process actions table

  1. New Tables
    - `process_actions`
      - `id` (uuid, primary key)
      - `process_id` (uuid, foreign key to processes)
      - `action_date` (date)
      - `action` (text)
      - `annotation` (text)
      - `term_start_date` (date)
      - `term_end_date` (date)
      - `registration_date` (timestamptz)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `process_actions` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS process_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  action_date date NOT NULL,
  action text NOT NULL,
  annotation text,
  term_start_date date,
  term_end_date date,
  registration_date timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE process_actions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own process actions
CREATE POLICY "Users can read own process actions"
  ON process_actions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to create process actions
CREATE POLICY "Users can create process actions"
  ON process_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own process actions
CREATE POLICY "Users can update own process actions"
  ON process_actions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own process actions
CREATE POLICY "Users can delete own process actions"
  ON process_actions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
