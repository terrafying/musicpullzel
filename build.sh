#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${GREEN}==>${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}Error:${NC} $1"
    exit 1
}

# Check for required tools
check_tool() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 is required but not installed"
    fi
}

# Check prerequisites
print_status "Checking prerequisites..."
check_tool rustc
check_tool cargo
check_tool wasm-pack

# Ensure wasm32 target is installed
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    print_status "Installing wasm32 target..."
    rustup target add wasm32-unknown-unknown
fi

# Build core library
print_status "Building core library..."
cd puzzle-core
cargo build --release

# Build WASM
print_status "Building WASM..."
wasm-pack build --target web --release

# Verify WASM build
if [ ! -f "pkg/puzzle_core_bg.wasm" ]; then
    print_error "WASM build failed - missing puzzle_core_bg.wasm"
fi

# Build web app
print_status "Building web app..."
cd ../puzzle-web
bun install
bun run build

print_status "Build complete! 🎉" 