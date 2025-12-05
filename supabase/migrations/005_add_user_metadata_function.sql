-- Migration: Add function to get user metadata
-- Created: 2025-12-05
-- Description: Expose user metadata for reports without exposing sensitive auth data

-- Create a function to get public user info
CREATE OR REPLACE FUNCTION get_user_metadata(user_uuid UUID)
RETURNS TABLE (
  name TEXT,
  location TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (raw_user_meta_data->>'name')::TEXT as name,
    (raw_user_meta_data->>'from')::TEXT as location
  FROM auth.users
  WHERE id = user_uuid;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_user_metadata(UUID) TO authenticated, anon;
