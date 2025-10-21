# SupplementIQ - TODO Checklist

## 🚨 Critical Issues

### 1. Login Session Persistence
- **Issue**: Login succeeds but user doesn't stay logged in
- **Root Cause**: Supabase session not persisting properly
- **Location**: `src/lib/contexts/AuthContext.tsx` - session handling
- **Status**: 🔴 HIGH PRIORITY

## 🔧 Technical Debt

### 2. Context Migration Incomplete
- **Issue**: Some components still using old `AppContext` instead of new `AuthContext`
- **Files to Check**:
  - `src/lib/contexts/AppContext.tsx` (may need cleanup)
  - Any components importing from `AppContext`
- **Status**: 🟡 MEDIUM PRIORITY

### 3. Debug Logs Cleanup
- **Issue**: Debug console logs still present in production code
- **Location**: `src/lib/contexts/AuthContext.tsx`
- **Status**: 🟡 LOW PRIORITY

## 🎯 Priority Tasks

### High Priority
1. **Fix Session Persistence**: Ensure login state persists across page refreshes
   - Debug Supabase session handling
   - Check cookie/session storage
   - Verify `onAuthStateChange` callback

2. **Implement Product Submission & Approval Process**: Create functional add new product and approval workflow
   - Build product submission form for users
   - Create admin approval interface
   - Implement approval/rejection workflow
   - Add email notifications for status changes
   - **Status**: 🔴 HIGH PRIORITY

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