#!/bin/bash

# GasLeap Demo Setup Script
# One-click setup for hackathon judges

set -e

echo "🚀 GasLeap Cross-Chain Gas Sponsorship Demo Setup"
echo "=================================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker environment verified"
echo ""

# Clean up any previous runs
echo "🧹 Cleaning up previous demo runs..."
docker-compose -f demo-compose.yml down -v --remove-orphans 2>/dev/null || true
docker system prune -f --volumes 2>/dev/null || true

echo "✅ Cleanup complete"
echo ""

# Build and start the demo environment
echo "🏗️  Building GasLeap demo environment..."
echo "   This may take a few minutes on first run..."
echo ""

# Start the demo with progress output
docker-compose -f demo-compose.yml up -d --build

echo ""
echo "⏳ Waiting for services to start..."

# Wait for services to be healthy
MAX_WAIT=300  # 5 minutes
WAIT_TIME=0
INTERVAL=10

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if docker-compose -f demo-compose.yml ps | grep -q "Up (healthy)"; then
        echo "✅ Services are starting up..."
        break
    fi
    
    echo "   Still waiting... ($WAIT_TIME/${MAX_WAIT}s)"
    sleep $INTERVAL
    WAIT_TIME=$((WAIT_TIME + INTERVAL))
done

# Additional wait for demo seeding to complete
echo "🌱 Seeding demo data..."
sleep 30

# Check if frontend is accessible
echo "🔍 Verifying demo accessibility..."
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend may still be starting up"
fi

echo ""
echo "🎉 GasLeap Demo Setup Complete!"
echo "================================"
echo ""
echo "🌐 Demo Access Points:"
echo "   Frontend:        http://localhost:3000"
echo "   GasLeap Node:    ws://localhost:9944"
echo "   Astar Local:     ws://localhost:9945"
echo "   Acala Local:     ws://localhost:9946"
echo ""
echo "🎯 Demo Scenario (5 minutes):"
echo "   1. Visit http://localhost:3000"
echo "   2. Connect wallet (demo account pre-loaded)"
echo "   3. Mint NFT on Astar (sponsored gas)"
echo "   4. Provide liquidity on Acala (sponsored gas)"
echo "   5. Watch gas savings counter update live"
echo ""
echo "📊 Monitoring:"
echo "   API Server:      http://localhost:3003"
echo "   Database Admin:  http://localhost:5050"
echo "   Redis Admin:     http://localhost:8081"
echo "   Email Testing:   http://localhost:8025"
echo ""
echo "🛑 To stop the demo:"
echo "   docker-compose -f demo-compose.yml down"
echo ""
echo "🔧 To view logs:"
echo "   docker-compose -f demo-compose.yml logs -f"
echo ""
echo "📋 Demo Status:"
docker-compose -f demo-compose.yml ps

echo ""
echo "🚀 Ready for demo! Visit http://localhost:3000 to begin."