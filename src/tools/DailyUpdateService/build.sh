#!/bin/bash

# Rust DailyUpdateService Build and Test Script

set -e

echo "🦀 Building Rust DailyUpdateService..."

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo not found. Please install Rust first."
    exit 1
fi

# Format code
echo "📝 Formatting code with rustfmt..."
cargo fmt

# Lint code
echo "🔍 Linting code with clippy..."
cargo clippy --all-targets --all-features -- -D warnings

# Check code
echo "✅ Checking code..."
cargo check --all-targets --all-features

# Build
echo "🔨 Building..."
cargo build --release

# Run tests
echo "🧪 Running tests..."
cargo test

echo "✅ Rust DailyUpdateService build completed successfully!"
