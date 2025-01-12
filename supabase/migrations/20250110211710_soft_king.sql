-- Create enum types (reuse existing if possible)
DO $$ BEGIN
  CREATE TYPE meeting_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE meeting_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create meetings table
CREATE TABLE IF NOT EXISTS process_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  location text,
  due_date date,
  priority meeting_priority NOT NULL DEFAULT 'medium',
  status meeting_status NOT NULL DEFAULT 'pending',
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create comments table for meetings
CREATE TABLE IF NOT EXISTS meeting_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES process_meetings(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE process_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_comments ENABLE ROW LEVEL SECURITY;

-- Policies for process_meetings
CREATE POLICY "Users can read own process meetings"
  ON process_meetings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create process meetings"
  ON process_meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own process meetings"
  ON process_meetings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own process meetings"
  ON process_meetings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for meeting_comments
CREATE POLICY "Users can read meeting comments"
  ON meeting_comments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM process_meetings
    WHERE process_meetings.id = meeting_comments.meeting_id
    AND process_meetings.user_id = auth.uid()
  ));

CREATE POLICY "Users can create meeting comments"
  ON meeting_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meeting comments"
  ON meeting_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meeting comments"
  ON meeting_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
