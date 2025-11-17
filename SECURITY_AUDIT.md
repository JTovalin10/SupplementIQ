# 🚨 CRITICAL SECURITY AUDIT - JWT Authentication Issues

**Date:** 2025-11-16
**Severity:** HIGH
**Status:** REQUIRES IMMEDIATE ATTENTION

---

## Executive Summary

Your application has **CRITICAL authentication vulnerabilities** that allow attackers to impersonate any user. These must be fixed before deploying to production.

### Vulnerabilities Found

| Endpoint                       | Vulnerability                             | Severity    | Status     |
| ------------------------------ | ----------------------------------------- | ----------- | ---------- |
| `/api/pending-products`        | Trusts client-provided `x-user-id` header | 🔴 CRITICAL | VULNERABLE |
| `/api/products/[slug]/reviews` | Hardcoded `temp-user-id`                  | 🔴 CRITICAL | VULNERABLE |
| `/api/products/[id]/reviews`   | Hardcoded `temp-user-id`                  | 🔴 CRITICAL | VULNERABLE |

---

## Vulnerability Details

### 1. 🔴 CRITICAL: `/api/pending-products` - Trusts Client Headers

**File:** `src/app/api/pending-products/route.ts:99-100`

```typescript
// ❌ VULNERABLE CODE
const userId = request.headers.get("x-user-id");
const userRole = request.headers.get("x-user-role");

if (!userId) {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 },
  );
}
```

**Attack Scenario:**

```bash
# Attacker can impersonate ANY user by sending custom headers
curl -X POST https://your-app.com/api/pending-products \
  -H "x-user-id: some-admin-user-uuid" \
  -H "x-user-role: admin" \
  -H "Content-Type: application/json" \
  -d '{"malicious": "data"}'
```

**Impact:**

- ✅ Attacker can submit products as any user
- ✅ Attacker can bypass reputation/role checks
- ✅ Attacker can impersonate admins
- ✅ Complete authentication bypass

---

### 2. 🔴 CRITICAL: `/api/products/[slug]/reviews` - Hardcoded User ID

**File:** `src/app/api/products/[slug]/reviews/route.ts:136`

```typescript
// ❌ VULNERABLE CODE
// TODO: Extract user ID from JWT token
const userId = "temp-user-id"; // Replace with actual user ID from token

const { data: review, error } = await supabase.from("product_reviews").insert({
  product_id: parseInt(slug),
  user_id: userId, // ← All reviews assigned to 'temp-user-id'
  rating: body.rating,
  title: body.title,
  comment: body.comment,
  // ...
});
```

**Impact:**

- ✅ All reviews assigned to same user ID
- ✅ Cannot track who wrote reviews
- ✅ Anyone can submit reviews
- ✅ Review system is broken

---

### 3. 🔴 CRITICAL: `/api/products/[id]/reviews` - Same Issue

**File:** `src/app/api/products/[id]/reviews/route.ts:136`

Same vulnerability as #2 - hardcoded `temp-user-id`.

---

## ✅ Secure Endpoints (For Reference)

These endpoints are doing it RIGHT:

### Example 1: `/api/v1/auth/me`

```typescript
// ✅ SECURE CODE
const token = request.headers.get("Authorization")?.replace("Bearer ", "");

if (!token) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const {
  data: { user },
  error,
} = await supabase.auth.getUser(token);

if (error || !user) {
  return NextResponse.json({ error: "Invalid token" }, { status: 401 });
}

// Now user.id is verified and can be trusted
```

### Example 2: `/api/v1/users/profile`

```typescript
// ✅ SECURE CODE
const token = request.headers.get("Authorization")?.replace("Bearer ", "");

const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser(token);

if (authError || !user) {
  return NextResponse.json(
    { error: "Unauthorized - Invalid or expired token" },
    { status: 401 },
  );
}

// user.id is verified from JWT - can be trusted
```

---

## 🛡️ How to Fix (Step-by-Step)

### Create a Reusable Auth Helper

**File:** `src/lib/api/auth.ts` (CREATE THIS)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Verify JWT token and return authenticated user
 * Returns null if authentication fails
 */
export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthenticatedUser | null> {
  // Get token from Authorization header
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const supabase = await createClient();

    // Verify JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      role: user.user_metadata?.role,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

/**
 * Require authentication - returns user or 401 response
 */
export async function requireAuth(
  request: NextRequest,
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const user = await authenticateRequest(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized - Authentication required" },
      { status: 401 },
    );
  }

  return { user };
}

/**
 * Require specific role - returns user or 403 response
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[],
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Fetch full user data from database to get role
  const supabase = await createClient();
  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!allowedRoles.includes(userData.role)) {
    return NextResponse.json(
      { error: "Forbidden - Insufficient permissions" },
      { status: 403 },
    );
  }

  return { user: { ...user, role: userData.role } };
}
```

---

### Fix #1: `/api/pending-products`

**BEFORE:**

```typescript
// ❌ VULNERABLE
const userId = request.headers.get("x-user-id");
const userRole = request.headers.get("x-user-role");
```

**AFTER:**

```typescript
// ✅ SECURE
import { requireAuth } from '@/lib/api/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user via JWT
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const { user } = authResult;

    // Now user.id is verified from JWT and can be trusted
    const body = await request.json();
    const validatedData = PendingProductRequestSchema.parse(body);

    // Get user's reputation points and role from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("reputation_points, role")
      .eq("id", user.id) // ← Use verified user.id from JWT
      .single();

    // ... rest of the code
  }
}
```

---

### Fix #2: `/api/products/[slug]/reviews`

**BEFORE:**

```typescript
// ❌ VULNERABLE
const userId = "temp-user-id";
```

**AFTER:**

```typescript
// ✅ SECURE
import { requireAuth } from '@/lib/api/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user via JWT
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Return 401 if not authenticated
    }

    const { user } = authResult;

    const body = await request.json();

    if (!body.rating || !body.title || !body.comment) {
      return NextResponse.json(
        { error: 'Rating, title, and comment are required' },
        { status: 400 }
      );
    }

    const { data: review, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: parseInt(slug),
        user_id: user.id, // ← Use verified user.id from JWT
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        // ...
      })
      .select()
      .single();

    // ... rest of the code
  }
}
```

---

## 🔍 How JWT Authentication Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User logs in via /api/v1/auth/login                     │
│    - Supabase verifies password                            │
│    - Returns JWT token                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Client stores JWT token                                 │
│    - In memory, localStorage, or httpOnly cookie           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Client sends token with every request                   │
│    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Server verifies JWT token                               │
│    - Calls supabase.auth.getUser(token)                    │
│    - Supabase verifies signature and expiration            │
│    - Returns user object if valid                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Server uses verified user.id                            │
│    - user.id is cryptographically verified                 │
│    - Cannot be faked or tampered with                      │
│    - Safe to use for database queries                      │
└─────────────────────────────────────────────────────────────┘
```

**Why this is secure:**

- ✅ JWT is signed by Supabase with secret key
- ✅ Signature is verified on every request
- ✅ Token contains user ID encrypted
- ✅ Cannot be faked without Supabase's secret key
- ✅ Token expires after set time (default 1 hour)

**Why headers are NOT secure:**

- ❌ Headers are set by client
- ❌ Client can send ANY value
- ❌ No cryptographic verification
- ❌ Trivial to fake with curl/Postman

---

## 📋 Action Items (Priority Order)

### Immediate (Before ANY production use)

1. ✅ Create `src/lib/api/auth.ts` helper
2. ✅ Fix `/api/pending-products` - use JWT auth
3. ✅ Fix `/api/products/[slug]/reviews` - use JWT auth
4. ✅ Fix `/api/products/[id]/reviews` - use JWT auth
5. ✅ Audit ALL API routes for similar issues

### Short-term (This week)

6. ✅ Add authentication tests
7. ✅ Enable Row Level Security (RLS) in Supabase
8. ✅ Add rate limiting to sensitive endpoints (already done for auth)
9. ✅ Set up security monitoring

### Medium-term (This month)

10. ✅ Implement refresh token rotation
11. ✅ Add session timeout
12. ✅ Set up audit logging
13. ✅ Penetration testing

---

## 🧪 How to Test Authentication

### Test 1: Valid JWT Token

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  | jq -r '.session.access_token')

# Use token
curl http://localhost:3000/api/pending-products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "protein", "product_name": "Test"}'

# Should succeed ✅
```

### Test 2: Invalid/Missing Token

```bash
# No token
curl http://localhost:3000/api/pending-products \
  -H "Content-Type: application/json" \
  -d '{"category": "protein", "product_name": "Test"}'

# Should return 401 Unauthorized ✅
```

### Test 3: Attempt to Fake User ID (Current Vulnerability)

```bash
# ❌ CURRENT BEHAVIOR - THIS WORKS BUT SHOULDN'T!
curl -X POST http://localhost:3000/api/pending-products \
  -H "x-user-id: admin-uuid-here" \
  -H "x-user-role: admin" \
  -H "Content-Type: application/json" \
  -d '{"malicious": "data"}'

# Currently succeeds - AFTER FIX should return 401 ✅
```

---

## 📚 References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## Summary

**Current Status: 🔴 VULNERABLE**

- ❌ 3 endpoints allow authentication bypass
- ❌ Attacker can impersonate any user
- ❌ Not safe for production

**After Fixes: 🟢 SECURE**

- ✅ All endpoints verify JWT tokens
- ✅ User identity cryptographically verified
- ✅ Safe for production deployment

**Estimated Fix Time:** 2-3 hours

---

**TAKE ACTION NOW!** These vulnerabilities are critical and trivial to exploit.
