-- Create enum types (reuse existing if possible)
DO $$ BEGIN
  CREATE TYPE term_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE term_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create terms table
CREATE TABLE IF NOT EXISTS process_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  days_term integer NOT NULL,
  notification_date date,
  due_date date,
  priority term_priority NOT NULL DEFAULT 'medium',
  status term_status NOT NULL DEFAULT 'pending',
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create comments table for terms
CREATE TABLE IF NOT EXISTS term_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id uuid NOT NULL REFERENCES process_terms(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE process_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_comments ENABLE ROW LEVEL SECURITY;

-- Policies for process_terms
CREATE POLICY "Users can read own process terms"
  ON process_terms
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create process terms"
  ON process_terms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own process terms"
  ON process_terms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own process terms"
  ON process_terms
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for term_comments
CREATE POLICY "Users can read term comments"
  ON term_comments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM process_terms
    WHERE process_terms.id = term_comments.term_id
    AND process_terms.user_id = auth.uid()
  ));

CREATE POLICY "Users can create term comments"
  ON term_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own term comments"
  ON term_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own term comments"
  ON term_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
