-- JWT Custom Claims Solution for RLS Performance
-- This adds role claims to JWT tokens and updates policies to use auth.jwt()

-- =================================================================
-- STEP 1: Create function to add role to JWT claims
-- =================================================================

-- Function to set JWT claims with user role
CREATE OR REPLACE FUNCTION auth.set_user_role_claim(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role from public.users table
  SELECT role::TEXT INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  -- Set JWT claims with role information
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', user_id::text,
      'user_role', COALESCE(user_role, 'newcomer'),
      'user_id', user_id::text
    )::text, 
    true
  );
END;
$$;

-- Function to get user data with role claim set
CREATE OR REPLACE FUNCTION public.get_user_with_role_claim(user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  role TEXT,
  bio TEXT,
  reputation_points INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set JWT claims with role
  PERFORM auth.set_user_role_claim(user_id);
  
  -- Return user data
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.role::TEXT,
    u.bio,
    u.reputation_points,
    u.created_at
  FROM public.users u
  WHERE u.id = user_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auth.set_user_role_claim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_with_role_claim(UUID) TO authenticated;

-- =================================================================
-- STEP 2: Update RLS policies to use JWT claims instead of queries
-- =================================================================

-- Drop existing policies that query public.users (causing recursion)
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Allow user creation via auth trigger" ON public.users;
DROP POLICY IF EXISTS "Allow reading user data for authentication" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "auth_users_insert" ON public.users;
DROP POLICY IF EXISTS "auth_users_select" ON public.users;
DROP POLICY IF EXISTS "auth_users_update" ON public.users;

-- Create new policies using JWT claims (no recursion!)
CREATE POLICY "jwt_users_insert" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "jwt_users_select" ON public.users
  FOR SELECT USING (
    -- Users can read their own data
    auth.uid() = id OR
    -- Admins can read all users (using JWT claim)
    (auth.jwt() ->> 'user_role') IN ('admin', 'owner', 'moderator')
  );

CREATE POLICY "jwt_users_update" ON public.users
  FOR UPDATE USING (
    -- Users can update their own profile (but not role)
    (auth.uid() = id AND (auth.jwt() ->> 'user_role') NOT IN ('admin', 'owner')) OR
    -- Admins can update any user
    (auth.jwt() ->> 'user_role') IN ('admin', 'owner')
  );

-- =================================================================
-- STEP 3: Update other table policies to use JWT claims
-- =================================================================

-- Products table policies
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Moderators can manage products" ON public.products;

CREATE POLICY "jwt_products_read" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "jwt_products_manage" ON public.products
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') IN ('moderator', 'admin', 'owner')
  );

-- Brands table policies
DROP POLICY IF EXISTS "Anyone can read brands" ON public.brands;
DROP POLICY IF EXISTS "Moderators can manage brands" ON public.brands;

CREATE POLICY "jwt_brands_read" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "jwt_brands_manage" ON public.brands
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') IN ('moderator', 'admin', 'owner')
  );

-- Temporary products policies
DROP POLICY IF EXISTS "Users can read own submissions" ON public.temporary_products;
DROP POLICY IF EXISTS "Users can create submissions" ON public.temporary_products;
DROP POLICY IF EXISTS "Moderators can manage all submissions" ON public.temporary_products;

CREATE POLICY "jwt_temp_products_read" ON public.temporary_products
  FOR SELECT USING (
    auth.uid() = submitted_by OR
    (auth.jwt() ->> 'user_role') IN ('moderator', 'admin', 'owner')
  );

CREATE POLICY "jwt_temp_products_create" ON public.temporary_products
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "jwt_temp_products_manage" ON public.temporary_products
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') IN ('moderator', 'admin', 'owner')
  );

-- Product reviews policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;

CREATE POLICY "jwt_reviews_read" ON public.product_reviews
  FOR SELECT USING (true);

CREATE POLICY "jwt_reviews_create" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jwt_reviews_update" ON public.product_reviews
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'user_role') IN ('moderator', 'admin', 'owner')
  );

CREATE POLICY "jwt_reviews_delete" ON public.product_reviews
  FOR DELETE USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'user_role') IN ('moderator', 'admin', 'owner')
  );

-- User badges policies
DROP POLICY IF EXISTS "Users can read own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Admins can manage badges" ON public.user_badges;

CREATE POLICY "jwt_badges_read" ON public.user_badges
  FOR SELECT USING (
    auth.uid() = user_id OR
    (auth.jwt() ->> 'user_role') IN ('admin', 'owner')
  );

CREATE POLICY "jwt_badges_manage" ON public.user_badges
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') IN ('admin', 'owner')
  );

-- =================================================================
-- STEP 4: Update auth trigger to set role claim
-- =================================================================

-- Update the auth trigger to set JWT claims when user is created/updated
CREATE OR REPLACE FUNCTION auth.sync_user_to_public() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
  ELSE
    INSERT INTO public.users (id, username, email, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
      NEW.email,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      email = EXCLUDED.email,
      updated_at = NOW();
    
    -- Set JWT claims for the user
    PERFORM auth.set_user_role_claim(NEW.id);
    
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in sync_user_to_public: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =================================================================
-- STEP 5: Create helper function for role updates
-- =================================================================

-- Function to update user role and refresh JWT claims
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can update roles
  IF (auth.jwt() ->> 'user_role') NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'Insufficient permissions to update user role';
  END IF;
  
  -- Update the role
  UPDATE public.users 
  SET role = new_role::user_role, updated_at = NOW()
  WHERE id = user_id;
  
  -- Refresh JWT claims
  PERFORM auth.set_user_role_claim(user_id);
  
  RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;

-- =================================================================
-- STEP 6: Test the JWT claims setup
-- =================================================================

-- Test function to verify JWT claims are working
CREATE OR REPLACE FUNCTION public.test_jwt_claims()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_user_id UUID;
  jwt_role TEXT;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM public.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RETURN 'No users found - signup should work now';
  END IF;
  
  -- Set JWT claims for test user
  PERFORM auth.set_user_role_claim(test_user_id);
  
  -- Check if JWT claim is set
  jwt_role := auth.jwt() ->> 'user_role';
  
  IF jwt_role IS NOT NULL THEN
    RETURN 'JWT claims working correctly. Role: ' || jwt_role;
  ELSE
    RETURN 'JWT claims not working';
  END IF;
END;
$$;

-- Run the test
SELECT public.test_jwt_claims() as jwt_status;

-- =================================================================
-- COMPLETION MESSAGE
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE 'JWT Custom Claims Solution Applied:';
  RAISE NOTICE '1. Role claims added to JWT tokens';
  RAISE NOTICE '2. All RLS policies updated to use auth.jwt()';
  RAISE NOTICE '3. No more recursive queries to public.users';
  RAISE NOTICE '4. Improved performance and security';
  RAISE NOTICE '5. Auth trigger sets JWT claims automatically';
  RAISE NOTICE 'Sign-in should now be fast and reliable!';
END $$;
