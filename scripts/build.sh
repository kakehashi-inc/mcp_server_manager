#!/bin/bash

# Build script for MCP Server Manager

echo "Building MCP Server Manager..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/
rm -rf release/

# Build main process
echo "Building main process..."
npm run build:main

# Build renderer process
echo "Building renderer process..."
npm run build:renderer

# Build electron app
echo "Building Electron app..."
npm run dist

echo "Build complete! Check the release/ directory for the built application."
