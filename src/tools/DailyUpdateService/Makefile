# DailyUpdateService Rust Makefile
# Replaces the C++ build system with Rust tooling

.PHONY: all build test clean lint format check run help

# Default target
all: build

# Build the project
build:
	@echo "🔨 Building DailyUpdateService Rust implementation..."
	cargo build

# Build optimized release version
build-release:
	@echo "🚀 Building optimized release version..."
	cargo build --release

# Run all tests
test:
	@echo "🧪 Running comprehensive test suite..."
	./run_tests.sh

# Run quick tests (unit tests only)
test-quick:
	@echo "⚡ Running quick unit tests..."
	cargo test --lib

# Run integration tests
test-integration:
	@echo "🔗 Running integration tests..."
	cargo test --test integration_tests

# Run cache tests
test-cache:
	@echo "💾 Running cache tests..."
	cargo test --test cache_tests

# Run Go integration tests
test-go:
	@echo "🐹 Running Go integration tests..."
	cargo test --test go_integration_tests

# Run tests with ignored tests (requires Go binary)
test-all:
	@echo "🎯 Running all tests including ignored ones..."
	cargo test -- --ignored

# Run tests with verbose output
test-verbose:
	@echo "📢 Running tests with verbose output..."
	cargo test -- --nocapture

# Run linting
lint:
	@echo "🔍 Running clippy lints..."
	cargo clippy -- -D warnings

# Format code
format:
	@echo "✨ Formatting code..."
	cargo fmt

# Check code formatting
format-check:
	@echo "🔍 Checking code formatting..."
	cargo fmt -- --check

# Run cargo check
check:
	@echo "✅ Running cargo check..."
	cargo check

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	cargo clean

# Run the service
run:
	@echo "🚀 Running DailyUpdateService..."
	cargo run

# Run the service in release mode
run-release:
	@echo "🚀 Running DailyUpdateService (release mode)..."
	cargo run --release

# Run with debug logging
run-debug:
	@echo "🐛 Running with debug logging..."
	RUST_LOG=debug cargo run

# Run with trace logging
run-trace:
	@echo "🔍 Running with trace logging..."
	RUST_LOG=trace cargo run

# Generate documentation
docs:
	@echo "📚 Generating documentation..."
	cargo doc --open

# Run security audit
audit:
	@echo "🛡️ Running security audit..."
	cargo audit

# Install development dependencies
install-deps:
	@echo "📦 Installing development dependencies..."
	cargo install cargo-tarpaulin
	cargo install cargo-audit

# Generate test coverage
coverage:
	@echo "📊 Generating test coverage..."
	cargo tarpaulin --out Html --output-dir coverage

# Benchmark performance
bench:
	@echo "⚡ Running benchmarks..."
	cargo bench

# Check for unused dependencies
unused-deps:
	@echo "🔍 Checking for unused dependencies..."
	cargo +nightly udeps

# Update dependencies
update:
	@echo "🔄 Updating dependencies..."
	cargo update

# Show help
help:
	@echo "DailyUpdateService Rust Build System"
	@echo "====================================="
	@echo ""
	@echo "Available targets:"
	@echo "  build          - Build the project"
	@echo "  build-release  - Build optimized release version"
	@echo "  test           - Run comprehensive test suite"
	@echo "  test-quick     - Run quick unit tests only"
	@echo "  test-integration - Run integration tests"
	@echo "  test-cache     - Run cache tests"
	@echo "  test-go        - Run Go integration tests"
	@echo "  test-all       - Run all tests including ignored"
	@echo "  test-verbose   - Run tests with verbose output"
	@echo "  lint           - Run clippy lints"
	@echo "  format         - Format code"
	@echo "  format-check   - Check code formatting"
	@echo "  check          - Run cargo check"
	@echo "  clean          - Clean build artifacts"
	@echo "  run            - Run the service"
	@echo "  run-release    - Run the service in release mode"
	@echo "  run-debug      - Run with debug logging"
	@echo "  run-trace      - Run with trace logging"
	@echo "  docs           - Generate documentation"
	@echo "  audit          - Run security audit"
	@echo "  install-deps   - Install development dependencies"
	@echo "  coverage       - Generate test coverage"
	@echo "  bench          - Run benchmarks"
	@echo "  unused-deps    - Check for unused dependencies"
	@echo "  update         - Update dependencies"
	@echo "  help           - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make test      - Run all tests"
	@echo "  make build-release - Build optimized version"
	@echo "  make run-debug - Run with debug logging"
	@echo "  make coverage  - Generate coverage report"