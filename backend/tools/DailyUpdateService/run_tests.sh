#!/bin/bash

# DailyUpdateService Test Runner
# This script runs comprehensive tests for the DailyUpdateService

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
    
    if ! command_exists g++; then
        print_error "g++ not found. Please install build-essential."
        exit 1
    fi
    
    if ! command_exists go; then
        print_error "Go not found. Please install Go."
        exit 1
    fi
    
    if ! command_exists make; then
        print_error "make not found. Please install make."
        exit 1
    fi
    
    # Check for Google Test
    if ! pkg-config --exists gtest; then
        print_warning "Google Test not found. Installing..."
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y libgtest-dev cmake
            cd /usr/src/gtest
            sudo cmake .
            sudo make
            sudo make install
            cd -
        else
            print_error "Please install Google Test manually."
            exit 1
        fi
    fi
    
    print_success "All dependencies are available"
}

# Function to run Go tests
run_go_tests() {
    print_status "Running Go Supabase component tests..."
    
    cd go-supabase
    
    # Run tests with verbose output
    if go test -v; then
        print_success "Go tests passed"
    else
        print_error "Go tests failed"
        exit 1
    fi
    
    cd ..
}

# Function to run C++ tests
run_cpp_tests() {
    print_status "Running C++ component tests..."
    
    # Build and run Cache Manager tests
    print_status "Building Cache Manager tests..."
    if make test-cache; then
        print_success "Cache Manager tests passed"
    else
        print_error "Cache Manager tests failed"
        exit 1
    fi
    
    # Build and run Trie Manager tests
    print_status "Building Trie Manager tests..."
    if make test-trie; then
        print_success "Trie Manager tests passed"
    else
        print_error "Trie Manager tests failed"
        exit 1
    fi
    
    # Build and run Main DailyUpdateService tests
    print_status "Building Main DailyUpdateService tests..."
    if make test-main; then
        print_success "Main DailyUpdateService tests passed"
    else
        print_error "Main DailyUpdateService tests failed"
        exit 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Create test environment
    TEST_DIR="/tmp/daily_update_integration_test"
    mkdir -p "$TEST_DIR"
    
    # Set environment variables for testing
    export SUPABASE_URL="http://localhost:54321"
    export SUPABASE_ANON_KEY="test-key"
    export TEST_MODE="true"
    
    # Run integration tests
    if make test; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        exit 1
    fi
    
    # Clean up test environment
    rm -rf "$TEST_DIR"
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    # Run Go performance tests
    cd go-supabase
    if go test -bench=. -benchmem; then
        print_success "Go performance tests completed"
    else
        print_warning "Go performance tests had issues"
    fi
    cd ..
    
    # Run C++ performance tests
    if make test-cpp; then
        print_success "C++ performance tests completed"
    else
        print_warning "C++ performance tests had issues"
    fi
}

# Function to generate coverage report
generate_coverage() {
    print_status "Generating coverage report..."
    
    cd go-supabase
    
    # Generate Go coverage
    if go test -coverprofile=coverage.out; then
        go tool cover -html=coverage.out -o coverage.html
        print_success "Coverage report generated: go-supabase/coverage.html"
    else
        print_warning "Coverage report generation failed"
    fi
    
    cd ..
}

# Function to run linting
run_linting() {
    print_status "Running code linting..."
    
    # Lint Go code
    cd go-supabase
    if go vet ./...; then
        print_success "Go linting passed"
    else
        print_warning "Go linting had issues"
    fi
    cd ..
    
    # Lint C++ code
    if command_exists cppcheck; then
        if cppcheck --enable=all --std=c++17 .; then
            print_success "C++ linting passed"
        else
            print_warning "C++ linting had issues"
        fi
    else
        print_warning "cppcheck not found, skipping C++ linting"
    fi
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    make clean
    print_success "Cleanup completed"
}

# Main function
main() {
    echo "=========================================="
    echo "DailyUpdateService Test Runner"
    echo "=========================================="
    
    # Parse command line arguments
    case "${1:-all}" in
        "deps")
            install_dependencies
            ;;
        "go")
            run_go_tests
            ;;
        "cpp")
            run_cpp_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "coverage")
            generate_coverage
            ;;
        "lint")
            run_linting
            ;;
        "clean")
            cleanup
            ;;
        "all")
            install_dependencies
            run_go_tests
            run_cpp_tests
            run_integration_tests
            run_performance_tests
            generate_coverage
            run_linting
            ;;
        "help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  deps        - Install dependencies"
            echo "  go          - Run Go tests only"
            echo "  cpp         - Run C++ tests only"
            echo "  integration - Run integration tests"
            echo "  performance - Run performance tests"
            echo "  coverage    - Generate coverage report"
            echo "  lint        - Run code linting"
            echo "  clean       - Clean build artifacts"
            echo "  all         - Run all tests (default)"
            echo "  help        - Show this help message"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    echo "=========================================="
    print_success "Test runner completed successfully!"
    echo "=========================================="
}

# Run main function with all arguments
main "$@"
