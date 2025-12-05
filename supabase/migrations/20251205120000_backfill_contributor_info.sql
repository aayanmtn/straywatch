-- Backfill contributor information for existing reports
-- This is optional - only updates reports that don't have contributor info

UPDATE reports
SET 
  contributor_name = 'Legacy Contributor',
  contributor_from = 'Leh'
WHERE contributor_name IS NULL OR contributor_name = '';
