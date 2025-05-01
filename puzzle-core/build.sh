#!/bin/bash

# Install wasm-pack if not already installed
if ! command -v wasm-pack &> /dev/null; then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the project with WASM-specific flags
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory -C panic=abort -C lto=thin' wasm-pack build --target web --out-dir ../puzzle-web/src/wasm -- --no-default-features --features wasm

# Copy the built files to the web project
cp -r pkg/* ../puzzle-web/src/wasm/ 