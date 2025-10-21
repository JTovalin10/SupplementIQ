-- Utility Functions for JWT Role Management
-- These functions help manage user roles with JWT claims

-- =================================================================
-- Function to check if current user has specific role
-- =================================================================

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user has the required role
  RETURN (auth.jwt() ->> 'user_role') = required_role;
END;
$$;

-- =================================================================
-- Function to check if current user has any of the specified roles
-- =================================================================

CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := auth.jwt() ->> 'user_role';
  RETURN user_role = ANY(required_roles);
END;
$$;

-- =================================================================
-- Function to get current user's role from JWT
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.jwt() ->> 'user_role';
END;
$$;

-- =================================================================
-- Function to check if current user is admin or owner
-- =================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.has_any_role(ARRAY['admin', 'owner']);
END;
$$;

-- =================================================================
-- Function to check if current user is moderator or higher
-- =================================================================

CREATE OR REPLACE FUNCTION public.is_moderator_or_higher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.has_any_role(ARRAY['moderator', 'admin', 'owner']);
END;
$$;

-- =================================================================
-- Grant permissions
-- =================================================================

GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_higher() TO authenticated;

-- =================================================================
-- Example usage in policies (alternative syntax)
-- =================================================================

-- Example policy using the utility functions:
-- CREATE POLICY "admin_only_access" ON some_table
--   FOR ALL USING (public.is_admin());

-- Example policy using has_any_role:
-- CREATE POLICY "moderator_access" ON some_table
--   FOR ALL USING (public.has_any_role(ARRAY['moderator', 'admin', 'owner']));

-- =================================================================
-- Test the utility functions
-- =================================================================

-- Test function to verify utility functions work
CREATE OR REPLACE FUNCTION public.test_role_utilities()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_user_id UUID;
  current_role TEXT;
  is_admin_result BOOLEAN;
  is_moderator_result BOOLEAN;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM public.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RETURN 'No users found';
  END IF;
  
  -- Set JWT claims for test user
  PERFORM auth.set_user_role_claim(test_user_id);
  
  -- Test utility functions
  current_role := public.get_current_user_role();
  is_admin_result := public.is_admin();
  is_moderator_result := public.is_moderator_or_higher();
  
  RETURN 'Role utilities working. Current role: ' || current_role || 
         ', Is admin: ' || is_admin_result || 
         ', Is moderator+: ' || is_moderator_result;
END;
$$;

-- Run the test
SELECT public.test_role_utilities() as utility_test_result;
