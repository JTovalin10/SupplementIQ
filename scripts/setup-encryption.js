/**
 * Cross-platform encryption setup script
 * Works on Windows, Mac, and Linux
 *
 * Run with: node scripts/setup-encryption.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

const colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

function log(message, color = "") {
  console.log(color + message + colors.reset);
}

async function setup() {
  console.log("\n" + "=".repeat(70));
  log("🔐  SUPPLEMENTIQ ENCRYPTION SETUP", colors.green);
  console.log("=".repeat(70) + "\n");

  const envLocalPath = path.join(__dirname, "..", ".env.local");
  const envExamplePath = path.join(__dirname, "..", ".env.example");

  // Step 1: Check if .env.local exists
  if (!fs.existsSync(envLocalPath)) {
    log("⚠️  .env.local not found", colors.yellow);

    if (fs.existsSync(envExamplePath)) {
      log("   Creating .env.local from .env.example...");
      fs.copyFileSync(envExamplePath, envLocalPath);
      log("   ✅ Created .env.local\n", colors.green);
    } else {
      log("   ❌ .env.example not found. Cannot create .env.local", colors.red);
      rl.close();
      process.exit(1);
    }
  }

  // Step 2: Check if key already exists
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  let skipKeyGen = false;

  if (envContent.includes("USER_DATA_ENCRYPTION_KEY=")) {
    log(
      "⚠️  USER_DATA_ENCRYPTION_KEY already exists in .env.local\n",
      colors.yellow,
    );

    const answer = await question(
      "Do you want to generate a NEW key? This will make old encrypted data unreadable! (y/N): ",
    );

    if (answer.toLowerCase() !== "y") {
      log("✅ Keeping existing key\n", colors.green);
      skipKeyGen = true;
    } else {
      console.log("");
    }
  }

  let encryptionKey;

  // Step 3: Generate encryption key if needed
  if (!skipKeyGen) {
    log("🔑 Generating encryption key...");
    encryptionKey = crypto.randomBytes(32).toString("hex");
    log("✅ Generated secure 256-bit encryption key\n", colors.green);

    console.log("Generated key: " + encryptionKey + "\n");

    // Step 4: Add or update the key in .env.local
    let newEnvContent;

    if (envContent.includes("USER_DATA_ENCRYPTION_KEY=")) {
      // Replace existing key
      newEnvContent = envContent.replace(
        /USER_DATA_ENCRYPTION_KEY=.*/,
        `USER_DATA_ENCRYPTION_KEY=${encryptionKey}`,
      );
      log("✅ Updated USER_DATA_ENCRYPTION_KEY in .env.local\n", colors.green);
    } else {
      // Add new key
      const timestamp = new Date().toISOString();
      newEnvContent =
        envContent.trimEnd() +
        `\n\n# User data encryption key (generated ${timestamp})\nUSER_DATA_ENCRYPTION_KEY=${encryptionKey}\n`;
      log("✅ Added USER_DATA_ENCRYPTION_KEY to .env.local\n", colors.green);
    }

    fs.writeFileSync(envLocalPath, newEnvContent);
  }

  // Step 5: Run tests
  log("🧪 Running encryption tests...\n");

  try {
    // Load the environment variable
    if (!process.env.USER_DATA_ENCRYPTION_KEY) {
      const envVars = fs
        .readFileSync(envLocalPath, "utf8")
        .split("\n")
        .filter((line) => line.includes("USER_DATA_ENCRYPTION_KEY="))
        .map((line) => line.split("=")[1])[0];

      if (envVars) {
        process.env.USER_DATA_ENCRYPTION_KEY = envVars;
      }
    }

    // Run the test script
    require("./test-encryption.js");

    console.log("");
    log("✅ All encryption tests passed!\n", colors.green);
  } catch (error) {
    log("❌ Tests failed: " + error.message, colors.red);
    rl.close();
    process.exit(1);
  }

  // Step 6: Show next steps
  console.log("=".repeat(70));
  console.log("📝 NEXT STEPS");
  console.log("=".repeat(70) + "\n");

  console.log("1. Your encryption is now set up! ✅\n");

  console.log("2. Run the database migration to add salts to existing users:");
  log(
    "   psql -h your-db -f Database/supabase/migrations/add_encryption_salt_to_existing_users.sql\n",
    colors.yellow,
  );

  console.log("3. Or run via Supabase dashboard:");
  console.log("   - Go to SQL Editor");
  console.log("   - Paste contents of the migration file");
  console.log("   - Execute\n");

  console.log("4. Use encryption in your app:");
  log(
    "   import { encryptUserData, decryptUserData } from '@/lib/utils/userEncryption';\n",
    colors.yellow,
  );

  console.log("5. See examples in:");
  console.log("   - DATABASE_SECURITY_IMPLEMENTATION.md");
  console.log("   - SECURITY.md\n");

  console.log("=".repeat(70) + "\n");
  log("🎉 Setup complete!\n", colors.green);

  rl.close();
}

// Run the setup
setup().catch((error) => {
  log("❌ Setup failed: " + error.message, colors.red);
  rl.close();
  process.exit(1);
});
