# DailyUpdateService Test Makefile

# Compiler settings
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -g -O2
INCLUDES = -I. -Icomponents/cache -Icomponents/trie -Icomponents/go-integration -Ideps/googletest-release-1.12.1/googletest/include
LDFLAGS = -Ldeps/googletest-release-1.12.1/build/lib

# Go settings
GO = go
GOFLAGS = -v

# Test directories
TEST_DIR = tests
GO_TEST_DIR = go-supabase

# Source directories
CACHE_DIR = components/cache
TRIE_DIR = components/trie
GO_INTEGRATION_DIR = components/go-integration

# Test executables
GO_TEST_EXE = $(GO_TEST_DIR)/main_test
CACHE_TEST_EXE = $(TEST_DIR)/cache_test
TRIE_TEST_EXE = $(TEST_DIR)/trie_test
MAIN_TEST_EXE = $(TEST_DIR)/main_test

# Integration test executables
CACHE_INTEGRATION_TEST_EXE = $(TEST_DIR)/cache_integration_test
TRIE_INTEGRATION_TEST_EXE = $(TEST_DIR)/trie_integration_test
GO_INTEGRATION_TEST_EXE = $(TEST_DIR)/go_integration_test

# All test executables
ALL_TESTS = $(GO_TEST_EXE) $(CACHE_TEST_EXE) $(TRIE_TEST_EXE) $(MAIN_TEST_EXE)
ALL_INTEGRATION_TESTS = $(CACHE_INTEGRATION_TEST_EXE) $(TRIE_INTEGRATION_TEST_EXE) $(GO_INTEGRATION_TEST_EXE)

# Default target
.PHONY: all
all: $(ALL_TESTS)

# Go tests
$(GO_TEST_EXE): $(GO_TEST_DIR)/main_test.go $(GO_TEST_DIR)/main.go
	@echo "Building Go tests..."
	cd $(GO_TEST_DIR) && $(GO) test -c -o main_test
	@echo "Go tests built successfully"

# Cache Manager tests
$(CACHE_TEST_EXE): $(CACHE_DIR)/CacheManager_test.cpp $(CACHE_DIR)/CacheManager.cpp $(CACHE_DIR)/CacheManager.h
	@echo "Building Cache Manager tests..."
	@mkdir -p $(TEST_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(LDFLAGS) -o $@ $^ -lgtest -lgtest_main -lpthread
	@echo "Cache Manager tests built successfully"

# Trie Manager tests
$(TRIE_TEST_EXE): $(TRIE_DIR)/TrieManager_test.cpp $(TRIE_DIR)/TrieManager.cpp $(TRIE_DIR)/TrieManager.h
	@echo "Building Trie Manager tests..."
	@mkdir -p $(TEST_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(LDFLAGS) -o $@ $^ -lgtest -lgtest_main -lpthread
	@echo "Trie Manager tests built successfully"


# Main DailyUpdateService tests
$(MAIN_TEST_EXE): DailyUpdateServiceV2_test.cpp DailyUpdateServiceV2.cpp DailyUpdateServiceV2.h \
                  $(CACHE_DIR)/CacheManager.cpp $(CACHE_DIR)/CacheManager.h \
                  $(TRIE_DIR)/TrieManager.cpp $(TRIE_DIR)/TrieManager.h \
                  $(GO_INTEGRATION_DIR)/GoIntegration.cpp $(GO_INTEGRATION_DIR)/GoIntegration.h
	@echo "Building Main DailyUpdateService tests..."
	@mkdir -p $(TEST_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(LDFLAGS) -o $@ $^ -lgtest -lgtest_main -lpthread
	@echo "Main DailyUpdateService tests built successfully"

# Integration tests
$(CACHE_INTEGRATION_TEST_EXE): $(CACHE_DIR)/CacheManager_integration_test.cpp $(CACHE_DIR)/CacheManager.cpp $(CACHE_DIR)/CacheManager.h
	@echo "Building Cache Manager integration tests..."
	@mkdir -p $(TEST_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(LDFLAGS) -o $@ $^ -lgtest -lgtest_main -lpthread
	@echo "Cache Manager integration tests built successfully"

$(TRIE_INTEGRATION_TEST_EXE): $(TRIE_DIR)/TrieManager_integration_test.cpp $(TRIE_DIR)/TrieManager.cpp $(TRIE_DIR)/TrieManager.h
	@echo "Building Trie Manager integration tests..."
	@mkdir -p $(TEST_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(LDFLAGS) -o $@ $^ -lgtest -lgtest_main -lpthread
	@echo "Trie Manager integration tests built successfully"

$(GO_INTEGRATION_TEST_EXE): $(GO_INTEGRATION_DIR)/GoIntegration_integration_test.cpp $(GO_INTEGRATION_DIR)/GoIntegration.cpp $(GO_INTEGRATION_DIR)/GoIntegration.h
	@echo "Building Go Integration integration tests..."
	@mkdir -p $(TEST_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(LDFLAGS) -o $@ $^ -lgtest -lgtest_main -lpthread
	@echo "Go Integration integration tests built successfully"

# Run all tests
.PHONY: test
test: $(ALL_TESTS)
	@echo "Running all tests..."
	@echo "=========================================="
	@echo "Running Go Supabase tests..."
	cd $(GO_TEST_DIR) && $(GO) test -v
	@echo "=========================================="
	@echo "Running Cache Manager tests..."
	./$(CACHE_TEST_EXE)
	@echo "=========================================="
	@echo "Running Trie Manager tests..."
	./$(TRIE_TEST_EXE)
	@echo "=========================================="
	@echo "Running Main DailyUpdateService tests..."
	./$(MAIN_TEST_EXE)
	@echo "=========================================="
	@echo "All tests completed!"

# Run Go tests only
.PHONY: test-go
test-go: $(GO_TEST_EXE)
	@echo "Running Go Supabase tests..."
	cd $(GO_TEST_DIR) && $(GO) test -v

# Run C++ tests only
.PHONY: test-cpp
test-cpp: $(CACHE_TEST_EXE) $(TRIE_TEST_EXE) $(MAIN_TEST_EXE)
	@echo "Running C++ tests..."
	@echo "=========================================="
	@echo "Running Cache Manager tests..."
	./$(CACHE_TEST_EXE)
	@echo "=========================================="
	@echo "Running Trie Manager tests..."
	./$(TRIE_TEST_EXE)
	@echo "Running Main DailyUpdateService tests..."
	./$(MAIN_TEST_EXE)

# Run integration tests
.PHONY: integration-tests
integration-tests: $(ALL_INTEGRATION_TESTS)
	@echo "Running integration tests..."
	@echo "=========================================="
	@echo "Running Cache Manager integration tests..."
	./$(CACHE_INTEGRATION_TEST_EXE)
	@echo "=========================================="
	@echo "Running Trie Manager integration tests..."
	./$(TRIE_INTEGRATION_TEST_EXE)
	@echo "=========================================="
	@echo "Running Go Integration integration tests..."
	./$(GO_INTEGRATION_TEST_EXE)

# Run all tests including integration
.PHONY: test-all
test-all: test integration-tests
	@echo "All tests completed successfully"

# Run specific test
.PHONY: test-cache
test-cache: $(CACHE_TEST_EXE)
	@echo "Running Cache Manager tests..."
	./$(CACHE_TEST_EXE)


.PHONY: test-trie
test-trie: $(TRIE_TEST_EXE)
	@echo "Running Trie Manager tests..."
	./$(TRIE_TEST_EXE)

.PHONY: test-main
test-main: $(MAIN_TEST_EXE)
	@echo "Running Main DailyUpdateService tests..."
	./$(MAIN_TEST_EXE)

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(TEST_DIR)
	cd $(GO_TEST_DIR) && rm -f main_test
	@echo "Clean completed!"

# Install dependencies (Ubuntu/Debian)
.PHONY: install-deps
install-deps:
	@echo "Installing dependencies..."
	sudo apt-get update
	sudo apt-get install -y build-essential libgtest-dev cmake
	cd /usr/src/gtest && sudo cmake . && sudo make && sudo make install
	@echo "Dependencies installed!"

# Format code
.PHONY: format
format:
	@echo "Formatting code..."
	find . -name "*.cpp" -o -name "*.h" | xargs clang-format -i
	cd $(GO_TEST_DIR) && $(GO) fmt
	@echo "Code formatted!"

# Lint code
.PHONY: lint
lint:
	@echo "Linting code..."
	find . -name "*.cpp" -o -name "*.h" | xargs cppcheck --enable=all --std=c++17
	cd $(GO_TEST_DIR) && $(GO) vet
	@echo "Linting completed!"

# Coverage report
.PHONY: coverage
coverage: $(GO_TEST_EXE)
	@echo "Generating coverage report..."
	cd $(GO_TEST_DIR) && $(GO) test -coverprofile=coverage.out
	cd $(GO_TEST_DIR) && $(GO) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: $(GO_TEST_DIR)/coverage.html"

# Help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  all          - Build all test executables"
	@echo "  test         - Run all tests"
	@echo "  test-go      - Run Go tests only"
	@echo "  test-cpp     - Run C++ tests only"
	@echo "  test-cache   - Run Cache Manager tests only"
	@echo "  test-trie    - Run Trie Manager tests only"
	@echo "  test-main    - Run Main DailyUpdateService tests only"
	@echo "  clean        - Clean build artifacts"
	@echo "  install-deps - Install dependencies (Ubuntu/Debian)"
	@echo "  format       - Format code"
	@echo "  lint         - Lint code"
	@echo "  coverage     - Generate coverage report"
	@echo "  help         - Show this help message"
