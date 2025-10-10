# DailyUpdateService Test Suite

This directory contains comprehensive tests for the DailyUpdateService to ensure it works correctly with Supabase integration.

## Test Files

### 1. `test_daily_update.cpp`
- **C++ Unit Tests**: Comprehensive test suite for the C++ implementation
- **Tests**: Initialization, environment variables, product queue, approval/rejection, verification, threading
- **Performance Tests**: High-volume queue processing
- **Mock Tests**: Supabase integration without actual HTTP calls

### 2. `test_runner.sh`
- **Test Runner**: Automated script to compile and run C++ tests
- **Dependency Checking**: Validates required libraries are installed
- **Environment Setup**: Sets up test environment variables
- **Cleanup**: Removes temporary files after testing

### 3. `test_node.js`
- **Node.js Tests**: Tests the service through Node.js bindings
- **Environment Validation**: Checks environment variables
- **Mock Data**: Creates test product data structures
- **Performance Simulation**: Simulates high-volume processing

## Running Tests

### Prerequisites

Install required dependencies:

```bash
# Ubuntu/Debian
sudo apt-get install g++ libcurl4-openssl-dev nlohmann-json3-dev

# macOS
brew install curl nlohmann-json

# CentOS/RHEL
sudo yum install gcc-c++ libcurl-devel nlohmann-json-devel
```

### Test Execution

#### 1. Run C++ Tests
```bash
cd backend/tools/DailyUpdateService
./test_runner.sh
```

#### 2. Run Node.js Tests
```bash
cd backend/tools/DailyUpdateService
node test_node.js
```

#### 3. Build and Test Addon
```bash
cd backend/tools/DailyUpdateService
make build
make test
```

## Test Coverage

### Core Functionality
- ✅ Service initialization (manual and environment variables)
- ✅ Product queue management (add, retrieve, process)
- ✅ Product approval/rejection workflow
- ✅ Product verification (duplicate checking)
- ✅ Queue statistics and monitoring
- ✅ Force daily update functionality

### Threading and Performance
- ✅ Background thread management
- ✅ Queue processor thread
- ✅ Thread-safe operations
- ✅ High-volume processing (1000+ products)
- ✅ Performance benchmarks

### Supabase Integration
- ✅ Environment variable loading
- ✅ HTTP request preparation
- ✅ JSON payload creation
- ✅ Error handling and response validation
- ✅ Authentication header setup

### Error Handling
- ✅ Missing environment variables
- ✅ Invalid configuration
- ✅ Network errors
- ✅ Invalid product data
- ✅ Thread safety violations

## Expected Test Results

### Successful Test Run
```
🧪 DailyUpdateService Test Suite
=========================================

📋 Test 1: Service Initialization
✅ Manual initialization successful
✅ Invalid initialization handled correctly

📋 Test 2: Environment Variables
✅ Environment variable initialization successful
✅ Missing environment variables handled correctly

📋 Test 3: Product Queue Management
✅ Products added to queue successfully
✅ Retrieved pending products: 3
✅ Product data integrity verified

📋 Test 4: Product Approval/Rejection
✅ Product approval successful
✅ Product rejection successful

📋 Test 5: Product Verification
✅ Product verification completed

📋 Test 6: Queue Statistics
✅ Queue statistics retrieved successfully
   - Queue Size: 3
   - Total Approved: 1
   - Total Rejected: 1
   - Total Processed: 0

📋 Test 7: Force Daily Update
✅ Force daily update executed without errors

📋 Test 8: Threading and Background Processing
✅ Service started successfully
✅ Service stopped successfully

📋 Test 9: Mock Supabase Integration
✅ Mock Supabase initialization successful
✅ Product data structure ready for Supabase:
   - Name: Test Whey
   - Brand: Test Brand
   - Flavor: Vanilla
   - Year: 2024
   - Created: 2024-01-15T10:30:00Z
   - Updated: 2024-01-15T10:30:00Z

📋 Test 10: High Volume Queue Performance
✅ Added 1000 products in 15ms
✅ Queue size verified: 1000

🎉 ALL TESTS PASSED!
The DailyUpdateService is working correctly!
```

## Troubleshooting

### Common Issues

#### 1. Compilation Errors
```
❌ Error: g++ compiler not found
```
**Solution**: Install g++ compiler
```bash
sudo apt-get install g++
```

#### 2. Missing Libraries
```
❌ Error: libcurl development libraries not found
```
**Solution**: Install libcurl development package
```bash
sudo apt-get install libcurl4-openssl-dev
```

#### 3. Environment Variables
```
❌ Missing required environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
```
**Solution**: Set environment variables or create .env file
```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### 4. Threading Issues
```
❌ Error: pthread not found
```
**Solution**: Install pthread development package
```bash
sudo apt-get install libpthread-stubs0-dev
```

## Integration with Main System

### Environment Variables
The service expects these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Database Schema
The service inserts products into a `products` table with these fields:
- `name` (string): Product name
- `brand_name` (string): Brand name
- `flavor` (string): Product flavor
- `year` (string): Formula year
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

### API Integration
The service makes HTTP POST requests to:
```
POST {NEXT_PUBLIC_SUPABASE_URL}/products
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
Content-Type: application/json
```

## Continuous Integration

To integrate with CI/CD pipelines:

```yaml
# .github/workflows/test-daily-update.yml
name: Test DailyUpdateService
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install g++ libcurl4-openssl-dev nlohmann-json3-dev
      - name: Run tests
        run: |
          cd backend/tools/DailyUpdateService
          ./test_runner.sh
```

## Performance Benchmarks

### Expected Performance
- **Queue Addition**: < 1ms per product
- **1000 Products**: < 50ms total
- **Memory Usage**: < 10MB for 1000 products
- **Thread Overhead**: < 1% CPU usage when idle

### Load Testing
For production load testing:
```bash
# Test with 10,000 products
for i in {1..10000}; do
  # Add product to queue
done
```

## Security Considerations

### Environment Variables
- Never commit real API keys to version control
- Use environment-specific configuration files
- Rotate service role keys regularly

### Network Security
- All requests use HTTPS
- Service role key provides database access
- No user authentication required (service-to-service)

## Monitoring and Logging

### Log Levels
- `INFO`: Normal operations
- `WARN`: Non-critical issues
- `ERROR`: Failed operations
- `DEBUG`: Detailed debugging information

### Metrics to Monitor
- Queue size and processing rate
- Database insertion success rate
- Thread health and performance
- Memory usage and leaks
