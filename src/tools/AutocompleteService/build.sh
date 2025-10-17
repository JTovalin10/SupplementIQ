#!/bin/bash

# Build script for C++ Autocomplete Service
# High-performance multithreaded autocomplete with Node.js bindings

set -e  # Exit on any error

echo "🚀 Building C++ Autocomplete Service..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION or higher"
    exit 1
fi

print_status "Node.js version: $NODE_VERSION ✓"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm version: $(npm --version) ✓"

# Check if C++ compiler is available
if command -v g++ &> /dev/null; then
    print_status "C++ compiler: g++ $(g++ --version | head -n1 | cut -d' ' -f4) ✓"
elif command -v clang++ &> /dev/null; then
    print_status "C++ compiler: clang++ $(clang++ --version | head -n1 | cut -d' ' -f5) ✓"
else
    print_error "No C++ compiler found. Please install g++ or clang++"
    exit 1
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install Node.js dependencies"
    exit 1
fi

print_success "Node.js dependencies installed ✓"

# Install node-gyp globally if not already installed
if ! command -v node-gyp &> /dev/null; then
    print_status "Installing node-gyp globally..."
    npm install -g node-gyp
    
    if [ $? -ne 0 ]; then
        print_error "Failed to install node-gyp"
        exit 1
    fi
    
    print_success "node-gyp installed ✓"
else
    print_status "node-gyp already installed ✓"
fi

# Clean previous builds
print_status "Cleaning previous builds..."
make clean

# Build the service
print_status "Building C++ Autocomplete Service..."
make release

if [ $? -ne 0 ]; then
    print_error "Failed to build C++ Autocomplete Service"
    exit 1
fi

print_success "C++ Autocomplete Service built successfully ✓"

# Test the build
print_status "Testing the build..."
make test

if [ $? -ne 0 ]; then
    print_error "Build test failed"
    exit 1
fi

print_success "Build test passed ✓"

# Run performance benchmark
print_status "Running performance benchmark..."
make benchmark

if [ $? -ne 0 ]; then
    print_warning "Performance benchmark failed, but build is complete"
else
    print_success "Performance benchmark completed ✓"
fi

# Display build information
print_status "Build completed successfully!"
echo ""
echo "📁 Build output:"
echo "   - Binary: $(pwd)/build/Release/autocomplete_service.node"
echo "   - Size: $(du -h build/Release/autocomplete_service.node | cut -f1)"
echo ""
echo "🚀 Performance features:"
echo "   - Multithreaded operations"
echo "   - Lock-free read operations"
echo "   - Fine-grained locking for writes"
echo "   - Optimized memory usage"
echo "   - High-concurrency support"
echo ""
echo "📖 Usage:"
echo "   const service = require('./build/Release/autocomplete_service');"
echo "   service.initialize();"
echo "   const results = service.searchProducts('ghost', 25);"
echo ""
print_success "🎉 C++ Autocomplete Service is ready to use!"
