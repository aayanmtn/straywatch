-- Update all reports without contributor info to have default values
UPDATE reports
SET 
  contributor_name = COALESCE(contributor_name, 'Community Contributor'),
  contributor_from = COALESCE(contributor_from, 'Leh')
WHERE contributor_name IS NULL OR contributor_name = '';
