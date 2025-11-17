-- =================================================================
-- MIGRATION: Add Encryption Salt to Existing Users
-- =================================================================
-- Run this ONCE to add encryption_salt to existing users
-- Safe to run multiple times (uses WHERE encryption_salt IS NULL)
-- =================================================================

-- Step 1: Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'encryption_salt'
    ) THEN
        ALTER TABLE public.users ADD COLUMN encryption_salt TEXT;
        RAISE NOTICE 'Added encryption_salt column to public.users';
    ELSE
        RAISE NOTICE 'encryption_salt column already exists';
    END IF;
END $$;

-- Step 2: Generate salts for existing users that don't have one
UPDATE public.users
SET encryption_salt = encode(gen_random_bytes(32), 'hex')
WHERE encryption_salt IS NULL;

-- Step 3: Get count of updated users
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM public.users
    WHERE encryption_salt IS NOT NULL;

    RAISE NOTICE 'Total users with encryption_salt: %', updated_count;
END $$;

-- Step 4: Create index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_encryption_salt
ON public.users (encryption_salt)
WHERE encryption_salt IS NOT NULL;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN public.users.encryption_salt IS
'Per-user salt for application-level encryption of sensitive data. Auto-generated on user creation. This is NOT for password hashing - Supabase Auth handles that with bcrypt.';

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================
-- Run these to verify the migration was successful

-- Check that all users have a salt
-- SELECT
--     COUNT(*) as total_users,
--     COUNT(encryption_salt) as users_with_salt,
--     COUNT(*) - COUNT(encryption_salt) as users_without_salt
-- FROM public.users;

-- View sample of salts (first 10 users)
-- SELECT
--     id,
--     username,
--     LEFT(encryption_salt, 16) || '...' as salt_preview,
--     LENGTH(encryption_salt) as salt_length
-- FROM public.users
-- LIMIT 10;

-- Verify salt uniqueness (should return 0 duplicates)
-- SELECT encryption_salt, COUNT(*) as duplicate_count
-- FROM public.users
-- WHERE encryption_salt IS NOT NULL
-- GROUP BY encryption_salt
-- HAVING COUNT(*) > 1;

-- =================================================================
-- NOTES
-- =================================================================
-- 1. Each salt is 64 hex characters (32 bytes of entropy)
-- 2. Salts are unique per user
-- 3. New users will auto-generate salts via the trigger
-- 4. This migration is idempotent (safe to run multiple times)
-- 5. Remember to set USER_DATA_ENCRYPTION_KEY in .env.local
-- =================================================================
