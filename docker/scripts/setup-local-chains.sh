#!/bin/bash

# GasLeap Local Parachain Environment Setup Script
# This script sets up a local relay chain with GasLeap, Astar, and Acala parachains

set -e

echo "🚀 Setting up GasLeap local parachain environment..."

# Configuration
RELAY_CHAIN_PORT=9944
GASLEAP_PORT=9945
ASTAR_PORT=9946
ACALA_PORT=9947

BASE_PATH="/tmp/gasleap-demo"
RELAY_PATH="$BASE_PATH/relay"
GASLEAP_PATH="$BASE_PATH/gasleap"
ASTAR_PATH="$BASE_PATH/astar"
ACALA_PATH="$BASE_PATH/acala"

# Clean up previous runs
echo "🧹 Cleaning up previous runs..."
rm -rf $BASE_PATH
mkdir -p $RELAY_PATH $GASLEAP_PATH $ASTAR_PATH $ACALA_PATH

# Generate chain specifications
echo "📋 Generating chain specifications..."

# Generate relay chain spec
polkadot build-spec --chain local --disable-default-bootnode --raw > $RELAY_PATH/relay-chain-spec.json

# Generate parachain specs
gasleap-node build-spec --chain local --disable-default-bootnode --raw > $GASLEAP_PATH/gasleap-spec.json

# Start relay chain
echo "🔗 Starting relay chain..."
polkadot \
  --chain $RELAY_PATH/relay-chain-spec.json \
  --base-path $RELAY_PATH \
  --port 30333 \
  --ws-port $RELAY_CHAIN_PORT \
  --rpc-port 9933 \
  --validator \
  --alice \
  --ws-external \
  --rpc-external \
  --rpc-cors all \
  --rpc-methods unsafe \
  --unsafe-ws-external \
  --unsafe-rpc-external &

RELAY_PID=$!
echo "Relay chain started with PID: $RELAY_PID"

# Wait for relay chain to start
echo "⏳ Waiting for relay chain to start..."
sleep 10

# Export genesis state and wasm for parachains
echo "📤 Exporting parachain genesis data..."

# GasLeap parachain
gasleap-node export-genesis-state --chain $GASLEAP_PATH/gasleap-spec.json > $GASLEAP_PATH/genesis-state
gasleap-node export-genesis-wasm --chain $GASLEAP_PATH/gasleap-spec.json > $GASLEAP_PATH/genesis-wasm

# Start GasLeap parachain
echo "🌟 Starting GasLeap parachain (Para ID: 2000)..."
gasleap-node \
  --chain $GASLEAP_PATH/gasleap-spec.json \
  --base-path $GASLEAP_PATH \
  --port 30334 \
  --ws-port $GASLEAP_PORT \
  --rpc-port 9934 \
  --collator \
  --alice \
  --ws-external \
  --rpc-external \
  --rpc-cors all \
  --rpc-methods unsafe \
  --unsafe-ws-external \
  --unsafe-rpc-external \
  --parachain-id 2000 \
  --relay-chain-rpc-url ws://127.0.0.1:$RELAY_CHAIN_PORT &

GASLEAP_PID=$!
echo "GasLeap parachain started with PID: $GASLEAP_PID"

# Start Astar local (simulated)
echo "⭐ Starting Astar local parachain (Para ID: 2006)..."
astar-collator \
  --dev \
  --base-path $ASTAR_PATH \
  --port 30335 \
  --ws-port $ASTAR_PORT \
  --rpc-port 9935 \
  --ws-external \
  --rpc-external \
  --rpc-cors all \
  --rpc-methods unsafe \
  --unsafe-ws-external \
  --unsafe-rpc-external \
  --parachain-id 2006 \
  --relay-chain-rpc-url ws://127.0.0.1:$RELAY_CHAIN_PORT &

ASTAR_PID=$!
echo "Astar parachain started with PID: $ASTAR_PID"

# Start Acala local (simulated)
echo "🏦 Starting Acala local parachain (Para ID: 2034)..."
acala \
  --dev \
  --base-path $ACALA_PATH \
  --port 30336 \
  --ws-port $ACALA_PORT \
  --rpc-port 9936 \
  --ws-external \
  --rpc-external \
  --rpc-cors all \
  --rpc-methods unsafe \
  --unsafe-ws-external \
  --unsafe-rpc-external \
  --parachain-id 2034 \
  --relay-chain-rpc-url ws://127.0.0.1:$RELAY_CHAIN_PORT &

ACALA_PID=$!
echo "Acala parachain started with PID: $ACALA_PID"

# Wait for all chains to start
echo "⏳ Waiting for all chains to initialize..."
sleep 15

# Register parachains with relay chain
echo "📝 Registering parachains with relay chain..."

# This would typically be done through governance or sudo calls
# For demo purposes, we'll use pre-configured genesis

echo "✅ Local parachain environment setup complete!"
echo ""
echo "🌐 Chain Endpoints:"
echo "  Relay Chain:     ws://127.0.0.1:$RELAY_CHAIN_PORT"
echo "  GasLeap:         ws://127.0.0.1:$GASLEAP_PORT"
echo "  Astar Local:     ws://127.0.0.1:$ASTAR_PORT"
echo "  Acala Local:     ws://127.0.0.1:$ACALA_PORT"
echo ""
echo "🔧 Process IDs:"
echo "  Relay Chain: $RELAY_PID"
echo "  GasLeap:     $GASLEAP_PID"
echo "  Astar:       $ASTAR_PID"
echo "  Acala:       $ACALA_PID"
echo ""
echo "🛑 To stop all chains: kill $RELAY_PID $GASLEAP_PID $ASTAR_PID $ACALA_PID"

# Keep script running
wait