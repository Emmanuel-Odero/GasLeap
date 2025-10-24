#!/bin/bash

# GasLeap Demo Reset Script
# Resets the demo environment for multiple runs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🔄 GasLeap Demo Reset"
echo "===================="

# Stop any running processes
print_status "Stopping running processes..."

# Stop GasLeap node
pkill -f gasleap-node || true
print_status "GasLeap node stopped"

# Stop frontend
pkill -f "npm.*start" || true
pkill -f "react-scripts" || true
print_status "Frontend stopped"

# Stop backend API
pkill -f "node.*server.js" || true
print_status "Backend API stopped"

# Stop any recording processes
pkill -f ffmpeg || true
pkill -f "google-chrome.*localhost:3000" || true
pkill -f "chromium.*localhost:3000" || true
print_status "Recording processes stopped"

# Clean up temporary files
print_status "Cleaning up temporary files..."

# Remove Substrate temporary data
rm -rf /tmp/substrate* 2>/dev/null || true
rm -rf ~/.local/share/gasleap-node 2>/dev/null || true
print_status "Substrate temporary data cleared"

# Reset demo data
if [ -d "demo-data" ]; then
    print_status "Resetting demo data..."
    
    # Backup current demo data if it exists
    if [ -f "demo-data/demo-state.json" ]; then
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        mkdir -p "demo-data/backups"
        cp "demo-data/demo-state.json" "demo-data/backups/demo-state-${TIMESTAMP}.json"
        print_status "Demo state backed up to demo-data/backups/"
    fi
    
    # Reset gas savings
    echo '{"totalSavings": 0, "transactionCount": 0, "lastReset": "'$(date -Iseconds)'"}' > demo-data/gas-savings.json
    
    # Reset transaction history
    echo '[]' > demo-data/transaction-history.json
    
    # Reset demo state
    cat > demo-data/demo-state.json << EOF
{
  "totalGasSaved": 0,
  "transactionCount": 0,
  "currentStep": 0,
  "startTime": $(date +%s)000,
  "lastReset": "$(date -Iseconds)",
  "steps": [
    { "name": "Demo Introduction", "duration": 30, "completed": false },
    { "name": "NFT Minting on Astar", "duration": 60, "completed": false },
    { "name": "Gas Savings Display", "duration": 15, "completed": false },
    { "name": "DeFi Liquidity on Acala", "duration": 60, "completed": false },
    { "name": "Final Gas Savings", "duration": 30, "completed": false },
    { "name": "Demo Conclusion", "duration": 15, "completed": false }
  ]
}
EOF
    
    print_success "Demo data reset"
else
    print_status "Creating fresh demo data directory..."
    mkdir -p demo-data
    
    # Create initial demo data
    echo '{"totalSavings": 0, "transactionCount": 0, "lastReset": "'$(date -Iseconds)'"}' > demo-data/gas-savings.json
    echo '[]' > demo-data/transaction-history.json
    
    cat > demo-data/demo-state.json << EOF
{
  "totalGasSaved": 0,
  "transactionCount": 0,
  "currentStep": 0,
  "startTime": $(date +%s)000,
  "lastReset": "$(date -Iseconds)",
  "steps": [
    { "name": "Demo Introduction", "duration": 30, "completed": false },
    { "name": "NFT Minting on Astar", "duration": 60, "completed": false },
    { "name": "Gas Savings Display", "duration": 15, "completed": false },
    { "name": "DeFi Liquidity on Acala", "duration": 60, "completed": false },
    { "name": "Final Gas Savings", "duration": 30, "completed": false },
    { "name": "Demo Conclusion", "duration": 15, "completed": false }
  ]
}
EOF
    
    print_success "Fresh demo data created"
fi

# Clear browser cache and storage
print_status "Clearing browser cache..."

# Chrome/Chromium cache locations
CHROME_CACHE_DIRS=(
    "$HOME/.cache/google-chrome"
    "$HOME/.cache/chromium"
    "$HOME/Library/Caches/Google/Chrome"
    "$HOME/Library/Caches/Chromium"
)

for cache_dir in "${CHROME_CACHE_DIRS[@]}"; do
    if [ -d "$cache_dir" ]; then
        rm -rf "$cache_dir/Default/Local Storage/leveldb/localhost_3000*" 2>/dev/null || true
        rm -rf "$cache_dir/Default/Session Storage/localhost_3000*" 2>/dev/null || true
        print_status "Cleared cache: $cache_dir"
    fi
done

# Clear any Redis cache if running
if command -v redis-cli &> /dev/null; then
    redis-cli flushall 2>/dev/null || true
    print_status "Redis cache cleared"
fi

# Reset frontend build cache
if [ -d "frontend/node_modules/.cache" ]; then
    rm -rf frontend/node_modules/.cache
    print_status "Frontend build cache cleared"
fi

# Reset SDK build cache
if [ -d "sdk/node_modules/.cache" ]; then
    rm -rf sdk/node_modules/.cache
    print_status "SDK build cache cleared"
fi

# Clean up any lock files
rm -f frontend/package-lock.json.lock 2>/dev/null || true
rm -f sdk/package-lock.json.lock 2>/dev/null || true
rm -f backend/api/package-lock.json.lock 2>/dev/null || true

# Reset environment variables
print_status "Resetting environment variables..."

# Create fresh .env.demo file
cat > .env.demo << EOF
# GasLeap Demo Environment Configuration - Reset $(date -Iseconds)
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

# Demo reset info
DEMO_RESET_TIME=$(date -Iseconds)
DEMO_RESET_COUNT=$((${DEMO_RESET_COUNT:-0} + 1))
EOF

print_success "Environment configuration reset"

# Verify demo components are ready
print_status "Verifying demo components..."

# Check if node binary exists
if [ -f "target/release/gasleap-node" ]; then
    print_success "GasLeap node binary ready"
else
    print_warning "GasLeap node binary not found - run 'cargo build --release' first"
fi

# Check if frontend is built
if [ -d "frontend/build" ] || [ -d "frontend/dist" ]; then
    print_success "Frontend build ready"
else
    print_warning "Frontend not built - run 'cd frontend && npm run build' first"
fi

# Check if SDK is built
if [ -d "sdk/dist" ]; then
    print_success "SDK build ready"
else
    print_warning "SDK not built - run 'cd sdk && npm run build' first"
fi

# Create quick start script for post-reset
cat > quick-start-demo.sh << 'EOF'
#!/bin/bash

# Quick start script after demo reset
echo "🚀 Quick Starting GasLeap Demo..."

# Load demo environment
source .env.demo

# Start all services in background
echo "Starting GasLeap node..."
./target/release/gasleap-node --dev --tmp --alice --ws-port 9944 --rpc-port 9933 --rpc-cors all &
GASLEAP_PID=$!

echo "Waiting for node to initialize..."
sleep 10

echo "Starting frontend..."
cd frontend && npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Demo services started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Node: ws://localhost:9944"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo "🛑 Stopping demo services..."
    kill $GASLEAP_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Demo services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM
wait
EOF

chmod +x quick-start-demo.sh

print_success "Quick start script created"

# Final summary
echo ""
print_success "🎉 Demo reset complete!"
echo ""
print_status "What was reset:"
print_status "  ✓ All running processes stopped"
print_status "  ✓ Temporary blockchain data cleared"
print_status "  ✓ Demo state and gas savings reset to zero"
print_status "  ✓ Browser cache cleared"
print_status "  ✓ Environment configuration refreshed"
echo ""
print_status "Next steps:"
print_status "  1. Run './quick-start-demo.sh' for immediate demo start"
print_status "  2. Or run './start-demo.sh' for full setup"
print_status "  3. Open http://localhost:3000 when ready"
echo ""
print_status "Demo is now ready for a fresh run! 🚀"
echo ""
print_status "📖 Additional Resources:"
print_status "  • DEMO_SCRIPT.md - Complete 5-minute presentation guide"
print_status "  • JUDGE_SETUP.md - Quick setup guide for judges"
print_status "  • TROUBLESHOOTING.md - Comprehensive problem-solving guide"
echo ""
print_status "🆘 If issues occur during demo:"
print_status "  • Run this script again to reset state"
print_status "  • Check TROUBLESHOOTING.md for specific solutions"
print_status "  • Use backup video in demo-recordings/ if needed"