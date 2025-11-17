/**
 * User Data Encryption Utility
 *
 * Provides application-level encryption for sensitive user data using
 * per-user salts from the database combined with environment-based master key.
 *
 * This is defense-in-depth - Supabase Auth already handles password security.
 *
 * Use cases:
 * - Encrypting sensitive user preferences
 * - Encrypting personally identifiable information
 * - Additional security layer for user data
 */

import crypto from "crypto";

/**
 * Get master encryption key from environment
 * This should be a 32-byte hex string stored in environment variables
 */
function getMasterKey(): Buffer {
  const masterKey = process.env.USER_DATA_ENCRYPTION_KEY;

  if (!masterKey) {
    throw new Error(
      "USER_DATA_ENCRYPTION_KEY not set in environment variables. " +
        "Generate one with: openssl rand -hex 32",
    );
  }

  // Master key should be 64 hex characters (32 bytes)
  if (masterKey.length !== 64) {
    throw new Error(
      "USER_DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes). " +
        "Generate with: openssl rand -hex 32",
    );
  }

  return Buffer.from(masterKey, "hex");
}

/**
 * Derive an encryption key from master key and user salt
 * Uses PBKDF2 for key derivation
 */
function deriveKey(userSalt: string): Buffer {
  const masterKey = getMasterKey();
  const saltBuffer = Buffer.from(userSalt, "hex");

  // Derive a 32-byte key using PBKDF2
  const iterations = 100000;
  const keyLength = 32;
  const digest = "sha256";

  return crypto.pbkdf2Sync(
    masterKey,
    saltBuffer,
    iterations,
    keyLength,
    digest,
  );
}

/**
 * Encrypt sensitive user data
 *
 * @param data - The data to encrypt (string)
 * @param userSalt - The user's encryption salt from database
 * @returns Encrypted data as hex string (format: iv:encrypted_data:auth_tag)
 */
export function encryptUserData(data: string, userSalt: string): string {
  if (!data) {
    throw new Error("Data to encrypt cannot be empty");
  }

  if (!userSalt) {
    throw new Error("User salt is required for encryption");
  }

  // Derive encryption key
  const key = deriveKey(userSalt);

  // Generate random IV (Initialization Vector)
  const iv = crypto.randomBytes(16);

  // Create cipher using AES-256-GCM (authenticated encryption)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  // Encrypt the data
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Return format: iv:encrypted_data:auth_tag (all hex encoded)
  return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}

/**
 * Decrypt sensitive user data
 *
 * @param encryptedData - The encrypted data (format: iv:encrypted_data:auth_tag)
 * @param userSalt - The user's encryption salt from database
 * @returns Decrypted data as string
 */
export function decryptUserData(
  encryptedData: string,
  userSalt: string,
): string {
  if (!encryptedData) {
    throw new Error("Encrypted data cannot be empty");
  }

  if (!userSalt) {
    throw new Error("User salt is required for decryption");
  }

  // Parse the encrypted data
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, encryptedHex, authTagHex] = parts;

  // Derive encryption key
  const key = deriveKey(userSalt);

  // Convert hex strings to buffers
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  // Create decipher
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt the data
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Hash sensitive data for comparison (one-way)
 * Use this when you only need to verify data, not retrieve it
 *
 * @param data - The data to hash
 * @param userSalt - The user's salt from database
 * @returns Hash as hex string
 */
export function hashUserData(data: string, userSalt: string): string {
  if (!data) {
    throw new Error("Data to hash cannot be empty");
  }

  if (!userSalt) {
    throw new Error("User salt is required for hashing");
  }

  const masterKey = getMasterKey();
  const saltBuffer = Buffer.from(userSalt, "hex");

  // Combine master key and user salt for hashing
  const combinedSalt = Buffer.concat([masterKey, saltBuffer]);

  // Use PBKDF2 for secure hashing
  const iterations = 100000;
  const keyLength = 32;
  const digest = "sha256";

  return crypto
    .pbkdf2Sync(data, combinedSalt, iterations, keyLength, digest)
    .toString("hex");
}

/**
 * Generate a new user salt
 * This is also handled by the database trigger, but provided here for testing
 *
 * @returns New salt as hex string
 */
export function generateUserSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Example usage patterns
 */
export const examples = {
  // Encrypting sensitive user data
  async encryptUserEmail(email: string, userId: string): Promise<string> {
    // Fetch user salt from database
    // const { data } = await supabase
    //   .from('users')
    //   .select('encryption_salt')
    //   .eq('id', userId)
    //   .single();
    //
    // return encryptUserData(email, data.encryption_salt);
    return "See implementation above";
  },

  // Decrypting sensitive user data
  async decryptUserEmail(
    encryptedEmail: string,
    userId: string,
  ): Promise<string> {
    // Fetch user salt from database
    // const { data } = await supabase
    //   .from('users')
    //   .select('encryption_salt')
    //   .eq('id', userId)
    //   .single();
    //
    // return decryptUserData(encryptedEmail, data.encryption_salt);
    return "See implementation above";
  },

  // Hashing for verification only
  async hashApiKey(apiKey: string, userId: string): Promise<string> {
    // Fetch user salt from database
    // const { data } = await supabase
    //   .from('users')
    //   .select('encryption_salt')
    //   .eq('id', userId)
    //   .single();
    //
    // return hashUserData(apiKey, data.encryption_salt);
    return "See implementation above";
  },
};
