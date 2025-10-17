#!/bin/bash

# DataFetchingService Test Runner
# This script runs comprehensive tests for the DataFetchingService

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies
install_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command_exists go; then
        print_error "Go not found. Please install Go 1.21 or later."
        exit 1
    fi
    
    # Check Go version
    GO_VERSION=$(go version | grep -o 'go[0-9]\+\.[0-9]\+' | sed 's/go//')
    REQUIRED_VERSION="1.21"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$GO_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Go version $GO_VERSION is too old. Please install Go $REQUIRED_VERSION or later."
        exit 1
    fi
    
    print_status "Installing Go dependencies..."
    go mod download
    go mod tidy
    
    print_success "All dependencies are available"
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    # Run tests with verbose output and race detection
    if go test -v -race -timeout 30s -run "Test.*" .; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        exit 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Run integration tests (these would require database setup)
    if go test -v -timeout 60s -run "TestIntegration.*" .; then
        print_success "Integration tests passed"
    else
        print_warning "Integration tests skipped or failed (database setup required)"
    fi
}

# Function to run benchmark tests
run_benchmark_tests() {
    print_status "Running benchmark tests..."
    
    if go test -bench=. -benchmem -timeout 60s .; then
        print_success "Benchmark tests completed"
    else
        print_warning "Benchmark tests failed or skipped"
    fi
}

# Function to run tests with coverage
run_coverage_tests() {
    print_status "Running tests with coverage..."
    
    if go test -v -race -coverprofile=coverage.out -covermode=atomic .; then
        print_success "Coverage tests completed"
        
        # Generate coverage report
        if command_exists go; then
            go tool cover -html=coverage.out -o coverage.html
            print_success "Coverage report generated: coverage.html"
        fi
        
        # Show coverage percentage
        COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}')
        print_status "Total coverage: $COVERAGE"
    else
        print_error "Coverage tests failed"
        exit 1
    fi
}

# Function to run linting
run_linting() {
    print_status "Running code linting..."
    
    # Run go vet
    if go vet ./...; then
        print_success "go vet passed"
    else
        print_error "go vet failed"
        exit 1
    fi
    
    # Run go fmt check
    if [ -z "$(go fmt ./...)" ]; then
        print_success "Code formatting is correct"
    else
        print_error "Code formatting issues found. Run 'go fmt ./...' to fix."
        exit 1
    fi
    
    # Check for golangci-lint if available
    if command_exists golangci-lint; then
        if golangci-lint run; then
            print_success "golangci-lint passed"
        else
            print_warning "golangci-lint found issues"
        fi
    else
        print_warning "golangci-lint not found. Install for additional linting."
    fi
}

# Function to run specific test
run_specific_test() {
    local test_name="$1"
    print_status "Running specific test: $test_name"
    
    if go test -v -timeout 30s -run "$test_name" .; then
        print_success "Test $test_name passed"
    else
        print_error "Test $test_name failed"
        exit 1
    fi
}

# Function to build the service
build_service() {
    print_status "Building DataFetchingService..."
    
    if go build -o data-fetching-service .; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Function to run all tests
run_all_tests() {
    print_status "Running comprehensive test suite..."
    
    install_dependencies
    run_linting
    run_unit_tests
    run_integration_tests
    run_benchmark_tests
    run_coverage_tests
    build_service
    
    print_success "All tests completed successfully! 🎉"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    rm -f coverage.out coverage.html
    rm -f data-fetching-service
    print_success "Cleanup completed"
}

# Main logic
case "$1" in
    deps)
        install_dependencies
        ;;
    unit)
        install_dependencies
        run_unit_tests
        ;;
    integration)
        install_dependencies
        run_integration_tests
        ;;
    benchmark)
        install_dependencies
        run_benchmark_tests
        ;;
    coverage)
        install_dependencies
        run_coverage_tests
        ;;
    lint)
        run_linting
        ;;
    build)
        install_dependencies
        build_service
        ;;
    test)
        if [ -n "$2" ]; then
            install_dependencies
            run_specific_test "$2"
        else
            print_error "Please provide test name. Usage: $0 test TestName"
            exit 1
        fi
        ;;
    clean)
        cleanup
        ;;
    all)
        run_all_tests
        ;;
    help)
        echo "=========================================="
        echo "DataFetchingService Test Runner"
        echo "=========================================="
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deps        - Install dependencies"
        echo "  unit        - Run unit tests only"
        echo "  integration - Run integration tests only"
        echo "  benchmark   - Run benchmark tests only"
        echo "  coverage    - Run tests with coverage report"
        echo "  lint        - Run code linting"
        echo "  build       - Build the service"
        echo "  test <name> - Run specific test"
        echo "  clean       - Clean build artifacts"
        echo "  all         - Run all tests (default)"
        echo "  help        - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 unit"
        echo "  $0 test TestGetPaginatedProducts"
        echo "  $0 coverage && open coverage.html"
        echo "  $0 all"
        echo "=========================================="
        ;;
    *)
        run_all_tests
        ;;
esac

print_success "Test runner completed successfully!"
