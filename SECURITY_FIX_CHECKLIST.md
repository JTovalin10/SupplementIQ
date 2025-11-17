# 🔒 Security Fix Checklist

## Status Overview

| Security Feature          | Status         | Priority     |
| ------------------------- | -------------- | ------------ |
| Password hashing (bcrypt) | ✅ SECURE      | -            |
| Rate limiting             | ✅ IMPLEMENTED | -            |
| Encryption salts          | ✅ READY       | Setup needed |
| JWT verification          | 🔴 VULNERABLE  | CRITICAL     |

---

## 🚨 CRITICAL: Fix JWT Vulnerabilities (DO THIS FIRST!)

### Step 1: Review the Security Audit

```bash
cat SECURITY_AUDIT.md
```

### Step 2: The Problem

**3 endpoints are vulnerable:**

1. `/api/pending-products` - trusts `x-user-id` header
2. `/api/products/[slug]/reviews` - hardcoded `temp-user-id`
3. `/api/products/[id]/reviews` - hardcoded `temp-user-id`

**Anyone can impersonate any user!**

### Step 3: The Solution (Already Created!)

✅ I created `src/lib/api/auth.ts` with secure helpers

### Step 4: Fix Each Vulnerable Endpoint

#### Fix `/api/pending-products/route.ts`

**Find this code (line 99-100):**

```typescript
const userId = request.headers.get("x-user-id");
const userRole = request.headers.get("x-user-role");
```

**Replace with:**

```typescript
import { requireAuth } from "@/lib/api/auth";

// At the start of your POST function
const authResult = await requireAuth(request);

if (authResult instanceof NextResponse) {
  return authResult; // Returns 401 if not authenticated
}

const { user } = authResult;

// Use user.id instead of the header
// Change all instances of userId to user.id
```

#### Fix `/api/products/[slug]/reviews/route.ts`

**Find this code (line 136):**

```typescript
const userId = "temp-user-id"; // Replace with actual user ID from token
```

**Replace with:**

```typescript
import { requireAuth } from '@/lib/api/auth';

// At the start of your POST function
const authResult = await requireAuth(request);

if (authResult instanceof NextResponse) {
  return authResult;
}

const { user } = authResult;

// Then use user.id in the insert
user_id: user.id, // instead of userId
```

#### Fix `/api/products/[id]/reviews/route.ts`

Same fix as above.

### Step 5: Test the Fixes

**Before:**

```bash
# This works (BAD!)
curl -X POST http://localhost:3000/api/pending-products \
  -H "x-user-id: fake-uuid" \
  -d '{"malicious": "data"}'
```

**After:**

```bash
# This returns 401 (GOOD!)
curl -X POST http://localhost:3000/api/pending-products \
  -d '{"data": "test"}'

# This works with valid JWT (GOOD!)
curl -X POST http://localhost:3000/api/pending-products \
  -H "Authorization: Bearer valid-jwt-token" \
  -d '{"data": "test"}'
```

---

## ✅ Setup Encryption (Optional but Recommended)

### Quick Setup

```bash
# Run the automated setup script
node scripts/setup-encryption.js
```

This will:

1. Generate `USER_DATA_ENCRYPTION_KEY`
2. Add it to `.env.local`
3. Run tests to verify

### Manual Setup

```bash
# 1. Generate key
openssl rand -hex 32

# 2. Add to .env.local
echo "USER_DATA_ENCRYPTION_KEY=<your-key>" >> .env.local

# 3. Run migration (if you have existing users)
psql -h your-db -f Database/supabase/migrations/add_encryption_salt_to_existing_users.sql

# 4. Test
node scripts/test-encryption.js
```

---

## 📋 Complete Checklist

### Immediate (Critical - Do Today!)

- [ ] Read `SECURITY_AUDIT.md`
- [ ] Fix `/api/pending-products` JWT verification
- [ ] Fix `/api/products/[slug]/reviews` JWT verification
- [ ] Fix `/api/products/[id]/reviews` JWT verification
- [ ] Test all fixes work correctly
- [ ] Deploy fixes to production immediately

### This Week

- [ ] Run encryption setup: `node scripts/setup-encryption.js`
- [ ] Run database migration for encryption salts
- [ ] Audit ALL other API routes for similar issues
- [ ] Add authentication tests
- [ ] Enable Row Level Security (RLS) in Supabase

### This Month

- [ ] Set up session timeout
- [ ] Implement refresh token rotation
- [ ] Add audit logging for sensitive actions
- [ ] Set up security monitoring/alerts
- [ ] Penetration testing

---

## 🧪 Testing Your Fixes

### Test 1: Authentication Required

```bash
# Should return 401
curl http://localhost:3000/api/pending-products

# Expected response:
# {
#   "error": "Unauthorized",
#   "message": "Authentication required. Please provide a valid JWT token."
# }
```

### Test 2: Valid JWT Works

```bash
# 1. Login to get token
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "your-password"}' \
  | jq -r '.session.access_token')

# 2. Use token (should work)
curl http://localhost:3000/api/pending-products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "protein", "product_name": "Test Product"}'

# Expected: Success (200 or 201)
```

### Test 3: Fake Headers Don't Work

```bash
# Should return 401 (headers ignored)
curl http://localhost:3000/api/pending-products \
  -H "x-user-id: admin-uuid" \
  -H "x-user-role: admin" \
  -H "Content-Type: application/json" \
  -d '{"category": "protein", "product_name": "Malicious"}'

# Expected response:
# {
#   "error": "Unauthorized",
#   "message": "Authentication required. Please provide a valid JWT token."
# }
```

---

## 📚 Documentation

| Document                              | Purpose                         |
| ------------------------------------- | ------------------------------- |
| `SECURITY_AUDIT.md`                   | Details of JWT vulnerabilities  |
| `SECURITY.md`                         | Complete security architecture  |
| `DATABASE_SECURITY_IMPLEMENTATION.md` | Encryption setup guide          |
| `src/lib/api/auth.ts`                 | Secure authentication helpers   |
| `scripts/README.md`                   | Encryption script documentation |

---

## 🆘 Need Help?

### Common Issues

**Q: How do I get a JWT token for testing?**

```bash
# Login via API
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "your-password"}' \
  | jq -r '.session.access_token'
```

**Q: Where does the JWT token come from in production?**

The client application stores the JWT after login:

```typescript
// After successful login
const { session } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Store the token
const token = session.access_token;

// Send with API requests
fetch("/api/endpoint", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**Q: What if I don't have the encryption key?**

It's already in your `.env.local`:

```bash
grep USER_DATA_ENCRYPTION_KEY .env.local
```

If not, generate one:

```bash
node scripts/generate-encryption-key.js --add
```

---

## ✅ When You're Done

You should have:

1. ✅ Fixed all 3 vulnerable endpoints
2. ✅ All endpoints use `requireAuth()` or similar
3. ✅ No endpoints trust client-provided headers for user ID
4. ✅ Tests pass showing authentication is required
5. ✅ Encryption key generated and set up
6. ✅ Database migration run for encryption salts

**Your app is now secure!** 🎉

---

## 🚀 Deploy Checklist

Before deploying to production:

- [ ] All JWT fixes are in place
- [ ] Tests pass
- [ ] Environment variables set in production
  - [ ] `USER_DATA_ENCRYPTION_KEY` (different from dev!)
  - [ ] All Supabase keys
  - [ ] Redis keys
- [ ] HTTPS is enabled
- [ ] Rate limiting is active
- [ ] Security headers configured
- [ ] Monitoring/alerting set up

---

**REMEMBER: Security is not optional!**

Fix the JWT vulnerabilities BEFORE deploying to production.
