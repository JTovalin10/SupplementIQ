#!/bin/bash

# Comprehensive Test Runner for SupplementIQ Tools
# This script runs all tests for the DataFetchingService and DailyUpdateService

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
    print_status "Checking and installing dependencies..."
    
    # Check for Go
    if ! command_exists go; then
        print_error "Go is not installed. Please install Go first."
        exit 1
    fi
    
    # Check for GCC/G++
    if ! command_exists g++; then
        print_error "G++ is not installed. Please install build-essential first."
        exit 1
    fi
    
    # Check for CMake
    if ! command_exists cmake; then
        print_error "CMake is not installed. Please install CMake first."
        exit 1
    fi
    
    # Check for Make
    if ! command_exists make; then
        print_error "Make is not installed. Please install Make first."
        exit 1
    fi
    
    print_success "All required dependencies are available"
}

# Function to run Go tests
run_go_tests() {
    print_status "Running Go tests for DataFetchingService..."
    
    cd DataFetchingService
    
    # Install Go dependencies
    print_status "Installing Go dependencies..."
    go mod tidy
    
    # Run Go tests
    print_status "Running Go unit tests..."
    if go test -v ./...; then
        print_success "Go tests passed"
    else
        print_error "Go tests failed"
        return 1
    fi
    
    # Run Go tests with coverage
    print_status "Running Go tests with coverage..."
    go test -v -cover ./...
    
    cd ..
}

# Function to build Google Test
build_googletest() {
    print_status "Building Google Test..."
    
    cd DailyUpdateService
    
    # Check if Google Test is already built
    if [ ! -d "deps/googletest-release-1.12.1/build" ]; then
        print_status "Building Google Test from source..."
        
        cd deps/googletest-release-1.12.1
        mkdir -p build
        cd build
        cmake ..
        make -j$(nproc)
        
        cd ../../..
    else
        print_status "Google Test already built, skipping..."
    fi
    
    cd ..
}

# Function to run C++ tests
run_cpp_tests() {
    print_status "Running C++ tests for DailyUpdateService..."
    
    cd DailyUpdateService
    
    # Build all tests
    print_status "Building C++ tests..."
    if make clean && make all; then
        print_success "C++ tests built successfully"
    else
        print_error "Failed to build C++ tests"
        return 1
    fi
    
    # Run individual component tests
    print_status "Running Cache Manager tests..."
    if ./tests/cache_test; then
        print_success "Cache Manager tests passed"
    else
        print_error "Cache Manager tests failed"
        return 1
    fi
    
    print_status "Running Trie Manager tests..."
    if ./tests/trie_test; then
        print_success "Trie Manager tests passed"
    else
        print_error "Trie Manager tests failed"
        return 1
    fi
    
    print_status "Running Main Service tests..."
    if ./tests/main_test; then
        print_success "Main Service tests passed"
    else
        print_error "Main Service tests failed"
        return 1
    fi
    
    # Run integration tests
    print_status "Running integration tests..."
    if make integration-tests; then
        print_success "Integration tests passed"
    else
        print_warning "Integration tests not available or failed"
    fi
    
    cd ..
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    cd DailyUpdateService
    
    # Run performance benchmarks
    if [ -f "tests/performance_test" ]; then
        print_status "Running performance benchmarks..."
        ./tests/performance_test
    else
        print_warning "Performance tests not available"
    fi
    
    cd ..
}

# Function to run memory tests
run_memory_tests() {
    print_status "Running memory tests..."
    
    cd DailyUpdateService
    
    # Check for valgrind
    if command_exists valgrind; then
        print_status "Running memory leak tests with valgrind..."
        
        # Test Cache Manager for memory leaks
        valgrind --leak-check=full --show-leak-kinds=all ./tests/cache_test
        
        # Test Trie Manager for memory leaks
        valgrind --leak-check=full --show-leak-kinds=all ./tests/trie_test
        
        print_success "Memory tests completed"
    else
        print_warning "Valgrind not available, skipping memory tests"
    fi
    
    cd ..
}

# Function to generate test reports
generate_test_reports() {
    print_status "Generating test reports..."
    
    # Create reports directory
    mkdir -p test_reports
    
    # Generate Go test report
    cd DataFetchingService
    go test -v -coverprofile=coverage.out ./...
    go tool cover -html=coverage.out -o ../test_reports/go_coverage.html
    cd ..
    
    print_success "Test reports generated in test_reports/"
}

# Function to run all tests
run_all_tests() {
    print_status "Starting comprehensive test suite..."
    
    local start_time=$(date +%s)
    
    # Install dependencies
    install_dependencies
    
    # Build Google Test
    build_googletest
    
    # Run Go tests
    if ! run_go_tests; then
        print_error "Go tests failed, stopping test suite"
        exit 1
    fi
    
    # Run C++ tests
    if ! run_cpp_tests; then
        print_error "C++ tests failed, stopping test suite"
        exit 1
    fi
    
    # Run performance tests
    run_performance_tests
    
    # Run memory tests
    run_memory_tests
    
    # Generate reports
    generate_test_reports
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_success "All tests completed successfully in ${duration} seconds"
}

# Function to run specific test suite
run_specific_tests() {
    case "$1" in
        "go")
            install_dependencies
            run_go_tests
            ;;
        "cpp")
            install_dependencies
            build_googletest
            run_cpp_tests
            ;;
        "performance")
            install_dependencies
            build_googletest
            run_performance_tests
            ;;
        "memory")
            install_dependencies
            build_googletest
            run_memory_tests
            ;;
        *)
            print_error "Unknown test suite: $1"
            print_status "Available test suites: go, cpp, performance, memory"
            exit 1
            ;;
    esac
}

# Function to clean up
cleanup() {
    print_status "Cleaning up test artifacts..."
    
    # Clean C++ build artifacts
    cd DailyUpdateService
    make clean
    cd ..
    
    # Clean Go test artifacts
    cd DataFetchingService
    go clean -testcache
    cd ..
    
    print_success "Cleanup completed"
}

# Function to show help
show_help() {
    echo "Comprehensive Test Runner for SupplementIQ Tools"
    echo ""
    echo "Usage: $0 [OPTIONS] [TEST_SUITE]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --clean    Clean up test artifacts"
    echo "  -v, --verbose  Verbose output"
    echo ""
    echo "Test Suites:"
    echo "  all           Run all tests (default)"
    echo "  go            Run only Go tests"
    echo "  cpp           Run only C++ tests"
    echo "  performance   Run only performance tests"
    echo "  memory        Run only memory tests"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 go                 # Run only Go tests"
    echo "  $0 cpp                # Run only C++ tests"
    echo "  $0 --clean            # Clean up artifacts"
}

# Main script logic
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--clean)
                cleanup
                exit 0
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            *)
                if [[ -z "$TEST_SUITE" ]]; then
                    TEST_SUITE="$1"
                else
                    print_error "Unknown argument: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Default to running all tests
    if [[ -z "$TEST_SUITE" ]]; then
        TEST_SUITE="all"
    fi
    
    # Run tests based on selection
    case "$TEST_SUITE" in
        "all")
            run_all_tests
            ;;
        "go"|"cpp"|"performance"|"memory")
            run_specific_tests "$TEST_SUITE"
            ;;
        *)
            print_error "Unknown test suite: $TEST_SUITE"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
