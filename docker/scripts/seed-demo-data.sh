#!/bin/bash

# Demo Data Seeding Script for GasLeap
# This script pre-funds accounts and sets up sponsorship pools for demo scenarios

set -e

echo "🌱 Seeding demo data for GasLeap..."

# Configuration
GASLEAP_ENDPOINT="ws://localhost:9944"
ASTAR_ENDPOINT="ws://localhost:9945"
ACALA_ENDPOINT="ws://localhost:9946"

# Demo accounts (using well-known test accounts)
ALICE="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
BOB="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
CHARLIE="5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"
DEMO_USER="5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"
DEMO_DAPP="5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw"

# Wait for chains to be ready
echo "⏳ Waiting for chains to be ready..."
sleep 5

# Create demo sponsorship pools
echo "💰 Creating demo sponsorship pools..."

# Pool 1: NFT Minting Pool (for Astar)
cat > /tmp/create-nft-pool.json << EOF
{
  "pool_id": 1,
  "owner": "$ALICE",
  "initial_deposit": "100000000000000",
  "config": {
    "max_transaction_value": "10000000000000",
    "daily_spending_limit": "50000000000000", 
    "allowed_chains": [2006],
    "authorization_required": false,
    "allowed_calls": ["Assets.mint", "Uniques.mint"]
  },
  "name": "NFT Minting Sponsorship Pool",
  "description": "Sponsors NFT minting transactions on Astar"
}
EOF

# Pool 2: DeFi Liquidity Pool (for Acala)
cat > /tmp/create-defi-pool.json << EOF
{
  "pool_id": 2,
  "owner": "$BOB",
  "initial_deposit": "200000000000000",
  "config": {
    "max_transaction_value": "50000000000000",
    "daily_spending_limit": "100000000000000",
    "allowed_chains": [2034],
    "authorization_required": false,
    "allowed_calls": ["Dex.addLiquidity", "Dex.swapWithExactSupply"]
  },
  "name": "DeFi Liquidity Sponsorship Pool", 
  "description": "Sponsors DeFi operations on Acala"
}
EOF

# Pool 3: Universal Pool (for both chains)
cat > /tmp/create-universal-pool.json << EOF
{
  "pool_id": 3,
  "owner": "$CHARLIE",
  "initial_deposit": "500000000000000",
  "config": {
    "max_transaction_value": "25000000000000",
    "daily_spending_limit": "200000000000000",
    "allowed_chains": [2006, 2034],
    "authorization_required": false,
    "allowed_calls": ["*"]
  },
  "name": "Universal Sponsorship Pool",
  "description": "Sponsors transactions on both Astar and Acala"
}
EOF

# Create authorization rules for demo scenarios
echo "🔐 Setting up authorization rules..."

# Allow demo user to use all pools
cat > /tmp/demo-authorizations.json << EOF
{
  "authorizations": [
    {
      "pool_id": 1,
      "user": "$DEMO_USER",
      "spending_limit": "10000000000000",
      "allowed_calls": ["Assets.mint", "Uniques.mint"],
      "expires_at": null
    },
    {
      "pool_id": 2,
      "user": "$DEMO_USER", 
      "spending_limit": "50000000000000",
      "allowed_calls": ["Dex.addLiquidity", "Dex.swapWithExactSupply"],
      "expires_at": null
    },
    {
      "pool_id": 3,
      "user": "$DEMO_USER",
      "spending_limit": "25000000000000", 
      "allowed_calls": ["*"],
      "expires_at": null
    }
  ]
}
EOF

# Create demo NFT metadata for Astar
echo "🎨 Setting up demo NFT metadata..."
cat > /tmp/demo-nft-metadata.json << EOF
{
  "nfts": [
    {
      "collection_id": 0,
      "item_id": 1,
      "name": "GasLeap Demo NFT #1",
      "description": "A commemorative NFT minted using sponsored gas on Astar",
      "image": "https://gasleap.dev/demo-nft-1.png",
      "attributes": [
        {"trait_type": "Sponsored", "value": "Yes"},
        {"trait_type": "Chain", "value": "Astar"},
        {"trait_type": "Demo", "value": "Hackathon"}
      ]
    },
    {
      "collection_id": 0,
      "item_id": 2,
      "name": "GasLeap Demo NFT #2", 
      "description": "Another sponsored NFT showcasing cross-chain gas sponsorship",
      "image": "https://gasleap.dev/demo-nft-2.png",
      "attributes": [
        {"trait_type": "Sponsored", "value": "Yes"},
        {"trait_type": "Chain", "value": "Astar"},
        {"trait_type": "Demo", "value": "Hackathon"}
      ]
    }
  ]
}
EOF

# Create demo DeFi pool data for Acala
echo "🏦 Setting up demo DeFi pools..."
cat > /tmp/demo-defi-pools.json << EOF
{
  "liquidity_pools": [
    {
      "pool_id": 1,
      "token_a": "ACA",
      "token_b": "AUSD", 
      "reserve_a": "1000000000000000",
      "reserve_b": "1000000000000000",
      "total_supply": "1000000000000000",
      "fee": 30
    },
    {
      "pool_id": 2,
      "token_a": "ACA",
      "token_b": "DOT",
      "reserve_a": "500000000000000",
      "reserve_b": "500000000000000", 
      "total_supply": "500000000000000",
      "fee": 30
    }
  ]
}
EOF

# Create demo transaction history
echo "📊 Creating demo transaction history..."
cat > /tmp/demo-transaction-history.json << EOF
{
  "transactions": [
    {
      "id": "0x1234567890abcdef",
      "user": "$DEMO_USER",
      "pool_id": 1,
      "target_chain": 2006,
      "call": "Assets.mint",
      "gas_cost": "5000000000000",
      "status": "completed",
      "timestamp": $(date -d '1 hour ago' +%s),
      "gas_saved": "5000000000000"
    },
    {
      "id": "0xabcdef1234567890",
      "user": "$DEMO_USER",
      "pool_id": 2,
      "target_chain": 2034,
      "call": "Dex.addLiquidity", 
      "gas_cost": "15000000000000",
      "status": "completed",
      "timestamp": $(date -d '30 minutes ago' +%s),
      "gas_saved": "15000000000000"
    }
  ],
  "total_gas_saved": "20000000000000",
  "total_transactions": 2
}
EOF

# Create demo user preferences
echo "⚙️ Setting up demo user preferences..."
cat > /tmp/demo-user-preferences.json << EOF
{
  "users": [
    {
      "address": "$DEMO_USER",
      "preferences": {
        "default_pool": 3,
        "auto_approve_small_transactions": true,
        "max_auto_approve_amount": "1000000000000",
        "preferred_chains": [2006, 2034],
        "notifications": {
          "transaction_complete": true,
          "low_pool_balance": true,
          "authorization_required": true
        }
      }
    }
  ]
}
EOF

# Create demo metrics for the dashboard
echo "📈 Setting up demo metrics..."
cat > /tmp/demo-metrics.json << EOF
{
  "metrics": {
    "total_pools": 3,
    "total_sponsored_transactions": 2,
    "total_gas_saved": "20000000000000",
    "total_value_locked": "800000000000000",
    "active_users": 1,
    "supported_chains": 2,
    "average_gas_savings": "10000000000000",
    "pools_by_chain": {
      "2006": 2,
      "2034": 2
    },
    "transactions_by_chain": {
      "2006": 1,
      "2034": 1
    }
  }
}
EOF

# Copy all demo data to the data directory
echo "📁 Copying demo data to persistent storage..."
mkdir -p /data/demo
cp /tmp/create-*.json /data/demo/
cp /tmp/demo-*.json /data/demo/

# Create a summary file
cat > /data/demo/README.md << 'EOF'
# GasLeap Demo Data

This directory contains pre-seeded demo data for the GasLeap hackathon demonstration.

## Demo Accounts

- **Alice** (Pool Owner): `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
- **Bob** (Pool Owner): `5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty`
- **Charlie** (Pool Owner): `5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y`
- **Demo User**: `5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy`

## Sponsorship Pools

1. **NFT Minting Pool** (ID: 1) - Sponsors NFT minting on Astar
2. **DeFi Liquidity Pool** (ID: 2) - Sponsors DeFi operations on Acala  
3. **Universal Pool** (ID: 3) - Sponsors transactions on both chains

## Demo Scenario

1. User mints NFT on Astar using Pool 1 (sponsored gas)
2. User provides liquidity on Acala using Pool 2 (sponsored gas)
3. Gas savings counter shows cumulative savings

## Files

- `create-*-pool.json` - Pool creation data
- `demo-authorizations.json` - User authorization rules
- `demo-nft-metadata.json` - NFT metadata for Astar
- `demo-defi-pools.json` - DeFi pool data for Acala
- `demo-transaction-history.json` - Pre-existing transaction history
- `demo-user-preferences.json` - User preference settings
- `demo-metrics.json` - Dashboard metrics
EOF

echo "✅ Demo data seeding complete!"
echo ""
echo "📊 Demo Data Summary:"
echo "  - 3 sponsorship pools created"
echo "  - 1 demo user authorized for all pools"
echo "  - 2 demo NFTs configured for Astar"
echo "  - 2 DeFi pools configured for Acala"
echo "  - Transaction history with $20 in gas savings"
echo "  - User preferences and metrics configured"
echo ""
echo "🎯 Ready for demo scenarios:"
echo "  1. NFT minting on Astar (sponsored)"
echo "  2. Liquidity provision on Acala (sponsored)"
echo "  3. Live gas savings counter updates"