/*
  # Create process hearings and comments tables

  1. New Tables
    - `process_hearings`
      - `id` (uuid, primary key)
      - `process_id` (uuid, foreign key to processes)
      - `name` (text)
      - `description` (text)
      - `hearing_status` (text)
      - `priority` (text, enum: 'low', 'medium', 'high')
      - `status` (text, enum: 'pending', 'in_progress', 'completed')
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)

    - `hearing_comments`
      - `id` (uuid, primary key)
      - `hearing_id` (uuid, foreign key to process_hearings)
      - `content` (text)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create enum types (reuse existing if possible)
DO $$ BEGIN
  CREATE TYPE hearing_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE hearing_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create hearings table
CREATE TABLE IF NOT EXISTS process_hearings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  hearing_status text,
  priority hearing_priority NOT NULL DEFAULT 'medium',
  status hearing_status NOT NULL DEFAULT 'pending',
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS hearing_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_id uuid NOT NULL REFERENCES process_hearings(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE process_hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearing_comments ENABLE ROW LEVEL SECURITY;

-- Policies for process_hearings
CREATE POLICY "Users can read own process hearings"
  ON process_hearings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create process hearings"
  ON process_hearings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own process hearings"
  ON process_hearings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own process hearings"
  ON process_hearings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for hearing_comments
CREATE POLICY "Users can read hearing comments"
  ON hearing_comments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM process_hearings
    WHERE process_hearings.id = hearing_comments.hearing_id
    AND process_hearings.user_id = auth.uid()
  ));

CREATE POLICY "Users can create hearing comments"
  ON hearing_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hearing comments"
  ON hearing_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hearing comments"
  ON hearing_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
