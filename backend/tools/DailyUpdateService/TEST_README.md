# DailyUpdateService Test Suite

This document describes the comprehensive test suite for the DailyUpdateService, including Go Supabase component tests and C++ component tests.

## Test Structure

### Go Tests (`go-supabase/main_test.go`)
- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test component interactions
- **Performance Tests**: Benchmark database operations
- **Mock Tests**: Test with mock Supabase responses

### C++ Tests
- **TrieManager Tests** (`components/trie/TrieManager_test.cpp`)
- **CacheManager Tests** (`components/cache/CacheManager_test.cpp`)
- **Main Service Tests** (`DailyUpdateServiceV2_test.cpp`)

## Test Coverage

### Go Supabase Component Tests
- ✅ `BatchCheckAndInsert` functionality
- ✅ `BatchCheckProductsExist` with single query optimization
- ✅ Rate limiting and exponential backoff
- ✅ NULL year handling for reformulation detection
- ✅ Trie data extraction (brand + name + flavor only)
- ✅ Error handling and edge cases
- ✅ Performance benchmarking

### C++ Component Tests
- ✅ **TrieManager**: Autocomplete functionality, JSON persistence, system outage recovery
- ✅ **CacheManager**: Cache operations, AdminCache management, cold start recovery
- ✅ **DailyUpdateServiceV2**: Service lifecycle, queue processing, component orchestration

## Running Tests

### Quick Start
```bash
# Run all tests
./run_tests.sh

# Run specific test types
./run_tests.sh go          # Go tests only
./run_tests.sh cpp         # C++ tests only
./run_tests.sh integration # Integration tests
./run_tests.sh performance # Performance tests
```

### Using Makefile
```bash
# Build all test executables
make all

# Run all tests
make test

# Run specific tests
make test-go      # Go tests
make test-cpp     # C++ tests
make test-cache   # Cache Manager tests
make test-trie    # Trie Manager tests
make test-main    # Main service tests
```

### Manual Testing
```bash
# Go tests
cd go-supabase
go test -v

# C++ tests
make test-cache
make test-trie
make test-main
```

## Test Scenarios

### Database Operations
1. **Single Query Optimization**: Verify that batch checking uses only one database call
2. **NULL Year Handling**: Test products with and without year parameters
3. **Duplicate Detection**: Ensure existing products are not re-inserted
4. **Rate Limiting**: Verify exponential backoff prevents Supabase rate limiting
5. **Error Handling**: Test graceful handling of database errors

### Trie Integration
1. **Data Extraction**: Verify trie gets only brand + name + flavor (no year)
2. **JSON Persistence**: Test system outage recovery with JSON backup
3. **Autocomplete**: Test case-insensitive and partial matching
4. **Performance**: Benchmark large dataset operations

### Cache Management
1. **Daily Reset**: Verify cache clearing at 12 AM PST
2. **AdminCache**: Test admin count caching and cold start recovery
3. **File Operations**: Test JSON file creation, reading, and error handling
4. **Concurrent Access**: Test thread safety

### Service Lifecycle
1. **Initialization**: Test service startup and component initialization
2. **Daily Updates**: Test scheduled operations at 12 AM PST
3. **Queue Processing**: Test product queue handling
4. **Error Recovery**: Test graceful handling of failures

## Test Data

### Mock Products
```json
[
  {
    "name": "Gold Standard Whey",
    "brand": "Optimum Nutrition",
    "flavor": "Chocolate",
    "year": "2023"
  },
  {
    "name": "Nitro-Tech",
    "brand": "MuscleTech",
    "flavor": "Strawberry",
    "year": "2024"
  }
]
```

### Test Scenarios
- **Empty Input**: Handle empty product queues gracefully
- **Invalid JSON**: Test error handling for malformed data
- **Large Datasets**: Performance testing with 1000+ products
- **Concurrent Operations**: Test thread safety and race conditions

## Performance Benchmarks

### Expected Performance
- **Database Operations**: 1 query for 1000 products (vs 1000+ individual queries)
- **Trie Operations**: < 1 second for 1000 product searches
- **Cache Operations**: < 5 seconds for 100 cache operations
- **Service Startup**: < 2 seconds for full initialization

### Benchmark Results
```bash
# Run performance tests
./run_tests.sh performance

# Generate coverage report
./run_tests.sh coverage
```

## Dependencies

### Required Tools
- **Go 1.19+**: For Go component tests
- **g++**: For C++ compilation
- **Google Test**: For C++ unit testing
- **make**: For build automation

### Installation (Ubuntu/Debian)
```bash
# Install dependencies
./run_tests.sh deps

# Or manually
sudo apt-get install build-essential libgtest-dev cmake
```

## Test Environment

### Environment Variables
```bash
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="test-key"
export TEST_MODE="true"
```

### Test Directories
- **Go Tests**: `go-supabase/`
- **C++ Tests**: `tests/`
- **Test Data**: `/tmp/daily_update_test/`
- **Coverage**: `go-supabase/coverage.html`

## Continuous Integration

### GitHub Actions (Example)
```yaml
name: DailyUpdateService Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v3
        with:
          go-version: '1.19'
      - run: ./run_tests.sh
```

## Troubleshooting

### Common Issues
1. **Google Test Not Found**: Run `./run_tests.sh deps`
2. **Permission Denied**: Run `chmod +x run_tests.sh`
3. **Go Module Issues**: Run `cd go-supabase && go mod tidy`
4. **Compilation Errors**: Check C++ compiler version (requires C++17)

### Debug Mode
```bash
# Run tests with verbose output
go test -v -race
make test-cpp VERBOSE=1
```

## Test Results

### Success Criteria
- ✅ All unit tests pass
- ✅ Integration tests pass
- ✅ Performance benchmarks meet requirements
- ✅ Coverage > 80%
- ✅ No memory leaks
- ✅ Thread safety verified

### Reporting
- **Test Results**: Console output with colored status
- **Coverage Report**: HTML report in `go-supabase/coverage.html`
- **Performance Metrics**: Benchmark results in console
- **Error Logs**: Detailed error messages for failures

## Contributing

### Adding New Tests
1. Follow existing test patterns
2. Add comprehensive test cases
3. Include performance benchmarks
4. Update documentation
5. Ensure CI compatibility

### Test Guidelines
- **Unit Tests**: Test individual functions
- **Integration Tests**: Test component interactions
- **Performance Tests**: Benchmark critical operations
- **Edge Cases**: Test error conditions and boundary cases
- **Documentation**: Document test scenarios and expected behavior
