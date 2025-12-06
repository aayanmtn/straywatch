-- Migration: Add contributor fields to reports table
-- Created: 2024-12-06





































New reports will automatically include contributor names. Existing reports won't show names unless you backfill the data by running an update query to populate contributor fields from auth.users metadata.## After Migration- **Map Display**: `src/components/LeafletMap.tsx` (lines 169-172)- **Report Creation**: `src/lib/api.ts` (lines 62-67)- **Data Collection**: `src/components/AuthModal.tsx` (lines 20-21, 73)### Code References4. **Map Display** - `LeafletMap.tsx` shows contributor info in popup if available3. **Report Creation** - `createReport()` in `lib/api.ts` copies metadata to report columns2. **Stored as Metadata** - Saved to `user_metadata.name` and `user_metadata.from`1. **User Signup** - Name and location are collected via `AuthModal.tsx`### How It Works5. Paste and click **Run**4. Copy the contents of `supabase/migrations/005_add_contributor_fields.sql`3. Navigate to **SQL Editor**2. Select your project1. Go to your Supabase Dashboard: https://supabase.com/dashboard### How to Apply**Run migration `005_add_contributor_fields.sql` to add these columns to the database.**### Required Database Migration- `contributor_from` - User's location- `contributor_name` - User's full nameThe application already collects and stores contributor information from user metadata during signup:## SolutionMap markers show incident details but don't display the name of the person who reported it.## Issue-- Description: Add contributor_name and contributor_from fields to display report authors
-- 
-- To apply this migration:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
--
-- This enables showing who submitted each report on the map markers

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS contributor_name TEXT,
ADD COLUMN IF NOT EXISTS contributor_from TEXT;

-- Add index for searching by contributor
CREATE INDEX IF NOT EXISTS idx_reports_contributor_name ON reports(contributor_name);

-- Add comment
COMMENT ON COLUMN reports.contributor_name IS 'Name of the person who submitted the report (from user metadata)';
COMMENT ON COLUMN reports.contributor_from IS 'Location of the contributor (from user metadata)';
