#!/bin/bash

# DailyUpdateService Build Script
# Multi-threaded C++ Daily Update Service

set -e  # Exit on any error

echo "🚀 Building DailyUpdateService C++ Addon"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "DailyUpdateService.h" ]; then
    echo "❌ Error: Please run this script from the DailyUpdateService directory"
    exit 1
fi

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Error: Node.js 16+ required, found $(node --version)"
    exit 1
fi
echo "✅ Node.js $(node --version) detected"

# Check for required build tools
echo "🔍 Checking build tools..."

# Check for node-gyp
if ! command -v node-gyp &> /dev/null; then
    echo "📦 Installing node-gyp..."
    npm install -g node-gyp
fi

# Check for C++ compiler
if command -v g++ &> /dev/null; then
    echo "✅ GCC compiler found: $(g++ --version | head -n1)"
elif command -v clang++ &> /dev/null; then
    echo "✅ Clang compiler found: $(clang++ --version | head -n1)"
else
    echo "❌ Error: No C++ compiler found. Please install GCC or Clang"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the addon
echo "🔨 Building DailyUpdateService addon..."
make release

# Test the build
echo "🧪 Testing the built addon..."
if make test; then
    echo "✅ DailyUpdateService addon built and tested successfully!"
    echo ""
    echo "📁 Output: build/Release/daily_update_service.node"
    echo "🚀 Ready for use in Node.js applications"
    echo ""
    echo "Usage:"
    echo "  const dailyUpdateService = require('./build/Release/daily_update_service');"
    echo "  dailyUpdateService.initialize(dbUrl, apiKey);"
    echo "  dailyUpdateService.start();"
else
    echo "❌ Build test failed"
    exit 1
fi

echo ""
echo "🎉 DailyUpdateService build completed successfully!"
