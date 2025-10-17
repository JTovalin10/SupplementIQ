# Comprehensive Test Documentation for SupplementIQ Tools

This document provides detailed information about the testing infrastructure for the SupplementIQ tools, including the DataFetchingService and DailyUpdateService.

## Table of Contents

1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [DataFetchingService Tests](#datafetchingservice-tests)
4. [DailyUpdateService Tests](#dailyupdateservice-tests)
5. [Integration Tests](#integration-tests)
6. [Performance Tests](#performance-tests)
7. [Running Tests](#running-tests)
8. [Test Reports](#test-reports)
9. [Continuous Integration](#continuous-integration)

## Overview

The SupplementIQ tools testing suite includes:

- **Go Unit Tests**: For the DataFetchingService components
- **C++ Unit Tests**: For the DailyUpdateService components using Google Test
- **Integration Tests**: End-to-end testing of component interactions
- **Performance Tests**: Benchmarking and performance validation
- **Memory Tests**: Memory leak detection using Valgrind

## Test Architecture

### Test Categories

1. **Unit Tests**
   - Individual component testing
   - Mock dependencies
   - Fast execution
   - High coverage

2. **Integration Tests**
   - Component interaction testing
   - Real dependencies
   - End-to-end workflows
   - Database integration

3. **Performance Tests**
   - Benchmark execution times
   - Memory usage monitoring
   - Concurrent operation testing
   - Stress testing

4. **Memory Tests**
   - Memory leak detection
   - Buffer overflow detection
   - Resource cleanup validation

## DataFetchingService Tests

### Test Files

- `pending_products_test.go` - Pending products workflow tests
- `main_test.go` - HTTP handler tests
- `database_test.go` - Database operation tests
- `product_insertion_test.go` - Product insertion logic tests

### Test Coverage

#### Pending Products Workflow
- ✅ Product submission validation
- ✅ Approval/rejection workflow
- ✅ Status transitions
- ✅ Data persistence
- ✅ Category-specific details handling
- ✅ Error handling and validation

#### Database Operations
- ✅ CRUD operations
- ✅ Transaction handling
- ✅ Data integrity
- ✅ Performance optimization

#### HTTP Handlers
- ✅ Request validation
- ✅ Response formatting
- ✅ Error handling
- ✅ Authentication/authorization

### Running Go Tests

```bash
cd DataFetchingService
go test -v ./...                    # Run all tests
go test -v -cover ./...             # Run with coverage
go test -v -race ./...              # Run with race detection
go test -v -bench=. ./...           # Run benchmarks
```

## DailyUpdateService Tests

### Test Files

#### Unit Tests
- `CacheManager_test.cpp` - Cache management tests
- `TrieManager_test.cpp` - Trie data structure tests
- `DailyUpdateServiceV2_test.cpp` - Main service tests

#### Integration Tests
- `CacheManager_integration_test.cpp` - Cache integration tests
- `TrieManager_integration_test.cpp` - Trie integration tests
- `GoIntegration_integration_test.cpp` - Go integration tests

### Test Coverage

#### Cache Manager
- ✅ Cache initialization
- ✅ Cache reset operations
- ✅ Admin cache refresh
- ✅ State persistence
- ✅ Concurrent access
- ✅ Statistics tracking

#### Trie Manager
- ✅ Trie initialization
- ✅ Data insertion/retrieval
- ✅ JSON persistence
- ✅ Batch operations
- ✅ Concurrent operations
- ✅ Performance optimization

#### Go Integration
- ✅ Go binary execution
- ✅ Product migration
- ✅ Error handling
- ✅ Concurrent operations
- ✅ Performance monitoring

### Running C++ Tests

```bash
cd DailyUpdateService
make clean && make all              # Build all tests
make test                          # Run unit tests
make integration-tests             # Run integration tests
make test-all                      # Run all tests
```

## Integration Tests

### Test Scenarios

#### End-to-End Workflow
1. **Product Submission**
   - Submit product via API
   - Validate data persistence
   - Check status tracking

2. **Approval Process**
   - Admin review workflow
   - Status transitions
   - Notification system

3. **Product Migration**
   - Approved product migration
   - Data integrity validation
   - Cleanup verification

4. **Cache Management**
   - Cache initialization
   - Data refresh cycles
   - Outage recovery

5. **Trie Operations**
   - Autocomplete data updates
   - JSON persistence
   - Cold start recovery

### Integration Test Environment

- **Database**: Real Supabase connection
- **File System**: Temporary directories
- **Go Components**: Mock implementations
- **Network**: Local HTTP requests

## Performance Tests

### Benchmarks

#### DataFetchingService
- Product submission throughput
- Database query performance
- API response times
- Concurrent request handling

#### DailyUpdateService
- Cache operation speed
- Trie update performance
- Go integration latency
- Memory usage patterns

### Performance Criteria

- **API Response Time**: < 200ms for 95% of requests
- **Database Queries**: < 100ms for simple queries
- **Cache Operations**: < 10ms for cache hits
- **Trie Updates**: < 50ms for 1000 products
- **Memory Usage**: < 100MB for normal operations

## Running Tests

### Quick Start

```bash
# Run all tests
./run_comprehensive_tests.sh

# Run specific test suite
./run_comprehensive_tests.sh go
./run_comprehensive_tests.sh cpp
./run_comprehensive_tests.sh performance
./run_comprehensive_tests.sh memory

# Clean up artifacts
./run_comprehensive_tests.sh --clean
```

### Manual Test Execution

#### Go Tests
```bash
cd DataFetchingService
go test -v -cover ./...
go test -v -race ./...
go test -v -bench=. ./...
```

#### C++ Tests
```bash
cd DailyUpdateService
make clean && make all
make test
make integration-tests
```

#### Performance Tests
```bash
cd DailyUpdateService
make performance-tests
```

#### Memory Tests
```bash
cd DailyUpdateService
valgrind --leak-check=full ./tests/cache_test
valgrind --leak-check=full ./tests/trie_test
```

## Test Reports

### Generated Reports

1. **Coverage Reports**
   - Go code coverage (HTML format)
   - C++ code coverage (if available)

2. **Performance Reports**
   - Benchmark results
   - Memory usage graphs
   - Execution time analysis

3. **Test Results**
   - Pass/fail status
   - Error logs
   - Performance metrics

### Report Location

All test reports are generated in the `test_reports/` directory:

```
test_reports/
├── go_coverage.html          # Go test coverage report
├── cpp_coverage.html         # C++ test coverage report
├── performance_results.json  # Performance benchmark results
├── memory_report.txt         # Memory test results
└── test_summary.json         # Overall test summary
```

## Continuous Integration

### GitHub Actions Integration

The test suite is designed to integrate with GitHub Actions for automated testing:

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Go
        uses: actions/setup-go@v3
        with:
          go-version: '1.21'
      - name: Setup C++
        uses: actions/setup-cpp@v1
        with:
          cc: gcc
          cxx: g++
      - name: Run Tests
        run: ./backend/tools/run_comprehensive_tests.sh
```

### Pre-commit Hooks

Install pre-commit hooks to run tests before commits:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## Test Data Management

### Mock Data

- **Test Products**: Predefined product data for testing
- **Mock Users**: Test user accounts with various roles
- **Mock Brands**: Test brand data for product associations

### Database State

- **Isolation**: Each test runs in isolation
- **Cleanup**: Automatic cleanup after test completion
- **Rollback**: Transaction rollback for data integrity

### File System

- **Temporary Directories**: Each test uses isolated temp directories
- **Cleanup**: Automatic cleanup of test artifacts
- **Permissions**: Proper file permissions for testing

## Troubleshooting

### Common Issues

1. **Google Test Build Failures**
   ```bash
   # Rebuild Google Test
   cd DailyUpdateService/deps/googletest-release-1.12.1
   rm -rf build
   mkdir build && cd build
   cmake .. && make
   ```

2. **Go Module Issues**
   ```bash
   # Clean and rebuild Go modules
   cd DataFetchingService
   go clean -modcache
   go mod download
   go mod tidy
   ```

3. **Permission Issues**
   ```bash
   # Fix script permissions
   chmod +x run_comprehensive_tests.sh
   chmod +x DailyUpdateService/run_tests.sh
   ```

4. **Memory Test Failures**
   ```bash
   # Install Valgrind
   sudo apt-get install valgrind
   
   # Run with reduced checks
   valgrind --leak-check=summary ./tests/cache_test
   ```

### Debug Mode

Run tests in debug mode for detailed output:

```bash
# Enable verbose output
./run_comprehensive_tests.sh --verbose

# Enable debug symbols
cd DailyUpdateService
make CXXFLAGS="-g -O0" clean && make CXXFLAGS="-g -O0" all
```

## Best Practices

### Writing Tests

1. **Test Naming**: Use descriptive test names
2. **Test Isolation**: Each test should be independent
3. **Mock Dependencies**: Use mocks for external dependencies
4. **Assertions**: Use specific assertions with clear messages
5. **Cleanup**: Always clean up test artifacts

### Test Organization

1. **Group Related Tests**: Use test suites for related functionality
2. **Test Data**: Use consistent test data across tests
3. **Helper Functions**: Create helper functions for common operations
4. **Documentation**: Document complex test scenarios

### Performance Testing

1. **Baseline Metrics**: Establish performance baselines
2. **Regression Detection**: Monitor for performance regressions
3. **Resource Monitoring**: Track memory and CPU usage
4. **Load Testing**: Test under various load conditions

## Conclusion

This comprehensive testing suite ensures the reliability, performance, and maintainability of the SupplementIQ tools. Regular execution of these tests helps catch issues early and maintain code quality throughout the development process.

For questions or issues with the testing infrastructure, please refer to the troubleshooting section or contact the development team.
