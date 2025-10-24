# GasLeap Demo Setup Guide

**🎯 For Hackathon Judges: Complete setup in under 2 minutes!**

This guide provides step-by-step instructions for setting up and running the GasLeap cross-chain gas sponsorship demo. The demo showcases seamless NFT minting on Astar and DeFi liquidity provision on Acala without requiring gas tokens.

## 🚀 Quick Start (For Judges)

### Prerequisites Check (30 seconds)
Before starting, ensure you have:
- **Docker** installed and running ([Get Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** available ([Install Guide](https://docs.docker.com/compose/install/))
- **8GB RAM** available for containers
- **Ports 3000, 9944-9946** available

Quick check:
```bash
docker --version && docker-compose --version
docker info | grep "Server Version"  # Should show Docker is running
```

### One-Click Demo Setup (90 seconds)

```bash
# Clone the repository
git clone https://github.com/gasleap/gasleap.git
cd gasleap

# Run the one-click demo setup (builds and starts everything)
./demo-setup.sh
```

**Expected output:** ✅ Demo services started, Frontend accessible at http://localhost:3000

### Verify Demo is Ready (30 seconds)
Open your browser to: **http://localhost:3000**

You should see:
- ✅ GasLeap logo and "Cross-Chain Gas Sponsorship" title
- ✅ Gas savings counter showing "$0.00"
- ✅ "Mint NFT" button (enabled)
- ✅ Wallet connection status (demo account pre-loaded)

### Demo Scenario (5 minutes)

1. **Visit the Frontend** - Navigate to http://localhost:3000
2. **Connect Wallet** - Demo account is pre-loaded with test funds
3. **Mint NFT on Astar** - Click "Mint NFT" (gas sponsored automatically)
4. **Provide Liquidity on Acala** - Click "Add Liquidity" (gas sponsored)
5. **Watch Gas Savings** - Live counter shows cumulative savings

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   GasLeap       │    │   Target        │
│   (React)       │◄──►│   Parachain     │◄──►│   Parachains    │
│   Port: 3000    │    │   Port: 9944    │    │   Astar: 9945   │
└─────────────────┘    └─────────────────┘    │   Acala: 9946   │
                                              └─────────────────┘
```

## Services and Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React demo application |
| GasLeap Node | 9944 | Main parachain WebSocket |
| GasLeap HTTP | 9933 | Main parachain HTTP RPC |
| Astar Local | 9945 | Astar parachain WebSocket |
| Acala Local | 9946 | Acala parachain WebSocket |
| API Server | 3003 | Backend API service |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| pgAdmin | 5050 | Database admin UI |
| MailHog | 8025 | Email testing UI |

## Demo Data

### Pre-funded Accounts

- **Alice** (Pool Owner): `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
- **Bob** (Pool Owner): `5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty`
- **Demo User**: `5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy`

### Sponsorship Pools

1. **NFT Minting Pool** (ID: 1)
   - Owner: Alice
   - Balance: 100 GLAP
   - Target: Astar (Para ID: 2006)
   - Purpose: Sponsors NFT minting transactions

2. **DeFi Liquidity Pool** (ID: 2)
   - Owner: Bob
   - Balance: 200 GLAP
   - Target: Acala (Para ID: 2034)
   - Purpose: Sponsors DeFi operations

3. **Universal Pool** (ID: 3)
   - Owner: Charlie
   - Balance: 500 GLAP
   - Target: Both Astar and Acala
   - Purpose: Sponsors any transaction type

## Development Setup

### Full Development Environment

```bash
# Start full development environment with relay chain
make dev

# Or manually:
docker-compose -f docker-compose.dev.yml up -d
```

### Local Parachain Setup

```bash
# Set up local relay chain and parachains
make setup-chains

# Seed demo data
make seed-data
```

## 🛠️ Troubleshooting Guide

### ⚡ Quick Fixes (Most Common Issues)

#### 1. Port Conflicts (30 seconds to fix)
**Symptom:** "Port already in use" error during setup

**Solution:**
```bash
# Stop any conflicting services
docker-compose -f demo-compose.yml down
sudo lsof -ti:3000,9944,9945,9946 | xargs kill -9 2>/dev/null || true

# Restart demo
./demo-setup.sh
```

#### 2. Services Not Starting (60 seconds to fix)
**Symptom:** Demo setup completes but http://localhost:3000 shows error

**Solution:**
```bash
# Check service status
docker-compose -f demo-compose.yml ps

# Restart failed services
docker-compose -f demo-compose.yml restart

# If still failing, full reset:
./scripts/reset-demo-state.sh && ./demo-setup.sh
```

#### 3. Demo Appears Frozen (15 seconds to fix)
**Symptom:** Buttons don't respond or transactions don't complete

**Solution:**
```bash
# Reset demo state only (keeps services running)
./scripts/reset-demo-state.sh

# Refresh browser page
```

### 🔍 Health Checks

**Quick Status Check:**
```bash
# All services should show "Up" or "Up (healthy)"
docker-compose -f demo-compose.yml ps
```

**Detailed Health Check:**
```bash
# Frontend (should return HTML)
curl -s http://localhost:3000 | head -5

# GasLeap node (should return JSON)
curl -s http://localhost:9933/health

# All services summary
make health 2>/dev/null || echo "Use docker-compose commands if make unavailable"
```

### 🚨 Emergency Procedures

#### Complete Demo Reset (2 minutes)
If everything is broken:
```bash
# Nuclear option - reset everything
docker-compose -f demo-compose.yml down -v
docker system prune -f
./demo-setup.sh
```

#### Backup Demo (if setup fails)
If Docker setup fails completely:
```bash
# Use pre-recorded demo video
ls demo-recordings/gasleap-demo-*.mp4
# Play the most recent recording
```

#### Manual Service Start (advanced)
If automated setup fails:
```bash
# Start services individually
docker-compose -f demo-compose.yml up gasleap-node -d
sleep 30
docker-compose -f demo-compose.yml up frontend -d
```

## Manual Commands

### Docker Compose Commands

```bash
# Start demo
docker-compose -f demo-compose.yml up -d

# Stop demo
docker-compose -f demo-compose.yml down

# View logs
docker-compose -f demo-compose.yml logs -f

# Check status
docker-compose -f demo-compose.yml ps
```

### Makefile Commands

```bash
make help          # Show all available commands
make demo          # Start demo environment
make dev           # Start development environment
make setup-chains  # Set up local parachains
make seed-data     # Seed demo data
make health        # Check service health
make clean         # Clean up everything
```

## Demo Script (5 minutes)

### Minute 0-1: Problem Introduction
- Show traditional cross-chain transaction complexity
- Highlight gas token management friction
- Demonstrate failed transaction due to missing gas tokens

### Minute 1-3: GasLeap Solution
- Connect to demo application
- Mint NFT on Astar with sponsored gas
- Show seamless user experience (no gas token needed)
- Display transaction success and gas savings

### Minute 3-4: Cross-Chain Magic
- Provide liquidity on Acala using same user account
- No re-authorization or additional setup required
- Show live gas savings counter updating

### Minute 4-5: Impact & Vision
- Display total gas savings achieved
- Show user growth potential metrics
- Present future roadmap and ecosystem benefits

## Technical Details

### XCM Integration
- Pre-configured HRMP channels between parachains
- Mock XCM message handling for demo reliability
- Fallback to simulated responses if needed

### Sponsorship Logic
- Pool-based gas sponsorship system
- Authorization rules and spending limits
- Real-time balance tracking and updates

### Demo Optimizations
- Pre-seeded data for immediate functionality
- Health checks and startup dependencies
- Automated retry logic for reliability

## Support

For issues or questions:
1. Check the logs: `docker-compose -f demo-compose.yml logs -f`
2. Reset the demo: `make reset-demo`
3. Contact the team with specific error messages

## Next Steps

After the demo:
1. Explore the code in `pallets/sponsorship/`
2. Check out the SDK in `sdk/src/`
3. Review the frontend implementation in `frontend/src/`
4. Read the technical documentation in `docs/`