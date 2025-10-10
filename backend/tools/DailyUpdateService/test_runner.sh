#!/bin/bash

# Test Runner for DailyUpdateService
# This script compiles and runs tests for the DailyUpdateService

echo "🧪 DailyUpdateService Test Runner"
echo "================================="

# Check if we're in the right directory
if [ ! -f "DailyUpdateService.h" ]; then
    echo "❌ Error: Please run this script from the DailyUpdateService directory"
    exit 1
fi

# Check for required dependencies
echo "📋 Checking dependencies..."

# Check for g++
if ! command -v g++ &> /dev/null; then
    echo "❌ Error: g++ compiler not found. Please install g++"
    exit 1
fi

# Check for curl development libraries
if ! pkg-config --exists libcurl; then
    echo "⚠️  Warning: libcurl development libraries not found"
    echo "   You may need to install: sudo apt-get install libcurl4-openssl-dev"
    echo "   or: brew install curl (on macOS)"
fi

# Check for nlohmann/json
if [ ! -f "/usr/include/nlohmann/json.hpp" ] && [ ! -f "/usr/local/include/nlohmann/json.hpp" ]; then
    echo "⚠️  Warning: nlohmann/json not found"
    echo "   You may need to install: sudo apt-get install nlohmann-json3-dev"
    echo "   or download from: https://github.com/nlohmann/json"
fi

echo "✅ Dependency check completed"

# Set up test environment variables
echo "🔧 Setting up test environment..."
export NEXT_PUBLIC_SUPABASE_URL="https://test-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="test-service-role-key"
echo "✅ Test environment variables set"

# Compile the test
echo "🔨 Compiling test..."
g++ -std=c++17 -pthread \
    -I. \
    -I/usr/include/nlohmann \
    -I/usr/local/include/nlohmann \
    -o test_daily_update \
    test_daily_update.cpp \
    DailyUpdateService.cpp \
    -lcurl \
    -lpthread

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful"
else
    echo "❌ Compilation failed"
    exit 1
fi

# Run the test
echo "🚀 Running tests..."
echo "=================="
./test_daily_update

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "The DailyUpdateService is working correctly!"
else
    echo ""
    echo "❌ SOME TESTS FAILED!"
    echo "Please check the output above for details"
    exit 1
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
rm -f test_daily_update
echo "✅ Cleanup completed"

echo ""
echo "✨ Test runner completed successfully!"
