#!/bin/bash

# Install wasm-pack if not already installed
if ! command -v wasm-pack &> /dev/null; then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the project
wasm-pack build --target web

# Copy the built files to the web project
cp -r pkg/* ../puzzle-web/src/wasm/ 