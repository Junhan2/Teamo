-- Add tagged_todos column to team_memos table
ALTER TABLE team_memos 
ADD COLUMN IF NOT EXISTS tagged_todos TEXT[] DEFAULT '{}';

-- Update existing records to have empty array for tagged_todos
UPDATE team_memos 
SET tagged_todos = '{}' 
WHERE tagged_todos IS NULL;