/**
 * Generate a secure encryption key for USER_DATA_ENCRYPTION_KEY
 *
 * Run with: node scripts/generate-encryption-key.js
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Generate a 32-byte (256-bit) encryption key
const key = crypto.randomBytes(32).toString("hex");

console.log("\n" + "=".repeat(70));
console.log("🔑  USER DATA ENCRYPTION KEY GENERATOR");
console.log("=".repeat(70) + "\n");

console.log("✅ Generated a secure 256-bit encryption key:\n");
console.log(`   ${key}\n`);

console.log("📋 Add this to your .env.local file:\n");
console.log(`   USER_DATA_ENCRYPTION_KEY=${key}\n`);

console.log("⚠️  SECURITY WARNINGS:\n");
console.log("   1. Keep this key SECRET - never commit to git");
console.log("   2. Use DIFFERENT keys for dev/staging/production");
console.log("   3. Store production keys in a secrets manager");
console.log("   4. If you lose this key, encrypted data CANNOT be recovered\n");

// Check if .env.local exists
const envLocalPath = path.join(__dirname, "..", ".env.local");
const envExamplePath = path.join(__dirname, "..", ".env.example");

if (fs.existsSync(envLocalPath)) {
  // Read the file to check if key already exists
  const envContent = fs.readFileSync(envLocalPath, "utf8");

  if (envContent.includes("USER_DATA_ENCRYPTION_KEY=")) {
    console.log(
      "⚠️  WARNING: .env.local already contains USER_DATA_ENCRYPTION_KEY",
    );
    console.log(
      "   Do you want to replace it? This will make old encrypted data unreadable!\n",
    );
  } else {
    // Offer to append to .env.local
    console.log("📝 Would you like to automatically add this to .env.local?");
    console.log("   Run: node scripts/generate-encryption-key.js --add\n");
  }
} else if (fs.existsSync(envExamplePath)) {
  console.log("💡 TIP: Copy .env.example to .env.local first:");
  console.log("   cp .env.example .env.local\n");
  console.log("   Then add the key above to the .env.local file.\n");
} else {
  console.log("💡 Create a .env.local file and add the key above.\n");
}

// Check for --add flag
if (process.argv.includes("--add")) {
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, "utf8");

    if (envContent.includes("USER_DATA_ENCRYPTION_KEY=")) {
      console.log("❌ Key already exists in .env.local - not overwriting");
      console.log("   Edit manually if you need to change it.\n");
      process.exit(1);
    } else {
      // Append the key
      const newContent =
        envContent.trimEnd() +
        `\n\n# User data encryption key (generated ${new Date().toISOString()})\nUSER_DATA_ENCRYPTION_KEY=${key}\n`;
      fs.writeFileSync(envLocalPath, newContent);
      console.log("✅ Added USER_DATA_ENCRYPTION_KEY to .env.local\n");
    }
  } else {
    console.log("❌ .env.local not found. Create it first:");
    console.log("   cp .env.example .env.local\n");
    process.exit(1);
  }
}

console.log("=".repeat(70) + "\n");

// Generate a second key for production as a suggestion
const prodKey = crypto.randomBytes(32).toString("hex");
console.log("💼 For PRODUCTION, generate a different key:\n");
console.log(`   ${prodKey}\n`);
console.log("   Store this in your hosting provider's environment variables.");
console.log("   (Vercel, Railway, Render, AWS, etc.)\n");

console.log("=".repeat(70) + "\n");
