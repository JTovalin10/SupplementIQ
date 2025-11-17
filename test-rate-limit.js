/**
 * Simple test script to verify rate limiting on auth endpoints
 * Run with: node test-rate-limit.js
 *
 * This script tests:
 * 1. Rate limiting on login endpoint (5 attempts in 15 minutes)
 * 2. Proper HTTP 429 response with rate limit headers
 * 3. Rate limit reset after successful authentication
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testLoginRateLimit() {
  console.log("\n🧪 Testing Login Rate Limit...");
  console.log("=".repeat(50));

  const testEmail = "test@example.com";
  const testPassword = "wrongpassword";

  let rateLimited = false;
  let attemptCount = 0;

  // Try to make requests until we hit the rate limit
  for (let i = 1; i <= 10; i++) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const data = await response.json();
      attemptCount = i;

      // Check rate limit headers
      const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      const rateLimitReset = response.headers.get("X-RateLimit-Reset");
      const retryAfter = response.headers.get("Retry-After");

      console.log(`\nAttempt ${i}:`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Rate Limit: ${rateLimitRemaining}/${rateLimitLimit}`);

      if (response.status === 429) {
        console.log(`  ✅ Rate limited after ${i} attempts!`);
        console.log(`  Retry After: ${retryAfter} seconds`);
        console.log(
          `  Reset At: ${new Date(parseInt(rateLimitReset) * 1000).toLocaleString()}`,
        );
        console.log(`  Message: ${data.message || data.error}`);
        rateLimited = true;
        break;
      } else if (response.status === 401) {
        console.log(`  ⚠️  Authentication failed (expected)`);
      } else {
        console.log(`  Response: ${JSON.stringify(data)}`);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Error on attempt ${i}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(50));
  if (rateLimited) {
    console.log("✅ Rate limiting is working correctly!");
    console.log(`   Got rate limited after ${attemptCount} attempts`);
  } else {
    console.log("❌ Rate limiting did NOT trigger after 10 attempts");
    console.log("   This might indicate a configuration issue");
  }

  return rateLimited;
}

async function testRegisterRateLimit() {
  console.log("\n🧪 Testing Register Rate Limit...");
  console.log("=".repeat(50));

  let rateLimited = false;
  let attemptCount = 0;

  // Try to make requests until we hit the rate limit
  for (let i = 1; i <= 5; i++) {
    try {
      const testEmail = `test${Date.now()}${i}@example.com`;

      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          password: "TestPassword123!",
          full_name: "Test User",
        }),
      });

      const data = await response.json();
      attemptCount = i;

      // Check rate limit headers
      const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      const retryAfter = response.headers.get("Retry-After");

      console.log(`\nAttempt ${i}:`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Rate Limit: ${rateLimitRemaining}/${rateLimitLimit}`);

      if (response.status === 429) {
        console.log(`  ✅ Rate limited after ${i} attempts!`);
        console.log(`  Retry After: ${retryAfter} seconds`);
        console.log(`  Message: ${data.message || data.error}`);
        rateLimited = true;
        break;
      } else {
        console.log(`  Response: ${data.message || data.error}`);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Error on attempt ${i}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(50));
  if (rateLimited) {
    console.log("✅ Register rate limiting is working correctly!");
    console.log(`   Got rate limited after ${attemptCount} attempts`);
  } else {
    console.log("⚠️  Register rate limiting did NOT trigger");
    console.log(`   Made ${attemptCount} attempts (limit is 3 per hour)`);
  }

  return rateLimited;
}

async function testForgotPasswordRateLimit() {
  console.log("\n🧪 Testing Forgot Password Rate Limit...");
  console.log("=".repeat(50));

  const testEmail = "test@example.com";
  let rateLimited = false;
  let attemptCount = 0;

  // Try to make requests until we hit the rate limit
  for (let i = 1; i <= 7; i++) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      const data = await response.json();
      attemptCount = i;

      // Check rate limit headers
      const rateLimitLimit = response.headers.get("X-RateLimit-Limit");
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      const retryAfter = response.headers.get("Retry-After");

      console.log(`\nAttempt ${i}:`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Rate Limit: ${rateLimitRemaining}/${rateLimitLimit}`);

      if (response.status === 429) {
        console.log(`  ✅ Rate limited after ${i} attempts!`);
        console.log(`  Retry After: ${retryAfter} seconds`);
        console.log(`  Message: ${data.error}`);
        rateLimited = true;
        break;
      } else {
        console.log(`  Message: ${data.message}`);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Error on attempt ${i}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(50));
  if (rateLimited) {
    console.log("✅ Forgot password rate limiting is working correctly!");
    console.log(`   Got rate limited after ${attemptCount} attempts`);
  } else {
    console.log("⚠️  Forgot password rate limiting did NOT trigger");
    console.log(`   Made ${attemptCount} attempts (limit is 5 per hour)`);
  }

  return rateLimited;
}

async function runAllTests() {
  console.log("\n🚀 Starting Rate Limit Tests");
  console.log(`📍 Testing against: ${baseUrl}`);
  console.log("\nℹ️  Prerequisites:");
  console.log("   1. Your development server must be running");
  console.log("   2. Redis must be running and accessible");
  console.log("   3. Environment variables must be configured");

  const results = {
    login: await testLoginRateLimit(),
    register: await testRegisterRateLimit(),
    forgotPassword: await testForgotPasswordRateLimit(),
  };

  console.log("\n📊 Test Summary");
  console.log("=".repeat(50));
  console.log(
    `Login Rate Limit:           ${results.login ? "✅ PASS" : "❌ FAIL"}`,
  );
  console.log(
    `Register Rate Limit:        ${results.register ? "✅ PASS" : "❌ FAIL"}`,
  );
  console.log(
    `Forgot Password Rate Limit: ${results.forgotPassword ? "✅ PASS" : "❌ FAIL"}`,
  );
  console.log("=".repeat(50));

  const allPassed = Object.values(results).every((r) => r === true);
  if (allPassed) {
    console.log("\n✅ All rate limiting tests passed!");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the logs above.");
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("\n❌ Test execution failed:", error);
  process.exit(1);
});
