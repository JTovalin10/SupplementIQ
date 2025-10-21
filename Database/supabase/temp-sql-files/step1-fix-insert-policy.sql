-- Step 1: Add basic INSERT policy to allow user profile creation
-- This fixes the "new row violates row-level security policy" error

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- This policy allows users to create their own profile
-- Performance: O(1) - Direct UUID comparison
