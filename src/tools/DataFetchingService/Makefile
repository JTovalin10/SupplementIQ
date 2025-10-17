# DataFetchingService Makefile

# Go settings
GO = go
GOFLAGS = -v
TESTFLAGS = -v -race -coverprofile=coverage.out

# Directories
SRC_DIR = .
TEST_DIR = .

# Test targets
.PHONY: test test-unit test-integration test-coverage test-benchmark clean deps lint format help

all: test

test: test-unit test-integration test-coverage

test-unit:
	@echo "🧪 Running unit tests..."
	$(GO) test $(TESTFLAGS) -run "Test.*" $(SRC_DIR)

test-integration:
	@echo "🔗 Running integration tests..."
	$(GO) test $(TESTFLAGS) -run "TestIntegration.*" $(SRC_DIR)

test-coverage:
	@echo "📊 Running tests with coverage..."
	$(GO) test $(TESTFLAGS) $(SRC_DIR)
	$(GO) tool cover -html=coverage.out -o coverage.html
	@echo "📈 Coverage report generated: coverage.html"

test-benchmark:
	@echo "⚡ Running benchmark tests..."
	$(GO) test -bench=. -benchmem $(SRC_DIR)

test-specific:
	@echo "🎯 Running specific test..."
	$(GO) test $(TESTFLAGS) -run "$(TEST)" $(SRC_DIR)

# Build targets
build:
	@echo "🔨 Building DataFetchingService..."
	$(GO) build -o data-fetching-service $(SRC_DIR)

build-linux:
	@echo "🐧 Building for Linux..."
	GOOS=linux GOARCH=amd64 $(GO) build -o data-fetching-service-linux $(SRC_DIR)

build-windows:
	@echo "🪟 Building for Windows..."
	GOOS=windows GOARCH=amd64 $(GO) build -o data-fetching-service.exe $(SRC_DIR)

build-mac:
	@echo "🍎 Building for macOS..."
	GOOS=darwin GOARCH=amd64 $(GO) build -o data-fetching-service-mac $(SRC_DIR)

# Development targets
deps:
	@echo "📦 Installing dependencies..."
	$(GO) mod download
	$(GO) mod tidy

deps-update:
	@echo "🔄 Updating dependencies..."
	$(GO) get -u ./...
	$(GO) mod tidy

# Code quality targets
lint:
	@echo "🔍 Running linters..."
	golangci-lint run
	$(GO) vet ./...
	$(GO) fmt ./...

format:
	@echo "🎨 Formatting code..."
	$(GO) fmt ./...
	goimports -w .

# Database targets
db-setup:
	@echo "🗄️ Setting up test database..."
	@echo "Please ensure PostgreSQL is running and create test database"

db-test:
	@echo "🧪 Running database tests..."
	$(GO) test $(TESTFLAGS) -run "TestDatabase.*" $(SRC_DIR)

# Clean targets
clean:
	@echo "🧹 Cleaning build artifacts..."
	$(GO) clean
	rm -f coverage.out coverage.html
	rm -f data-fetching-service*
	rm -f *.log

# Docker targets
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t data-fetching-service .

docker-run:
	@echo "🚀 Running Docker container..."
	docker run -p 8080:8080 data-fetching-service

# Performance targets
profile:
	@echo "📊 Running performance profiling..."
	$(GO) test -cpuprofile=cpu.prof -memprofile=mem.prof -bench=. $(SRC_DIR)
	$(GO) tool pprof cpu.prof

# Documentation targets
docs:
	@echo "📚 Generating documentation..."
	$(GO) doc -all $(SRC_DIR)

# Security targets
security:
	@echo "🔒 Running security checks..."
	gosec ./...

# Continuous Integration targets
ci: deps lint test build
	@echo "✅ CI pipeline completed successfully"

# Help target
help:
	@echo "=========================================="
	@echo "DataFetchingService Build System"
	@echo "=========================================="
	@echo "Available targets:"
	@echo ""
	@echo "Testing:"
	@echo "  test              - Run all tests"
	@echo "  test-unit         - Run unit tests only"
	@echo "  test-integration  - Run integration tests only"
	@echo "  test-coverage     - Run tests with coverage report"
	@echo "  test-benchmark    - Run benchmark tests"
	@echo "  test-specific     - Run specific test (use TEST=TestName)"
	@echo ""
	@echo "Building:"
	@echo "  build             - Build for current platform"
	@echo "  build-linux       - Build for Linux"
	@echo "  build-windows     - Build for Windows"
	@echo "  build-mac         - Build for macOS"
	@echo ""
	@echo "Development:"
	@echo "  deps              - Install dependencies"
	@echo "  deps-update       - Update dependencies"
	@echo "  lint              - Run linters"
	@echo "  format            - Format code"
	@echo ""
	@echo "Database:"
	@echo "  db-setup          - Setup test database"
	@echo "  db-test           - Run database tests"
	@echo ""
	@echo "Quality:"
	@echo "  clean             - Clean build artifacts"
	@echo "  profile           - Run performance profiling"
	@echo "  docs              - Generate documentation"
	@echo "  security          - Run security checks"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build      - Build Docker image"
	@echo "  docker-run        - Run Docker container"
	@echo ""
	@echo "CI:"
	@echo "  ci                - Run full CI pipeline"
	@echo ""
	@echo "Examples:"
	@echo "  make test-specific TEST=TestGetPaginatedProducts"
	@echo "  make test-coverage && open coverage.html"
	@echo "  make build && ./data-fetching-service"
	@echo "=========================================="
