#!/bin/bash

# GasLeap Demo Integration Setup Script
# This script sets up the complete end-to-end demo environment

set -e

echo "🚀 Setting up GasLeap Demo Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ] || [ ! -d "pallets/sponsorship" ]; then
    print_error "Please run this script from the GasLeap project root directory"
    exit 1
fi

print_status "Building GasLeap node..."
cargo build --release --bin gasleap-node

if [ $? -ne 0 ]; then
    print_error "Failed to build GasLeap node"
    exit 1
fi

print_success "GasLeap node built successfully"

# Build the SDK
print_status "Building GasLeap SDK..."
cd sdk
npm install
npm run build

if [ $? -ne 0 ]; then
    print_error "Failed to build SDK"
    exit 1
fi

print_success "SDK built successfully"
cd ..

# Build the frontend
print_status "Building frontend..."
cd frontend
npm install
npm run build

if [ $? -ne 0 ]; then
    print_error "Failed to build frontend"
    exit 1
fi

print_success "Frontend built successfully"
cd ..

# Create demo data directory
print_status "Setting up demo data..."
mkdir -p demo-data/chains
mkdir -p demo-data/accounts

# Create demo accounts file
cat > demo-data/accounts/demo-accounts.json << EOF
{
  "demo_accounts": [
    {
      "name": "Alice",
      "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "seed": "//Alice",
      "balance": "1000000000000000000000"
    },
    {
      "name": "Bob", 
      "address": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      "seed": "//Bob",
      "balance": "1000000000000000000000"
    },
    {
      "name": "Demo User",
      "address": "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
      "seed": "//DemoUser",
      "balance": "100000000000000000000"
    }
  ],
  "demo_pools": [
    {
      "id": "demo-pool-1",
      "owner": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "balance": "10000000000000000000",
      "allowed_chains": [2007, 2000],
      "description": "Demo pool for NFT minting and DeFi operations"
    }
  ]
}
EOF

print_success "Demo data created"

# Create environment configuration
print_status "Creating environment configuration..."

cat > .env.demo << EOF
# GasLeap Demo Environment Configuration
GASLEAP_NODE_ENDPOINT=ws://localhost:9944
GASLEAP_NODE_HTTP=http://localhost:9933
DEMO_MODE=true
PRE_FUNDED_POOLS=true
SKIP_WALLET_CHECKS=true

# Frontend configuration
REACT_APP_GASLEAP_ENDPOINT=ws://localhost:9944
REACT_APP_DEMO_MODE=true
REACT_APP_SKIP_ONBOARDING=true

# Backend API configuration
API_PORT=3003
DATABASE_URL=sqlite:./demo-data/gasleap-demo.db
REDIS_URL=redis://localhost:6379

# Chain configurations
ASTAR_PARACHAIN_ID=2007
ACALA_PARACHAIN_ID=2000
RELAY_CHAIN_ENDPOINT=ws://localhost:9944
EOF

print_success "Environment configuration created"

# Create demo startup script
print_status "Creating demo startup script..."

cat > start-demo.sh << 'EOF'
#!/bin/bash

# GasLeap Demo Startup Script
echo "🚀 Starting GasLeap Demo Environment..."

# Load demo environment
source .env.demo

# Start the GasLeap node in development mode
echo "Starting GasLeap node..."
./target/release/gasleap-node \
  --dev \
  --ws-port 9944 \
  --rpc-port 9933 \
  --rpc-cors all \
  --rpc-methods unsafe \
  --tmp \
  --alice &

GASLEAP_PID=$!

# Wait for node to start
echo "Waiting for node to start..."
sleep 10

# Start the backend API
echo "Starting backend API..."
cd backend/api
npm start &
API_PID=$!
cd ../..

# Start the frontend
echo "Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Demo environment started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Node RPC: ws://localhost:9944"
echo "🌐 API: http://localhost:3003"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping demo environment..."
    kill $GASLEAP_PID 2>/dev/null || true
    kill $API_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Demo environment stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait
EOF

chmod +x start-demo.sh

print_success "Demo startup script created"

# Create quick test script
print_status "Creating integration test script..."

cat > test-integration.sh << 'EOF'
#!/bin/bash

# GasLeap Integration Test Script
echo "🧪 Testing GasLeap Integration..."

# Test node connection
echo "Testing node connection..."
curl -H "Content-Type: application/json" \
     -d '{"id":1, "jsonrpc":"2.0", "method": "system_health", "params":[]}' \
     http://localhost:9933 > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Node connection: OK"
else
    echo "❌ Node connection: FAILED"
    exit 1
fi

# Test API connection
echo "Testing API connection..."
curl http://localhost:3003/health > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ API connection: OK"
else
    echo "❌ API connection: FAILED"
    exit 1
fi

# Test frontend
echo "Testing frontend..."
curl http://localhost:3000 > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: FAILED"
    exit 1
fi

echo "🎉 All integration tests passed!"
EOF

chmod +x test-integration.sh

print_success "Integration test script created"

# Create demo reset script
print_status "Creating demo reset script..."

cat > reset-demo.sh << 'EOF'
#!/bin/bash

# GasLeap Demo Reset Script
echo "🔄 Resetting GasLeap Demo..."

# Stop any running processes
pkill -f gasleap-node || true
pkill -f "npm start" || true

# Clean up temporary data
rm -rf /tmp/substrate* 2>/dev/null || true
rm -rf demo-data/gasleap-demo.db* 2>/dev/null || true

# Reset gas savings counter
echo '{"totalSavings": 0, "transactionCount": 0}' > demo-data/gas-savings.json

echo "✅ Demo reset complete"
echo "Run ./start-demo.sh to start fresh demo"
EOF

chmod +x reset-demo.sh

print_success "Demo reset script created"

# Final setup
print_status "Finalizing setup..."

# Create demo data files
echo '{"totalSavings": 0, "transactionCount": 0}' > demo-data/gas-savings.json
echo '[]' > demo-data/transaction-history.json

print_success "Setup complete!"

echo ""
echo "🎉 GasLeap Demo Integration Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Run './start-demo.sh' to start the demo environment"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Follow the demo flow: NFT Mint → DeFi Liquidity"
echo "4. Use './test-integration.sh' to verify everything is working"
echo "5. Use './reset-demo.sh' to reset between demo runs"
echo ""
echo "For judges: The complete demo runs in under 5 minutes!"