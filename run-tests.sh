#!/bin/bash

# Simple script to run pallet tests
echo "🧪 Running pallet-sponsorship tests..."

# Check if we're in a Docker environment or have Rust installed
if command -v cargo &> /dev/null; then
    echo "✅ Found cargo, running tests directly..."
    cargo test -p pallet-sponsorship --verbose
else
    echo "❌ Cargo not found. Please install Rust or use Docker."
    echo "To install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi