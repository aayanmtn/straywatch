-- Add contributor columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS contributor_name TEXT,
ADD COLUMN IF NOT EXISTS contributor_from TEXT;

-- Add comment
COMMENT ON COLUMN reports.contributor_name IS 'Name of the user who created the report';
COMMENT ON COLUMN reports.contributor_from IS 'Location of the user who created the report';
