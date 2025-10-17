# SupplementIQ TODO

## Current Issues

### 🔴 High Priority
- [ ] **API 500 Internal Server Error**: Dashboard API endpoints are returning 500 errors
  - Frontend: `fetchWithAuth` failing with 500 status
  - Backend: JWT token verification issues ("invalid JWT: unable to parse or verify signature")
  - Status: Authentication flow partially working but API calls failing

### 🟡 Medium Priority
- [ ] **Port Configuration**: Frontend running on port 3001 instead of 3000
  - Need to update Next.js proxy configuration to match current port
  - Update documentation to reflect correct ports

### 🟢 Low Priority
- [ ] **C++ SecurityTree Module**: Module not found but gracefully falling back to TypeScript
  - Error: Cannot find module 'security_tree_addon.node'
  - Status: Not blocking functionality, fallback working

## Completed Tasks ✅

### Authentication & Backend
- [x] Fixed backend Supabase connection by loading correct environment variables
- [x] Updated backend to use proper Supabase JWT verification
- [x] Created debug endpoint to verify user authentication
- [x] Verified user exists in both Supabase Auth and users table
- [x] User has correct 'owner' role with username "Slime"

### Frontend & Build
- [x] Fixed Next.js Turbopack runtime errors by clearing build cache
- [x] Frontend loading properly with clean HTML content
- [x] Dashboard components rendering without build errors

### Infrastructure
- [x] Created comprehensive README with setup instructions
- [x] Set up proper environment variable loading
- [x] Backend running on port 3002
- [x] Frontend running (currently on port 3001)

## Next Steps

1. **Debug JWT Token Issues**
   - Investigate why frontend JWT tokens are malformed
   - Check if Supabase client is generating tokens correctly
   - Verify token format matches backend expectations

2. **Fix API Endpoints**
   - Test dashboard API endpoints individually
   - Ensure proper error handling and logging
   - Verify middleware authentication flow

3. **Port Configuration**
   - Standardize on port 3000 for frontend
   - Update proxy configuration
   - Update documentation

## Notes

- Backend is successfully connecting to hosted Supabase instance
- User authentication is working at the database level
- Issue appears to be in JWT token format/validation between frontend and backend
- All build and infrastructure issues have been resolved
