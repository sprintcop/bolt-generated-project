/*
  # Create process tasks and comments tables

  1. New Tables
    - `process_tasks`
      - `id` (uuid, primary key)
      - `process_id` (uuid, foreign key to processes)
      - `name` (text)
      - `description` (text)
      - `due_date` (date)
      - `priority` (text, enum: 'low', 'medium', 'high')
      - `status` (text, enum: 'pending', 'in_progress', 'completed')
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)

    - `task_comments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to process_tasks)
      - `content` (text)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create enum types
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create tasks table
CREATE TABLE IF NOT EXISTS process_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  due_date date,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES process_tasks(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE process_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Policies for process_tasks
CREATE POLICY "Users can read own process tasks"
  ON process_tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create process tasks"
  ON process_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own process tasks"
  ON process_tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own process tasks"
  ON process_tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for task_comments
CREATE POLICY "Users can read task comments"
  ON task_comments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM process_tasks
    WHERE process_tasks.id = task_comments.task_id
    AND process_tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can create task comments"
  ON task_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task comments"
  ON task_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task comments"
  ON task_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
