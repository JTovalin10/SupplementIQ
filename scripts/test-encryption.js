/**
 * Test the user data encryption utilities
 *
 * This tests:
 * 1. Key generation
 * 2. Encryption/decryption
 * 3. Hash verification
 * 4. Error handling
 *
 * Run with: node scripts/test-encryption.js
 */

const crypto = require("crypto");

// Set a test encryption key if not set
if (!process.env.USER_DATA_ENCRYPTION_KEY) {
  console.log("⚠️  USER_DATA_ENCRYPTION_KEY not set in environment");
  console.log("   Using a test key for demonstration purposes\n");
  process.env.USER_DATA_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
}

// Import the encryption utilities
// Note: This uses a synchronous approach since we're in a script
const {
  encryptUserData,
  decryptUserData,
  hashUserData,
  generateUserSalt,
} = require("../src/lib/utils/userEncryption");

console.log("\n" + "=".repeat(70));
console.log("🧪  USER DATA ENCRYPTION TEST SUITE");
console.log("=".repeat(70) + "\n");

let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  try {
    process.stdout.write(`Testing: ${testName}... `);
    testFn();
    console.log("✅ PASS");
    passedTests++;
  } catch (error) {
    console.log("❌ FAIL");
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

// Test 1: Generate user salt
runTest("Generate user salt", () => {
  const salt = generateUserSalt();
  if (salt.length !== 64)
    throw new Error(`Expected salt length 64, got ${salt.length}`);
  if (!/^[0-9a-f]+$/.test(salt)) throw new Error("Salt should be hex string");
});

// Test 2: Basic encryption/decryption
runTest("Basic encryption/decryption", () => {
  const testSalt = generateUserSalt();
  const testData = "This is sensitive user data";

  const encrypted = encryptUserData(testData, testSalt);
  const decrypted = decryptUserData(encrypted, testSalt);

  if (decrypted !== testData) {
    throw new Error(
      `Decrypted data doesn't match: "${decrypted}" !== "${testData}"`,
    );
  }
});

// Test 3: Encrypted format
runTest("Encrypted data format", () => {
  const testSalt = generateUserSalt();
  const testData = "test";

  const encrypted = encryptUserData(testData, testSalt);
  const parts = encrypted.split(":");

  if (parts.length !== 3) {
    throw new Error(
      `Expected 3 parts (iv:encrypted:authTag), got ${parts.length}`,
    );
  }
});

// Test 4: Different salts produce different ciphertexts
runTest("Different salts produce different outputs", () => {
  const salt1 = generateUserSalt();
  const salt2 = generateUserSalt();
  const testData = "same data";

  const encrypted1 = encryptUserData(testData, salt1);
  const encrypted2 = encryptUserData(testData, salt2);

  if (encrypted1 === encrypted2) {
    throw new Error("Same ciphertext for different salts");
  }
});

// Test 5: Same salt/data produces different ciphertexts (due to random IV)
runTest("Random IV produces different ciphertexts", () => {
  const testSalt = generateUserSalt();
  const testData = "same data";

  const encrypted1 = encryptUserData(testData, testSalt);
  const encrypted2 = encryptUserData(testData, testSalt);

  if (encrypted1 === encrypted2) {
    throw new Error("Same ciphertext despite random IV");
  }

  // But both should decrypt to same value
  const decrypted1 = decryptUserData(encrypted1, testSalt);
  const decrypted2 = decryptUserData(encrypted2, testSalt);

  if (decrypted1 !== testData || decrypted2 !== testData) {
    throw new Error("Decryption failed with random IV");
  }
});

// Test 6: Wrong salt fails decryption
runTest("Wrong salt fails decryption", () => {
  const correctSalt = generateUserSalt();
  const wrongSalt = generateUserSalt();
  const testData = "secret data";

  const encrypted = encryptUserData(testData, correctSalt);

  try {
    decryptUserData(encrypted, wrongSalt);
    throw new Error("Should have thrown error for wrong salt");
  } catch (error) {
    if (!error.message.includes("Unsupported state")) {
      // Expected error from cipher
      if (error.message === "Should have thrown error for wrong salt") {
        throw error;
      }
    }
  }
});

// Test 7: Tampering detection
runTest("Tampering detection", () => {
  const testSalt = generateUserSalt();
  const testData = "important data";

  const encrypted = encryptUserData(testData, testSalt);

  // Tamper with the encrypted data
  const parts = encrypted.split(":");
  parts[1] = parts[1].slice(0, -2) + "00"; // Change last byte
  const tampered = parts.join(":");

  try {
    decryptUserData(tampered, testSalt);
    throw new Error("Should have detected tampering");
  } catch (error) {
    if (error.message === "Should have detected tampering") {
      throw error;
    }
    // Expected - authentication tag verification failed
  }
});

// Test 8: Hash function
runTest("Hash function produces consistent results", () => {
  const testSalt = generateUserSalt();
  const testData = "data to hash";

  const hash1 = hashUserData(testData, testSalt);
  const hash2 = hashUserData(testData, testSalt);

  if (hash1 !== hash2) {
    throw new Error("Hash should be deterministic");
  }

  if (hash1.length !== 64) {
    throw new Error(`Expected hash length 64, got ${hash1.length}`);
  }
});

// Test 9: Different data produces different hashes
runTest("Different data produces different hashes", () => {
  const testSalt = generateUserSalt();

  const hash1 = hashUserData("data1", testSalt);
  const hash2 = hashUserData("data2", testSalt);

  if (hash1 === hash2) {
    throw new Error("Different data should produce different hashes");
  }
});

// Test 10: Different salts produce different hashes
runTest("Different salts produce different hashes", () => {
  const salt1 = generateUserSalt();
  const salt2 = generateUserSalt();
  const testData = "same data";

  const hash1 = hashUserData(testData, salt1);
  const hash2 = hashUserData(testData, salt2);

  if (hash1 === hash2) {
    throw new Error("Different salts should produce different hashes");
  }
});

// Test 11: Special characters and Unicode
runTest("Special characters and Unicode", () => {
  const testSalt = generateUserSalt();
  const testData = "Special: 你好 🔐 émojis!@#$%^&*()";

  const encrypted = encryptUserData(testData, testSalt);
  const decrypted = decryptUserData(encrypted, testSalt);

  if (decrypted !== testData) {
    throw new Error("Unicode handling failed");
  }
});

// Test 12: Empty string handling
runTest("Empty string error handling", () => {
  const testSalt = generateUserSalt();

  try {
    encryptUserData("", testSalt);
    throw new Error("Should reject empty data");
  } catch (error) {
    if (error.message !== "Data to encrypt cannot be empty") {
      throw error;
    }
  }
});

// Test 13: Large data
runTest("Large data encryption", () => {
  const testSalt = generateUserSalt();
  const largeData = "x".repeat(10000); // 10KB of data

  const encrypted = encryptUserData(largeData, testSalt);
  const decrypted = decryptUserData(encrypted, testSalt);

  if (decrypted !== largeData) {
    throw new Error("Large data handling failed");
  }
});

// Print summary
console.log("\n" + "=".repeat(70));
console.log("📊 TEST SUMMARY");
console.log("=".repeat(70) + "\n");

console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   📈 Total:  ${passedTests + failedTests}\n`);

if (failedTests === 0) {
  console.log("🎉 All tests passed! Encryption is working correctly.\n");
  console.log("✅ You can safely use these utilities in your application:\n");
  console.log(
    '   import { encryptUserData, decryptUserData } from "@/lib/utils/userEncryption";\n',
  );
} else {
  console.log("⚠️  Some tests failed. Please check the errors above.\n");
  process.exit(1);
}

// Show example usage
console.log("=".repeat(70));
console.log("💡 EXAMPLE USAGE");
console.log("=".repeat(70) + "\n");

const exampleSalt = generateUserSalt();
const sensitiveData = "user-api-key-12345";

console.log("1. Generate or fetch user salt:");
console.log(`   const userSalt = "${exampleSalt.substring(0, 32)}..."\n`);

console.log("2. Encrypt sensitive data:");
const exampleEncrypted = encryptUserData(sensitiveData, exampleSalt);
console.log(
  `   const encrypted = encryptUserData("${sensitiveData}", userSalt)`,
);
console.log(`   // Result: "${exampleEncrypted.substring(0, 50)}..."\n`);

console.log("3. Decrypt when needed:");
const exampleDecrypted = decryptUserData(exampleEncrypted, exampleSalt);
console.log(`   const decrypted = decryptUserData(encrypted, userSalt)`);
console.log(`   // Result: "${exampleDecrypted}"\n`);

console.log("4. Hash for verification (one-way):");
const exampleHash = hashUserData(sensitiveData, exampleSalt);
console.log(`   const hash = hashUserData("${sensitiveData}", userSalt)`);
console.log(`   // Result: "${exampleHash.substring(0, 32)}..."\n`);

console.log("=".repeat(70) + "\n");
