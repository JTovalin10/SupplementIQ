-- =================================================================
-- ADD USER ENCRYPTION SALT FOR APPLICATION-LEVEL DATA ENCRYPTION
-- =================================================================
-- This adds a per-user salt for encrypting sensitive user data
-- at the application level (defense-in-depth)
--
-- NOTE: This is NOT for password hashing - Supabase Auth already
-- handles password hashing with bcrypt (which includes its own salt)
--
-- Use cases for this salt:
-- - Encrypting sensitive user preferences
-- - Encrypting personally identifiable information
-- - Additional layer of security for user data
-- =================================================================

-- Add encryption_salt column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS encryption_salt TEXT;

-- Add index for performance (if needed for lookups)
CREATE INDEX IF NOT EXISTS idx_users_encryption_salt ON public.users (encryption_salt);

-- Create function to generate cryptographically secure salt
CREATE OR REPLACE FUNCTION public.generate_user_salt()
RETURNS TEXT AS $$
DECLARE
    salt TEXT;
BEGIN
    -- Generate a 32-byte (256-bit) random salt encoded as hex
    -- This uses PostgreSQL's gen_random_bytes for cryptographic randomness
    salt := encode(gen_random_bytes(32), 'hex');
    RETURN salt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to auto-generate salt on user creation
CREATE OR REPLACE FUNCTION public.auto_generate_user_salt()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate salt if not already set
    IF NEW.encryption_salt IS NULL THEN
        NEW.encryption_salt := public.generate_user_salt();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-generate salt for new users
DROP TRIGGER IF EXISTS users_auto_salt_trigger ON public.users;
CREATE TRIGGER users_auto_salt_trigger
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_user_salt();

-- Backfill salts for existing users
UPDATE public.users
SET encryption_salt = public.generate_user_salt()
WHERE encryption_salt IS NULL;

-- Add NOT NULL constraint after backfill
ALTER TABLE public.users
ALTER COLUMN encryption_salt SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.users.encryption_salt IS 'Per-user salt for application-level encryption of sensitive data. Auto-generated on user creation. This is NOT for password hashing (Supabase Auth handles that).';

-- =================================================================
-- SECURITY NOTES
-- =================================================================
-- 1. Keep this salt in the database (same location as encrypted data)
-- 2. Use environment-based master key for actual encryption
-- 3. Consider row-level security (RLS) policies to restrict access
-- 4. Passwords are already secure in auth.users (bcrypt + salt)
-- 5. This is defense-in-depth, not a replacement for Supabase Auth
-- =================================================================
