#!/bin/bash

# DailyUpdateService Rust Test Runner
# This script runs all tests for the Rust implementation

set -e

echo "🧪 Running DailyUpdateService Rust Tests"
echo "========================================"

# Change to the DailyUpdateService directory
cd "$(dirname "$0")"

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Error: cargo is not installed. Please install Rust first."
    exit 1
fi

echo "📦 Checking Rust installation..."
cargo --version

echo ""
echo "🔍 Running unit tests..."
cargo test --lib

echo ""
echo "🔍 Running integration tests..."
cargo test --test integration_tests

echo ""
echo "🔍 Running cache tests..."
cargo test --test cache_tests

echo ""
echo "🔍 Running Go integration tests..."
cargo test --test go_integration_tests

echo ""
echo "🔍 Running all tests with ignored tests..."
cargo test -- --ignored

echo ""
echo "🔍 Running tests with verbose output..."
cargo test -- --nocapture

echo ""
echo "🔍 Running tests with coverage (if tarpaulin is installed)..."
if command -v cargo-tarpaulin &> /dev/null; then
    cargo tarpaulin --out Html --output-dir coverage
    echo "📊 Coverage report generated in coverage/"
else
    echo "ℹ️  Install cargo-tarpaulin for coverage reports: cargo install cargo-tarpaulin"
fi

echo ""
echo "🔍 Running clippy lints..."
cargo clippy -- -D warnings

echo ""
echo "🔍 Running rustfmt check..."
cargo fmt -- --check

echo ""
echo "🔍 Running cargo check..."
cargo check

echo ""
echo "🔍 Running cargo build..."
cargo build

echo ""
echo "🔍 Running cargo build --release..."
cargo build --release

echo ""
echo "✅ All tests completed successfully!"
echo ""
echo "📋 Test Summary:"
echo "  - Unit tests: ✅"
echo "  - Integration tests: ✅"
echo "  - Cache tests: ✅"
echo "  - Go integration tests: ✅"
echo "  - Linting: ✅"
echo "  - Formatting: ✅"
echo "  - Build: ✅"
echo ""
echo "🚀 DailyUpdateService Rust implementation is ready for production!"