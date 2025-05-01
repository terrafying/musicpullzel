#!/bin/bash

# Exit on error
set -e

echo "Setting up development environment..."

# Function to add environment variables if they don't exist
add_env_var() {
    local var_name=$1
    local var_value=$2
    local config_file=$3
    
    # Check if the variable is already set
    if ! grep -q "^export $var_name=" "$config_file"; then
        echo "export $var_name=\"$var_value\"" >> "$config_file"
    fi
}

# Function to add path if it doesn't exist
add_to_path() {
    local path_to_add=$1
    local config_file=$2
    
    # Check if the path is already in PATH
    if ! grep -q "export PATH=.*$path_to_add" "$config_file"; then
        echo "export PATH=\"$path_to_add:\$PATH\"" >> "$config_file"
    fi
}

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Detected macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Install system dependencies
    echo "Installing system dependencies..."
    brew install pkg-config openssl llvm wasm-pack
    
    # Set up environment variables for OpenSSL
    echo "Setting up OpenSSL environment variables..."
    OPENSSL_PREFIX=$(brew --prefix openssl@3)
    add_env_var "OPENSSL_DIR" "$OPENSSL_PREFIX" ~/.zshrc
    add_env_var "OPENSSL_INCLUDE_DIR" "$OPENSSL_PREFIX/include" ~/.zshrc
    add_env_var "OPENSSL_LIB_DIR" "$OPENSSL_PREFIX/lib" ~/.zshrc
    
    # Set up environment variables for LLVM
    echo "Setting up LLVM environment variables..."
    LLVM_PREFIX=$(brew --prefix llvm)
    add_to_path "$LLVM_PREFIX/bin" ~/.zshrc
    add_env_var "LDFLAGS" "-L$LLVM_PREFIX/lib" ~/.zshrc
    add_env_var "CPPFLAGS" "-I$LLVM_PREFIX/include" ~/.zshrc
    
    # Set up WASM-specific environment variables
    echo "Setting up WASM environment variables..."
    add_env_var "WASM_SYSROOT" "$LLVM_PREFIX/lib/clang/*/include" ~/.zshrc
    add_env_var "C_INCLUDE_PATH" "/usr/local/include:/usr/include:\$C_INCLUDE_PATH" ~/.zshrc
    add_env_var "CPLUS_INCLUDE_PATH" "/usr/local/include:/usr/include:\$CPLUS_INCLUDE_PATH" ~/.zshrc
    
    # Create a wrapper for clang to handle WASM includes
    echo "Creating clang wrapper for WASM compilation..."
    CLANG_WRAPPER="$HOME/.local/bin/clang-wasm"
    mkdir -p "$(dirname "$CLANG_WRAPPER")"
    if [ ! -f "$CLANG_WRAPPER" ]; then
        cat > "$CLANG_WRAPPER" << 'EOF'
#!/bin/bash

# Get the LLVM prefix
LLVM_PREFIX=$(brew --prefix llvm)

# Find the latest Clang version
CLANG_VERSION=$(ls -1 "$LLVM_PREFIX/lib/clang" | sort -V | tail -n1)

# Set up include paths
INCLUDE_PATHS=(
    "-I$LLVM_PREFIX/lib/clang/$CLANG_VERSION/include"
    "-I$LLVM_PREFIX/include"
    "-I/usr/local/include"
    "-I/usr/include"
    "-I/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include"
    "-I/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include"
    "-I/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/$CLANG_VERSION/include"
)

# Add WASM-specific flags
WASM_FLAGS=(
    "--target=wasm32-unknown-unknown"
    "-nostdlib"
    "-nostdinc"
    "-fno-builtin"
    "-fno-exceptions"
    "-fno-rtti"
    "-fno-threadsafe-statics"
    "-fno-stack-protector"
    "-fno-stack-check"
    "-fno-strict-aliasing"
    "-fno-common"
    "-fno-ident"
    "-fno-asynchronous-unwind-tables"
    "-fno-omit-frame-pointer"
    "-fno-unwind-tables"
)

# Combine all arguments
exec clang "${INCLUDE_PATHS[@]}" "${WASM_FLAGS[@]}" "$@"
EOF
        chmod +x "$CLANG_WRAPPER"
    fi
    
    # Create a wrapper for clang++ as well
    CLANGPP_WRAPPER="$HOME/.local/bin/clang++-wasm"
    if [ ! -f "$CLANGPP_WRAPPER" ]; then
        cat > "$CLANGPP_WRAPPER" << 'EOF'
#!/bin/bash

# Get the LLVM prefix
LLVM_PREFIX=$(brew --prefix llvm)

# Find the latest Clang version
CLANG_VERSION=$(ls -1 "$LLVM_PREFIX/lib/clang" | sort -V | tail -n1)

# Set up include paths
INCLUDE_PATHS=(
    "-I$LLVM_PREFIX/lib/clang/$CLANG_VERSION/include"
    "-I$LLVM_PREFIX/include"
    "-I/usr/local/include"
    "-I/usr/include"
    "-I/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include"
    "-I/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include"
    "-I/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/$CLANG_VERSION/include"
)

# Add WASM-specific flags
WASM_FLAGS=(
    "--target=wasm32-unknown-unknown"
    "-nostdlib"
    "-nostdinc"
    "-fno-builtin"
    "-fno-exceptions"
    "-fno-rtti"
    "-fno-threadsafe-statics"
    "-fno-stack-protector"
    "-fno-stack-check"
    "-fno-strict-aliasing"
    "-fno-common"
    "-fno-ident"
    "-fno-asynchronous-unwind-tables"
    "-fno-omit-frame-pointer"
    "-fno-unwind-tables"
)

# Combine all arguments
exec clang++ "${INCLUDE_PATHS[@]}" "${WASM_FLAGS[@]}" "$@"
EOF
        chmod +x "$CLANGPP_WRAPPER"
    fi
    
    # Add wrappers to PATH
    add_to_path "$HOME/.local/bin" ~/.zshrc

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Detected Linux"
    
    # Install system dependencies
    echo "Installing system dependencies..."
    sudo apt-get update
    sudo apt-get install -y build-essential pkg-config libssl-dev clang llvm libc6-dev

else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

# Install Rust if not already installed
if ! command -v rustup &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.sh | sh
fi

# Add WASM target if not already added
if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    echo "Adding WASM target..."
    rustup target add wasm32-unknown-unknown
fi

# Install wasm-pack if not already installed
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Install Bun if not already installed
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
fi

# Create a .cargo/config.toml for better WASM compilation
echo "Setting up Cargo configuration for WASM..."
mkdir -p .cargo
if [ ! -f .cargo/config.toml ]; then
    cat > .cargo/config.toml << 'EOF'
[target.wasm32-unknown-unknown]
rustflags = [
    "-C", "link-arg=--no-entry",
    "-C", "link-arg=--export-dynamic",
    "-C", "target-feature=+atomics,+bulk-memory"
]

[env]
CC = { value = "clang-wasm", force = true }
CXX = { value = "clang++-wasm", force = true }
CFLAGS = { value = "-nostdlib -nostdinc -fno-builtin -fno-exceptions -fno-rtti -fno-threadsafe-statics", force = true }
CXXFLAGS = { value = "-nostdlib -nostdinc -fno-builtin -fno-exceptions -fno-rtti -fno-threadsafe-statics", force = true }

[build]
target = "wasm32-unknown-unknown"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'

[profile.release.package."*"]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'

[profile.release.package.getrandom]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'
features = ["js", "wasm-bindgen"]

[profile.release.package.ring]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'

[profile.release.package.zstd-sys]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'

[profile.release.package.lzma-sys]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'
features = ["static"]

[profile.release.package.bzip2-sys]
opt-level = 3
lto = true
codegen-units = 1
panic = 'abort'
EOF
fi

echo "Development environment setup complete!"
echo "Please restart your terminal or run 'source ~/.zshrc' to apply the changes." 