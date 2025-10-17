# JWT Authentication Setup

## Overview
This application now uses JWT (JSON Web Tokens) for authentication instead of Supabase Auth. This provides better performance and eliminates the need for constant database checks.

## Environment Variables
Create a `.env.local` file with the following variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-random
JWT_EXPIRES_IN=7d

# Supabase Configuration (for database access)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Database Setup

### 1. Create Users Table
Make sure your `users` table has the following columns:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);
```

### 2. Create Test Users
Run these SQL commands in your Supabase SQL editor to create test users:

```sql
-- Owner User
INSERT INTO users (email, username, role, password_hash, created_at, updated_at) VALUES (
  'owner@example.com',
  'owner_user',
  'owner',
  '$2b$12$cKC5irBxWkZPXd0cc//gBedNRPaEzbsjkzr3uF0w2UPCjCtJ.LgAi',
  NOW(),
  NOW()
);

-- Admin User
INSERT INTO users (email, username, role, password_hash, created_at, updated_at) VALUES (
  'admin@example.com',
  'admin_user',
  'admin',
  '$2b$12$ywvamTokB0M9Xo8mgAVhtuDeybnOVu8QJTak/CJfXy4KeyxxGLjZG',
  NOW(),
  NOW()
);

-- Moderator User
INSERT INTO users (email, username, role, password_hash, created_at, updated_at) VALUES (
  'moderator@example.com',
  'moderator_user',
  'moderator',
  '$2b$12$3H9.WEFl9yLBn/9vQvoaOOZOEvwK1x18H7poXK.jp5MZYx934Lywq',
  NOW(),
  NOW()
);

-- Regular User
INSERT INTO users (email, username, role, password_hash, created_at, updated_at) VALUES (
  'user@example.com',
  'regular_user',
  'user',
  '$2b$12$ztpiash0l7LZlK/2QKIXfOBukFaJ/qZKbkvLd/RQ7jajHvIaLTIdm',
  NOW(),
  NOW()
);
```

**Test Credentials:**
- **Owner:** owner@example.com / password123
- **Admin:** admin@example.com / password123
- **Moderator:** moderator@example.com / password123
- **User:** user@example.com / password123

## How JWT Authentication Works

### 1. Login Flow
1. User submits email/password to `/api/auth/login`
2. Server verifies credentials against database
3. Server generates JWT access token (1 hour) and refresh token (7 days)
4. Tokens are returned to client and stored in localStorage
5. Client uses access token for all subsequent API requests

### 2. API Protection
- All protected routes use `protectRoute()` middleware
- JWT tokens are verified on each request
- No database lookups needed for authentication checks
- Role-based access control built into JWT payload

### 3. Token Refresh
- Access tokens expire after 1 hour
- Refresh tokens are used to get new access tokens
- Automatic token refresh happens in the background
- Users stay logged in for 7 days (refresh token lifetime)

## Key Benefits

### Performance
- ✅ **No constant database checks** - JWT verification is stateless
- ✅ **Faster API responses** - No database queries for auth
- ✅ **Reduced server load** - Less database connections needed

### Security
- ✅ **Stateless authentication** - No server-side session storage
- ✅ **Role-based access control** - Built into JWT payload
- ✅ **Token expiration** - Automatic security through time limits
- ✅ **Password hashing** - bcrypt with salt rounds

### User Experience
- ✅ **Persistent login** - Users stay logged in across browser sessions
- ✅ **Automatic refresh** - Seamless token renewal
- ✅ **Fast page loads** - No auth delays

## File Structure

```
src/lib/auth/
├── jwt-utils.ts          # JWT token generation and verification
├── jwt-middleware.ts     # API route protection middleware

src/lib/contexts/
├── JWTAuthContext.tsx    # React context for JWT auth state

src/app/api/auth/
├── login/route.ts        # Login endpoint
├── signup/route.ts       # Signup endpoint
└── refresh/route.ts      # Token refresh endpoint

src/app/api/v1/admin/dashboard/
├── stats/route.ts        # Protected dashboard stats
├── pending-submissions/route.ts
├── recent-activity/route.ts
└── system-logs/route.ts
```

## Usage Examples

### Protecting API Routes
```typescript
import { protectRoute } from '@/lib/auth/jwt-middleware';

export const GET = protectRoute(['admin', 'owner'])(
  async (request, user) => {
    // user object contains: { userId, email, role, username }
    return NextResponse.json({ data: 'protected data' });
  }
);
```

### Using Auth in Components
```typescript
import { useJWTAuth } from '@/lib/contexts/JWTAuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useJWTAuth();
  
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }
  
  return <Dashboard user={user} />;
}
```

## Migration Notes

### What Changed
- ✅ Replaced Supabase Auth with JWT
- ✅ Added password hashing with bcrypt
- ✅ Created new authentication API routes
- ✅ Updated dashboard to use JWT-protected endpoints
- ✅ Added automatic token refresh

### What Stays the Same
- ✅ Database structure (users table)
- ✅ Role-based permissions (user, moderator, admin, owner)
- ✅ Dashboard functionality
- ✅ UI/UX experience

The JWT implementation provides the same functionality as before but with significantly better performance and a more robust authentication system!
