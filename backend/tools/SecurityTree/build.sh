#!/bin/bash
set -e

echo "Building C++ SecurityTree..."

# Ensure node-gyp is installed
npm install -g node-gyp

# Install dependencies for the C++ addon
npm install --prefix . node-addon-api

# Build the native addon in release mode
node-gyp configure build --release --directory .

echo "SecurityTree build complete."
