-- Set owner role and username for specific user in database
-- This is the proper way to assign roles and usernames - directly in the database

-- Update the user's role to 'owner', set reputation points, and set proper username
UPDATE public.users 
SET 
  role = 'owner',
  reputation_points = 1000,
  username = 'jtovalin',  -- Set proper username instead of auto-generated
  updated_at = NOW()
WHERE email = 'jtovalin10@gmail.com';

-- Verify the update
SELECT id, email, username, role, reputation_points, created_at, updated_at
FROM public.users 
WHERE email = 'jtovalin10@gmail.com';
