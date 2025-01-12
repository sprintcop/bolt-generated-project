/*
  # Create process subjects table

  1. New Tables
    - `process_subjects`
      - `id` (uuid, primary key)
      - `process_id` (uuid, foreign key to processes)
      - `type` (text)
      - `name` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `process_subjects` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS process_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  type text NOT NULL,
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE process_subjects ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own process subjects
CREATE POLICY "Users can read own process subjects"
  ON process_subjects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to create process subjects
CREATE POLICY "Users can create process subjects"
  ON process_subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own process subjects
CREATE POLICY "Users can update own process subjects"
  ON process_subjects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own process subjects
CREATE POLICY "Users can delete own process subjects"
  ON process_subjects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
