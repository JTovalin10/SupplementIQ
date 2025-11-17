# Scripts Directory

This directory contains utility scripts for setting up and testing the encryption system.

## Quick Start

**Recommended:** Run the setup script to configure everything automatically:

```bash
# Cross-platform (Windows, Mac, Linux)
node scripts/setup-encryption.js

# Or on Mac/Linux with bash
bash scripts/setup-encryption.sh
```

This will:

1. ✅ Create `.env.local` from `.env.example` (if needed)
2. ✅ Generate a secure encryption key
3. ✅ Add it to your `.env.local`
4. ✅ Run tests to verify everything works

## Available Scripts

### 1. `setup-encryption.js` (Recommended)

**Cross-platform setup script** - works on Windows, Mac, and Linux.

```bash
node scripts/setup-encryption.js
```

**What it does:**

- Creates `.env.local` if it doesn't exist
- Generates `USER_DATA_ENCRYPTION_KEY`
- Adds the key to `.env.local`
- Runs encryption tests
- Shows next steps

**When to use:**

- Initial setup
- When you need to rotate encryption keys
- To verify encryption is working

---

### 2. `setup-encryption.sh`

**Bash version** of the setup script (Mac/Linux only).

```bash
bash scripts/setup-encryption.sh
```

**Requirements:**

- Bash shell
- OpenSSL or Node.js

---

### 3. `generate-encryption-key.js`

**Generate a new encryption key** without modifying `.env.local`.

```bash
# Just generate and display
node scripts/generate-encryption-key.js

# Generate and add to .env.local
node scripts/generate-encryption-key.js --add
```

**Output:**

```
🔑  USER DATA ENCRYPTION KEY GENERATOR
✅ Generated a secure 256-bit encryption key:

   a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1

📋 Add this to your .env.local file:

   USER_DATA_ENCRYPTION_KEY=a3f7b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

**When to use:**

- Generate keys for different environments (dev/staging/prod)
- Rotate encryption keys
- Get a key to add to hosting provider (Vercel, etc.)

---

### 4. `test-encryption.js`

**Test the encryption utilities** to ensure they work correctly.

```bash
node scripts/test-encryption.js
```

**Tests:**

- ✅ Salt generation
- ✅ Encryption/decryption
- ✅ Encrypted data format
- ✅ Different salts produce different outputs
- ✅ Random IV (Initialization Vector)
- ✅ Wrong salt fails decryption
- ✅ Tampering detection
- ✅ Hash function consistency
- ✅ Unicode and special characters
- ✅ Error handling
- ✅ Large data encryption

**Output:**

```
🧪  USER DATA ENCRYPTION TEST SUITE
Testing: Generate user salt... ✅ PASS
Testing: Basic encryption/decryption... ✅ PASS
...

📊 TEST SUMMARY
   ✅ Passed: 13
   ❌ Failed: 0
   📈 Total:  13

🎉 All tests passed! Encryption is working correctly.
```

**When to use:**

- After initial setup
- After changing encryption code
- Before deploying to production
- Debugging encryption issues

---

## Workflow

### Initial Setup

1. **Run setup script:**

   ```bash
   node scripts/setup-encryption.js
   ```

2. **Run database migration:**

   ```sql
   -- Via psql
   psql -h your-db -f Database/supabase/migrations/add_encryption_salt_to_existing_users.sql

   -- Or via Supabase dashboard (SQL Editor)
   ```

3. **Verify everything works:**

   ```bash
   node scripts/test-encryption.js
   ```

4. **Start using encryption in your app:**
   ```typescript
   import {
     encryptUserData,
     decryptUserData,
   } from "@/lib/utils/userEncryption";
   ```

### Production Deployment

1. **Generate production key:**

   ```bash
   node scripts/generate-encryption-key.js
   ```

2. **Add to hosting provider:**
   - **Vercel:** Settings → Environment Variables
   - **Railway:** Variables tab
   - **Render:** Environment → Environment Variables
   - **AWS/GCP:** Secrets Manager

3. **Use DIFFERENT keys for each environment:**
   - Development: `.env.local`
   - Staging: Staging environment variables
   - Production: Production environment variables

### Key Rotation

1. **Generate new key:**

   ```bash
   node scripts/generate-encryption-key.js
   ```

2. **Update environment variable:**
   - Add as `USER_DATA_ENCRYPTION_KEY_NEW`

3. **Re-encrypt existing data:**

   ```typescript
   // Script to re-encrypt all data with new key
   // See SECURITY.md for details
   ```

4. **Remove old key:**
   - After all data is re-encrypted

---

## Troubleshooting

### Error: "USER_DATA_ENCRYPTION_KEY not set"

**Solution:**

```bash
# Run setup script
node scripts/setup-encryption.js

# Or manually add to .env.local
USER_DATA_ENCRYPTION_KEY=your-64-char-hex-key
```

### Error: "Key must be 64 hex characters"

**Problem:** Invalid key format

**Solution:**

```bash
# Generate a valid key
node scripts/generate-encryption-key.js --add
```

### Tests failing

**Check:**

1. Is `USER_DATA_ENCRYPTION_KEY` set in `.env.local`?
2. Is the key exactly 64 hex characters?
3. Are you running from the project root?

**Debug:**

```bash
# Check environment
echo $USER_DATA_ENCRYPTION_KEY

# Re-run setup
node scripts/setup-encryption.js

# Run tests with verbose output
node scripts/test-encryption.js
```

---

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit `.env.local` to git**
   - It's in `.gitignore` by default
   - Contains sensitive keys

2. **Use different keys for each environment**
   - Development: Local `.env.local`
   - Production: Secrets manager

3. **Rotate keys periodically**
   - Quarterly or after team changes
   - Requires re-encrypting data

4. **Store production keys securely**
   - AWS Secrets Manager
   - Google Cloud Secret Manager
   - HashiCorp Vault
   - Hosting provider's secrets

5. **Backup your keys**
   - If you lose the key, encrypted data is GONE
   - Store in password manager or secure vault

---

## Next Steps

After running the setup scripts:

1. ✅ Read `DATABASE_SECURITY_IMPLEMENTATION.md`
2. ✅ Read `SECURITY.md` for complete docs
3. ✅ Run database migration
4. ✅ Start encrypting sensitive data
5. ✅ Set up production keys

---

## Questions?

See documentation:

- `DATABASE_SECURITY_IMPLEMENTATION.md` - Quick start guide
- `SECURITY.md` - Complete security architecture
- `src/lib/utils/userEncryption.ts` - Encryption utilities with examples
