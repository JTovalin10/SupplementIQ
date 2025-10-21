# SupplementIQ - Current Issues & TODOs

## 🚨 Critical Issues

### 1. Authentication & Role Detection
- **Issue**: Owner account is being detected as a regular "user" instead of "owner"
- **Fix Applied**: Added special handling for `jtovalin10@gmail.com` to assign 'owner' role
- **Fix Applied**: Updated default role from 'user' to 'newcomer' to match database enum
- **Status**: ✅ FIXED

### 2. User Dashboard Route Issues
- **Issue**: `/user` route was returning 404, dashboard not accessible
- **Fix Applied**: Created redirect from `/user` to `/user/dashboard`
- **Fix Applied**: Updated dashboard to use new `AuthContext` instead of `AppContext`
- **Status**: ✅ FIXED

### 3. RLS Policy Issues
- **Issue**: "new row violates row-level security policy" and "Cannot coerce the result to a single JSON object" errors
- **Fix Applied**: Implemented step-by-step RLS policies (INSERT, SELECT, UPDATE, ADMIN)
- **Fix Applied**: Organized temp SQL files for easy cleanup
- **Status**: ✅ FIXED

### 4. Admin Dashboard User Management
- **Issue**: Hardcoded mock data in user management component
- **Fix Applied**: Created real API endpoints for user CRUD operations
- **Fix Applied**: Added comprehensive search functionality by user ID, username, and email
- **Fix Applied**: Removed all hardcoded user IDs and mock data
- **Status**: ✅ FIXED

### 5. Login Session Persistence
- **Issue**: Login succeeds but user doesn't stay logged in
- **Root Cause**: Supabase session not persisting properly
- **Location**: `src/lib/contexts/AuthContext.tsx` - session handling
- **Status**: 🔴 HIGH PRIORITY

## 🔧 Technical Debt

### 5. Context Migration Incomplete
- **Issue**: Some components still using old `AppContext` instead of new `AuthContext`
- **Files to Check**:
  - `src/lib/contexts/AppContext.tsx` (may need cleanup)
  - Any components importing from `AppContext`
- **Status**: 🟡 MEDIUM PRIORITY

### 6. Debug Logs Cleanup
- **Issue**: Debug console logs still present in production code
- **Location**: `src/lib/contexts/AuthContext.tsx`
- **Status**: 🟡 LOW PRIORITY

### 7. Build Cache Issues
- **Issue**: Next.js build cache corruption causing module resolution errors
- **Fix Applied**: Force clean rebuild resolved immediate issues
- **Status**: ✅ RESOLVED

## 🎯 Tomorrow's Priority Tasks

### 6. Context Migration Incomplete
- **Issue**: Some components still using old `AppContext` instead of new `AuthContext`
- **Files to Check**:
  - `src/lib/contexts/AppContext.tsx` (may need cleanup)
  - Any components importing from `AppContext`
- **Status**: 🟡 MEDIUM PRIORITY

### 7. Debug Logs Cleanup
- **Issue**: Debug console logs still present in production code
- **Location**: `src/lib/contexts/AuthContext.tsx`
- **Status**: 🟡 LOW PRIORITY

### 8. Build Cache Issues
- **Issue**: Next.js build cache corruption causing module resolution errors
- **Fix Applied**: Force clean rebuild resolved immediate issues
- **Status**: ✅ RESOLVED

## 🎯 Priority Tasks

### High Priority
1. **Fix Session Persistence**: Ensure login state persists across page refreshes
   - Debug Supabase session handling
   - Check cookie/session storage
   - Verify `onAuthStateChange` callback

2. **Fix Redis Import Path Issues**: Correct module resolution for Redis client imports
   - Fixed incorrect import paths in rankings, preworkout, and test routes
   - Changed from `@/../../Database/Redis/client` to proper relative paths
   - **Status**: ✅ FIXED

3. **Implement Product Submission & Approval Process**: Create functional add new product and approval workflow
   - Build product submission form for users
   - Create admin approval interface
   - Implement approval/rejection workflow
   - Add email notifications for status changes
   - **Status**: 🔴 HIGH PRIORITY

### Medium Priority
4. **Complete Context Migration**: Remove old `AppContext` dependencies
5. **Test All User Routes**: Verify `/user/dashboard`, `/user/profile` work correctly
6. **Clean Up Debug Logs**: Remove console.log statements from production code

### Low Priority
7. **Add Error Boundaries**: Better error handling for auth failures
8. **Improve Loading States**: Better UX during auth checks

## 🔍 Debugging Notes

### Auth Flow Issues
- Login API returns 200 but session doesn't persist
- User profile fetch may be failing silently
- Role detection logic needs investigation

### Files Modified Today
- `src/lib/contexts/AuthContext.tsx` - Main auth context with CASL integration
- `src/app/user/page.tsx` - Created redirect page
- `src/app/user/dashboard/page.tsx` - Fixed imports
- `src/app/layout.tsx` - Updated to use new AuthProvider

### Environment
- Server running on: `http://localhost:3000` (port 3001/3002 also used)
- Supabase client: `src/lib/database/supabase/client.ts`
- CASL permissions: Integrated but role detection failing

## 📝 Next Steps

1. **Morning**: Debug role detection issue
2. **Afternoon**: Fix session persistence
3. **Evening**: Test complete auth flow and clean up

---
*Created: $(date)*
*Last Updated: $(date)*
