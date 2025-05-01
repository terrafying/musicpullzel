#!/bin/bash

# Create a directory for libtorch
mkdir -p libtorch

# Download and extract libtorch
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    curl -L https://download.pytorch.org/libtorch/cpu/libtorch-macos-2.1.0.zip -o libtorch.zip
    unzip libtorch.zip -d .
else
    # Linux
    curl -L https://download.pytorch.org/libtorch/cpu/libtorch-cxx11-abi-shared-with-deps-2.1.0%2Bcpu.zip -o libtorch.zip
    unzip libtorch.zip -d .
fi

# Set environment variable
echo "export LIBTORCH=$(pwd)/libtorch" >> ~/.bashrc
echo "export LD_LIBRARY_PATH=\$LIBTORCH/lib:\$LD_LIBRARY_PATH" >> ~/.bashrc

# Clean up
rm libtorch.zip

echo "LibTorch has been installed and environment variables have been set."
echo "Please source ~/.bashrc or restart your terminal to apply the changes." 