# Makefile for C++ Autocomplete Service
# High-performance multithreaded autocomplete with Node.js bindings

# Compiler settings
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O3 -fPIC -pthread
INCLUDES = -I. -I$(shell node -p "require('node-addon-api').include")
LIBS = -pthread

# Node.js settings
NODE_VERSION = $(shell node --version | cut -d'v' -f2)
NODE_ABI = $(shell node -p "process.versions.modules")

# Build directory
BUILD_DIR = build
RELEASE_DIR = $(BUILD_DIR)/Release

# Source files
SOURCES = AutocompleteService.cpp binding.cpp
OBJECTS = $(SOURCES:.cpp=.o)
TARGET = $(RELEASE_DIR)/autocomplete_service.node

# Default target
all: $(TARGET)

# Create build directories
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)
	mkdir -p $(RELEASE_DIR)

# Compile C++ source files
%.o: %.cpp | $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Link the Node.js addon
$(TARGET): $(OBJECTS) | $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) -shared -o $@ $(OBJECTS) $(LIBS)
	@echo "✅ C++ Autocomplete Service built successfully"

# Install using node-gyp (alternative method)
install-gyp:
	@echo "🔨 Building with node-gyp..."
	node-gyp configure
	node-gyp build
	@echo "✅ C++ Autocomplete Service built with node-gyp"

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR)
	rm -f *.o
	rm -f *.node
	@echo "🧹 Build artifacts cleaned"

# Install dependencies
deps:
	@echo "📦 Installing Node.js dependencies..."
	npm install node-addon-api
	npm install -g node-gyp
	@echo "✅ Dependencies installed"

# Test the build
test: $(TARGET)
	@echo "🧪 Testing C++ Autocomplete Service..."
	node -e "console.log('Testing C++ service...'); const service = require('./$(TARGET)'); console.log('✅ C++ service loaded successfully');"

# Performance benchmark
benchmark: $(TARGET)
	@echo "⚡ Running performance benchmark..."
	node -e "\
		const service = require('./$(TARGET)'); \
		const start = Date.now(); \
		for(let i = 0; i < 10000; i++) { \
			service.searchProducts('test'); \
		} \
		const end = Date.now(); \
		console.log('✅ 10,000 searches completed in', end - start, 'ms'); \
	"

# Development build (with debug symbols)
dev: CXXFLAGS += -g -DDEBUG
dev: $(TARGET)

# Release build (optimized)
release: CXXFLAGS += -DNDEBUG -O3 -march=native
release: $(TARGET)

# Help
help:
	@echo "Available targets:"
	@echo "  all          - Build the C++ Autocomplete Service (default)"
	@echo "  install-gyp  - Build using node-gyp"
	@echo "  clean        - Remove build artifacts"
	@echo "  deps         - Install Node.js dependencies"
	@echo "  test         - Test the built service"
	@echo "  benchmark    - Run performance benchmark"
	@echo "  dev          - Development build with debug symbols"
	@echo "  release      - Optimized release build"
	@echo "  help         - Show this help message"

# Phony targets
.PHONY: all clean deps test benchmark dev release help install-gyp
