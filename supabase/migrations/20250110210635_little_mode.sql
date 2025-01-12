/*
  # Add due date to hearings table

  1. Changes
    - Add `due_date` column to process_hearings table
*/

ALTER TABLE process_hearings
ADD COLUMN due_date date;
