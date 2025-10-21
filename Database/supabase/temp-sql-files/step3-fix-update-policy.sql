-- Step 3: Add UPDATE policy to allow profile updates
-- Only add this after Steps 1 and 2 work

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- This policy allows users to update their own profile
-- Performance: O(1) - Direct UUID comparison
