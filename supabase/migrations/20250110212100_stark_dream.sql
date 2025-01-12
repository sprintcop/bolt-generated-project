/*
  # Add filing number and documents URL to processes table

  1. Changes
    - Add `filing_number` column to store the process filing number
    - Add `documents_url` column to store the URL of related documents
*/

ALTER TABLE processes
ADD COLUMN filing_number text,
ADD COLUMN documents_url text;
