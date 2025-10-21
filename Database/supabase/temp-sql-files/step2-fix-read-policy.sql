-- Step 2: Add basic SELECT policy to allow user profile reading
-- This fixes the "Cannot coerce the result to a single JSON object" error

CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- This policy allows users to read their own profile
-- Performance: O(1) - Direct UUID comparison
