# Makefile for DailyUpdateService C++ addon

# Variables
NODE_GYP = node-gyp
BUILD_DIR = build
RELEASE_DIR = $(BUILD_DIR)/Release
PACKAGE_NAME = daily_update_service

# Default target
all: deps build

# Install dependencies
deps:
	@echo "📦 Installing dependencies..."
	npm install nan node-addon-api

# Build the addon
build: deps
	@echo "🔨 Building DailyUpdateService addon..."
	$(NODE_GYP) configure
	$(NODE_GYP) build

# Build for release
release: clean build
	@echo "✅ Release build completed"
	@echo "📁 Output: $(RELEASE_DIR)/$(PACKAGE_NAME).node"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	$(NODE_GYP) clean
	rm -rf $(BUILD_DIR)

# Test the addon
test: build
	@echo "🧪 Testing DailyUpdateService addon..."
	node -e "console.log('Testing addon loading...'); const addon = require('./$(RELEASE_DIR)/$(PACKAGE_NAME)'); console.log('✅ Addon loaded successfully');"

# Install the addon
install: build
	@echo "📦 Installing addon..."
	cp $(RELEASE_DIR)/$(PACKAGE_NAME).node ./

# Help
help:
	@echo "DailyUpdateService Build System"
	@echo "=============================="
	@echo "Available targets:"
	@echo "  all      - Install deps and build (default)"
	@echo "  deps     - Install dependencies"
	@echo "  build    - Build the addon"
	@echo "  release  - Clean and build for release"
	@echo "  clean    - Clean build artifacts"
	@echo "  test     - Test the addon"
	@echo "  install  - Install the built addon"
	@echo "  help     - Show this help"

.PHONY: all deps build release clean test install help
