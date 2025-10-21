# Step-by-Step RLS Policy Testing

This directory contains the essential step-by-step SQL files to fix RLS policy issues.

## Files Overview

### Step-by-Step Testing Files (Run in Order)
1. **`step1-fix-insert-policy.sql`** - Fixes INSERT policy violation
   - Allows users to create their own profile
   - Fixes: "new row violates row-level security policy"

2. **`step2-fix-read-policy.sql`** - Fixes SELECT policy violation  
   - Allows users to read their own profile
   - Fixes: "Cannot coerce the result to a single JSON object"

3. **`step3-fix-update-policy.sql`** - Adds UPDATE policy
   - Allows users to update their own profile
   - Only run if Steps 1-2 work

4. **`step4-fix-admin-policies.sql`** - Adds admin policies
   - Allows admins to read all users and update roles
   - Only run if Steps 1-3 work

## Testing Process

1. **Run Step 1** → Test login
2. **If login works** → Run Step 2 → Test login
3. **If login works** → Run Step 3 → Test login  
4. **If login works** → Run Step 4 → Test login

## Cleanup Instructions

Once RLS policies are working correctly, delete this directory:

```bash
rm -rf Database/supabase/temp-sql-files/
```

## Current Status

Clean, focused approach with only the essential files needed to fix the RLS issues step by step.
