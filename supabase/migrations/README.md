# Database Migrations

This folder contains SQL migration files for the StrayWatch database schema.

## How to Run Migrations

Run these migrations in order in your Supabase SQL Editor:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste each migration file in order and click **Run**

### Migration Order

1. `001_create_reports_table.sql` - Creates the main reports table with indexes
2. `002_enable_rls_policies.sql` - Enables Row Level Security policies
3. `003_create_updated_at_trigger.sql` - Adds automatic timestamp updates
4. `004_create_stats_view.sql` - Creates views for statistics
5. `005_add_contributor_fields.sql` - Adds contributor_name and contributor_from fields

## Quick Setup (All-in-One)

You can also run all migrations at once by combining them:

```sql
-- Run migrations 001-004 in sequence
-- Copy the contents of each file and run them together
```

## Schema Overview

### Reports Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| type | TEXT | 'sighting', 'bite', or 'garbage' |
| lat | DOUBLE PRECISION | Latitude coordinate |
| lng | DOUBLE PRECISION | Longitude coordinate |
| count | INTEGER | Number of items/dogs |
| severity | TEXT | 'low', 'medium', or 'high' |
| notes | TEXT | Optional description |
| user_id | UUID | Reference to auth.users |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| contributor_name | TEXT | Name of report submitter (from user metadata) |
| contributor_from | TEXT | Location of contributor (from user metadata) |

### Views

- `report_stats` - Aggregated statistics by report type
- `daily_report_trends` - Daily report counts
- `severity_distribution` - Severity breakdown by type
