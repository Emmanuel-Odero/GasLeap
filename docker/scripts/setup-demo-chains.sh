#!/bin/bash

# Simplified Demo Chain Setup for Docker Environment
# This script sets up mock parachains for demo purposes

set -e

echo "🚀 Setting up GasLeap demo parachain environment..."

# Create demo data directories
mkdir -p /data/relay /data/gasleap /data/astar /data/acala

# Start mock relay chain (simplified for demo)
echo "🔗 Starting mock relay chain..."
cat > /data/relay/genesis.json << 'EOF'
{
  "name": "Demo Relay Chain",
  "id": "demo-relay",
  "parachains": [
    {"id": 2000, "name": "GasLeap"},
    {"id": 2006, "name": "Astar"},
    {"id": 2034, "name": "Acala"}
  ],
  "xcm_channels": [
    {"from": 2000, "to": 2006, "status": "open"},
    {"from": 2000, "to": 2034, "status": "open"},
    {"from": 2006, "to": 2000, "status": "open"},
    {"from": 2034, "to": 2000, "status": "open"}
  ]
}
EOF

# Create demo accounts file
echo "👥 Setting up demo accounts..."
cat > /data/demo-accounts.json << 'EOF'
{
  "accounts": [
    {
      "name": "Alice",
      "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "seed": "//Alice",
      "balances": {
        "gasleap": "1000000000000000",
        "astar": "1000000000000000000000",
        "acala": "1000000000000000"
      }
    },
    {
      "name": "Bob", 
      "address": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      "seed": "//Bob",
      "balances": {
        "gasleap": "1000000000000000",
        "astar": "1000000000000000000000", 
        "acala": "1000000000000000"
      }
    },
    {
      "name": "Charlie",
      "address": "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
      "seed": "//Charlie",
      "balances": {
        "gasleap": "1000000000000000",
        "astar": "1000000000000000000000",
        "acala": "1000000000000000"
      }
    },
    {
      "name": "Demo User",
      "address": "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy", 
      "seed": "//DemoUser",
      "balances": {
        "gasleap": "0",
        "astar": "0",
        "acala": "0"
      }
    }
  ]
}
EOF

# Create XCM channel configuration
echo "🌉 Setting up XCM channels..."
cat > /data/xcm-config.json << 'EOF'
{
  "channels": [
    {
      "sender": 2000,
      "recipient": 2006,
      "max_capacity": 1000,
      "max_message_size": 102400,
      "status": "open"
    },
    {
      "sender": 2006,
      "recipient": 2000, 
      "max_capacity": 1000,
      "max_message_size": 102400,
      "status": "open"
    },
    {
      "sender": 2000,
      "recipient": 2034,
      "max_capacity": 1000,
      "max_message_size": 102400,
      "status": "open"
    },
    {
      "sender": 2034,
      "recipient": 2000,
      "max_capacity": 1000,
      "max_message_size": 102400,
      "status": "open"
    }
  ]
}
EOF

echo "✅ Demo parachain environment configuration complete!"
echo ""
echo "📁 Configuration files created:"
echo "  - /data/relay/genesis.json"
echo "  - /data/demo-accounts.json"
echo "  - /data/xcm-config.json"
echo ""
echo "🌐 Demo endpoints will be available at:"
echo "  - GasLeap:  ws://localhost:9944"
echo "  - Astar:    ws://localhost:9945"
echo "  - Acala:    ws://localhost:9946"