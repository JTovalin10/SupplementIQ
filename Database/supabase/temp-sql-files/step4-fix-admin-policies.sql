-- Step 4: Add admin policies (only if Steps 1-3 work)
-- These use JWT claims for performance

CREATE POLICY "users_admin_read_all" ON public.users
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'owner', 'moderator')
  );

CREATE POLICY "users_admin_update_roles" ON public.users
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'owner')
  );

-- These policies allow admins to read all users and update roles
-- Performance: O(1) - JWT claim lookup (cached in memory)
