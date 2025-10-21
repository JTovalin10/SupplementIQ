-- Set owner role for specific user in database
-- This is the proper way to assign roles - directly in the database

-- Update the user's role to 'owner' and set reputation points
UPDATE public.users 
SET 
  role = 'owner',
  reputation_points = 1000,
  updated_at = NOW()
WHERE email = 'jtovalin10@gmail.com';

-- Verify the update
SELECT id, email, role, reputation_points, created_at, updated_at
FROM public.users 
WHERE email = 'jtovalin10@gmail.com';
