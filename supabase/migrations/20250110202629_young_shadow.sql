/*
  # Create processes table and relationships

  1. New Tables
    - `processes`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `filing_date` (date)
      - `court` (text)
      - `judge` (text)
      - `process_type` (text)
      - `process_class` (text)
      - `process_subclass` (text)
      - `resource` (text)
      - `file_location` (text)
      - `filing_content` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `processes` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  filing_date date NOT NULL,
  court text NOT NULL,
  judge text NOT NULL,
  process_type text NOT NULL,
  process_class text NOT NULL,
  process_subclass text NOT NULL,
  resource text,
  file_location text,
  filing_content text,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own processes
CREATE POLICY "Users can read own processes"
  ON processes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to create processes
CREATE POLICY "Users can create processes"
  ON processes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own processes
CREATE POLICY "Users can update own processes"
  ON processes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own processes
CREATE POLICY "Users can delete own processes"
  ON processes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
