-- Quick Migration: Apply JWT Custom Claims Solution
-- This is the recommended approach for fixing RLS recursion issues

-- Step 1: Apply the JWT custom claims solution
-- Run the main solution file
\i jwt-custom-claims-solution.sql

-- Step 2: Verify the setup
SELECT 
  'JWT Claims Solution Applied Successfully' as status,
  COUNT(*) as user_count 
FROM public.users;

-- Step 3: Test JWT claims functionality
SELECT public.test_jwt_claims() as jwt_test_result;
