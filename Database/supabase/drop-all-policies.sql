-- Drop ALL RLS policies across all tables
-- This will give us a clean slate to start from

-- First, enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all policies on users table
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "public_read_non_sensitive" ON public.users;
DROP POLICY IF EXISTS "users_delete_none" ON public.users;
DROP POLICY IF EXISTS "users_insert_service_only" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_combined" ON public.users;

-- Drop all policies on product_reviews table
DROP POLICY IF EXISTS "Public can read reviews" ON public.product_reviews;

-- Drop any other policies that might exist
-- (This will handle any policies we might have missed)

-- Verify RLS is enabled and all policies are dropped
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
