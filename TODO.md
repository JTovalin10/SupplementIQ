# SupplementIQ - Current Issues & TODOs

## 🚨 Critical Issues

### 1. Authentication & Role Detection
- **Issue**: Owner account is being detected as a regular "user" instead of "owner"
- **Impact**: Role-based permissions not working correctly
- **Location**: `src/lib/contexts/AuthContext.tsx` - `fetchUserProfile` function
- **Status**: 🔴 HIGH PRIORITY

### 2. User Dashboard Route Issues
- **Issue**: `/user` route was returning 404, dashboard not accessible
- **Fix Applied**: Created redirect from `/user` to `/user/dashboard`
- **Fix Applied**: Updated dashboard to use new `AuthContext` instead of `AppContext`
- **Status**: ✅ FIXED

### 3. Login Session Persistence
- **Issue**: Login succeeds but user doesn't stay logged in
- **Root Cause**: Supabase session not persisting properly
- **Location**: `src/lib/contexts/AuthContext.tsx` - session handling
- **Status**: 🔴 HIGH PRIORITY

## 🔧 Technical Debt

### 4. Context Migration Incomplete
- **Issue**: Some components still using old `AppContext` instead of new `AuthContext`
- **Files to Check**:
  - `src/lib/contexts/AppContext.tsx` (may need cleanup)
  - Any components importing from `AppContext`
- **Status**: 🟡 MEDIUM PRIORITY

### 5. Debug Logs Cleanup
- **Issue**: Debug console logs still present in production code
- **Location**: `src/lib/contexts/AuthContext.tsx`
- **Status**: 🟡 LOW PRIORITY

### 6. Build Cache Issues
- **Issue**: Next.js build cache corruption causing module resolution errors
- **Fix Applied**: Force clean rebuild resolved immediate issues
- **Status**: ✅ RESOLVED

## 🎯 Tomorrow's Priority Tasks

### High Priority
1. **Fix Role Detection**: Investigate why owner account shows as "user"
   - Check Supabase users table for correct role assignment
   - Verify `fetchUserProfile` function logic
   - Test role-based permissions with CASL

2. **Fix Session Persistence**: Ensure login state persists across page refreshes
   - Debug Supabase session handling
   - Check cookie/session storage
   - Verify `onAuthStateChange` callback

### Medium Priority
3. **Complete Context Migration**: Remove old `AppContext` dependencies
4. **Test All User Routes**: Verify `/user/dashboard`, `/user/profile` work correctly
5. **Clean Up Debug Logs**: Remove console.log statements from production code

### Low Priority
6. **Add Error Boundaries**: Better error handling for auth failures
7. **Improve Loading States**: Better UX during auth checks

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
