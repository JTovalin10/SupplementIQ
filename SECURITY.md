# Security Architecture - SupplementIQ

## Overview

This document explains the multi-layered security architecture for authentication and data protection in SupplementIQ.

## Table of Contents

1. [Password Security (Supabase Auth)](#password-security)
2. [Rate Limiting (Brute Force Protection)](#rate-limiting)
3. [Application-Level Encryption](#application-level-encryption)
4. [Environment Variables Setup](#environment-variables)
5. [Best Practices](#best-practices)

---

## 1. Password Security (Supabase Auth)

### Architecture

```
┌─────────────────────────────────────────────────────┐
│ Supabase Auth Layer (auth.users table)             │
│ ✓ bcrypt password hashing                          │
│ ✓ Automatic per-password salt generation           │
│ ✓ Secure session management                        │
│ ✓ JWT token handling                               │
└─────────────────────────────────────────────────────┘
                      ↓ (trigger syncs)
┌─────────────────────────────────────────────────────┐
│ Application Layer (public.users table)             │
│ ✓ User profile data                                │
│ ✓ Per-user encryption salt                         │
│ ✓ Role-based access control                        │
└─────────────────────────────────────────────────────┘
```

### How Passwords Are Protected

1. **User registers/logs in** → Password sent via HTTPS
2. **Supabase Auth receives password** → Generates random salt
3. **bcrypt hashing** → `hash = bcrypt(password, salt, 10 rounds)`
4. **Storage** → Only hash stored in `auth.users.encrypted_password`
5. **Verification** → bcrypt compares stored hash with login attempt

**You never need to handle password hashing manually - Supabase does this securely.**

### Key Points

- ✅ Passwords are **NEVER** stored in plain text
- ✅ Each password has a **unique random salt**
- ✅ bcrypt is **industry standard** (used by GitHub, Reddit, etc.)
- ✅ Passwords are **NOT** in your `public.users` table
- ✅ Even database administrators cannot see passwords

---

## 2. Rate Limiting (Brute Force Protection)

### Implementation

Rate limiting prevents attackers from trying many passwords quickly.

**Protected Endpoints:**

- `/api/v1/auth/login` - 5 attempts per 15 minutes
- `/api/v1/auth/register` - 3 attempts per hour
- `/api/auth/login` - 5 attempts per 15 minutes
- `/api/auth/signup` - 3 attempts per hour
- `/api/auth/register` - 3 attempts per hour
- `/api/auth/forgot-password` - 5 attempts per hour
- `/api/auth/reset-password` - 3 attempts per 15 minutes

### How It Works

```typescript
// 1. Client makes login request
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "attempt1"
}

// 2. Rate limit check (before password verification)
const rateLimitResult = await checkAuthRateLimit(request, 'login', email);

// 3. If too many attempts
if (!rateLimitResult.success) {
  return 429 Too Many Requests
  {
    "error": "Too many login attempts",
    "retryAfter": 900, // seconds
    "resetAt": 1234567890 // unix timestamp
  }
}

// 4. If within limit, proceed to password check
```

### Storage

- Rate limit counters stored in **Redis** (sliding window)
- Tracked by **both IP address AND email**
- Automatic expiration after time window
- Successful login **clears** the rate limit

### Attack Scenarios Protected

| Attack Type               | Protection                       |
| ------------------------- | -------------------------------- |
| Single IP, many passwords | ✅ IP-based rate limit           |
| Many IPs, single account  | ✅ Email-based rate limit        |
| Distributed attack        | ✅ Combined IP + email limits    |
| Credential stuffing       | ✅ Rate limits + account lockout |

---

## 3. Application-Level Encryption

### When to Use

The per-user `encryption_salt` is for **application-level encryption** of sensitive user data, NOT for passwords.

**Use cases:**

- Encrypting personally identifiable information (PII)
- Sensitive user preferences
- API keys or tokens
- Private notes or data

**Don't use for:**

- ❌ Passwords (Supabase Auth handles this)
- ❌ Public data (no need to encrypt)
- ❌ Data that needs full-text search

### Schema Addition

Run this migration to add encryption support:

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f Database/supabase/add_user_encryption_salt.sql
```

This adds:

- `encryption_salt` column to `public.users`
- Auto-generation trigger for new users
- Backfills salts for existing users

### Usage Examples

#### 1. Encrypting Sensitive Data

```typescript
import { encryptUserData, decryptUserData } from "@/lib/utils/userEncryption";
import { supabase } from "@/lib/supabase";

// Get user's salt from database
const { data: user } = await supabase
  .from("users")
  .select("encryption_salt")
  .eq("id", userId)
  .single();

// Encrypt sensitive data
const sensitiveData = "user's private API key";
const encrypted = encryptUserData(sensitiveData, user.encryption_salt);

// Store encrypted data in database
await supabase
  .from("user_settings")
  .update({ api_key: encrypted })
  .eq("user_id", userId);
```

#### 2. Decrypting Data

```typescript
// Fetch encrypted data
const { data: settings } = await supabase
  .from("user_settings")
  .select("api_key")
  .eq("user_id", userId)
  .single();

// Get user's salt
const { data: user } = await supabase
  .from("users")
  .select("encryption_salt")
  .eq("id", userId)
  .single();

// Decrypt
const apiKey = decryptUserData(settings.api_key, user.encryption_salt);
```

#### 3. One-Way Hashing (for verification only)

```typescript
import { hashUserData } from "@/lib/utils/userEncryption";

// Hash data for storage (cannot be decrypted)
const hashedToken = hashUserData(userToken, user.encryption_salt);

// Later, verify by hashing again and comparing
const isValid =
  hashUserData(providedToken, user.encryption_salt) === hashedToken;
```

### Encryption Algorithm

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key Derivation:** PBKDF2 (100,000 iterations)
- **Key Sources:** Master key (env) + user salt (database)
- **IV:** Random 16 bytes per encryption
- **Auth Tag:** Prevents tampering

---

## 4. Environment Variables Setup

### Required Variables

Add these to your `.env.local`:

```bash
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Redis (for rate limiting)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_USERNAME=default

# NEW: Master encryption key for user data encryption
# Generate with: openssl rand -hex 32
USER_DATA_ENCRYPTION_KEY=<generate-this-with-openssl-command>
```

### Generate Encryption Key

```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
[System.Convert]::ToHex([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Example output:
# a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

**Store this key securely:**

- ✅ Environment variable
- ✅ Secrets manager (AWS Secrets Manager, Vault, etc.)
- ✅ Never commit to git
- ❌ Don't hardcode in application
- ❌ Don't share via insecure channels

---

## 5. Best Practices

### Password Security

1. **Never implement your own password hashing**
   - Supabase Auth uses bcrypt (industry standard)
   - Includes automatic salt generation
   - Handles timing attack prevention

2. **Use HTTPS everywhere**
   - Passwords sent over encrypted connections
   - Prevents man-in-the-middle attacks

3. **Implement password requirements**

   ```typescript
   // Current requirements in reset-password endpoint
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character
   ```

4. **Use rate limiting** (already implemented)
   - Prevents brute force attacks
   - Protects against credential stuffing

### Database Breach Protection

**If your database is breached, attackers get:**

| Data                | Can Decrypt?                   | Mitigation                       |
| ------------------- | ------------------------------ | -------------------------------- |
| Passwords           | ❌ No - bcrypt hashed          | Supabase Auth security           |
| Password hashes     | ⚠️ Need to crack               | Rate limiting + strong passwords |
| Encrypted user data | ⚠️ If they get master key      | Keep master key in secure vault  |
| User salts          | ⚠️ Only useful with master key | Defense in depth                 |
| Public data         | ✅ Yes                         | Encrypt sensitive fields only    |

**Recommendations:**

1. ✅ Rotate master encryption key periodically
2. ✅ Use different keys for dev/staging/production
3. ✅ Monitor database access logs
4. ✅ Enable Row Level Security (RLS) in Supabase
5. ✅ Implement audit logging for sensitive operations

### Key Rotation

If you need to rotate the master encryption key:

```typescript
// 1. Add new key to environment as USER_DATA_ENCRYPTION_KEY_NEW

// 2. Re-encrypt all sensitive data
async function rotateEncryptionKey(userId: string) {
  const user = await getUserWithSalt(userId);

  // Decrypt with old key
  const oldData = decryptUserDataWithOldKey(encrypted, user.salt);

  // Encrypt with new key
  const newData = encryptUserDataWithNewKey(oldData, user.salt);

  // Update in database
  await updateEncryptedData(userId, newData);
}

// 3. After all data re-encrypted, remove old key
```

---

## Security Checklist

- [x] Passwords hashed with bcrypt (Supabase Auth)
- [x] Per-password salts (automatic via bcrypt)
- [x] Rate limiting on all auth endpoints
- [x] Redis-based sliding window rate limiting
- [x] IP + email combined tracking
- [x] Per-user encryption salts
- [x] AES-256-GCM encryption utility
- [x] Master key in environment variables
- [ ] Enable Row Level Security (RLS) policies
- [ ] Set up audit logging
- [ ] Configure security headers
- [ ] Implement session timeout
- [ ] Add 2FA support (optional)
- [ ] Set up anomaly detection

---

## Questions?

For security-related questions or to report vulnerabilities:

1. Review this documentation
2. Check Supabase Auth documentation
3. Review rate limiting implementation in `src/lib/utils/rateLimit.ts`
4. Review encryption utilities in `src/lib/utils/userEncryption.ts`

**Never implement your own crypto - use established libraries and services.**
