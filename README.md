# GasLeap - Cross-Chain Gas Sponsorship Protocol

GasLeap is a comprehensive cross-chain gas sponsorship protocol built on Substrate that enables seamless transaction sponsorship across Polkadot parachains. The system allows users to perform actions on multiple parachains without holding native gas tokens, with sponsorship handled transparently in the background.

## 🚀 Quick Start

### Demo Setup (For Judges)

```bash
# One-click demo setup with all tools
docker-compose -f demo-compose.yml up -d

# Access points:
# - Demo App: http://localhost:3000
# - Email Testing: http://localhost:8025
# - Database Admin: http://localhost:5050
# - Redis Browser: http://localhost:8081
# - Tracing UI: http://localhost:16686
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Emmanuel-Odero/GasLeap.git
cd gasleap

# Full development environment with all services
docker-compose up -d

# Or build locally
cargo build --release

# See DEVELOPMENT.md for detailed setup guide
```

## 🏗️ Architecture

GasLeap consists of three main components:

1. **Sponsorship Pallet** - Manages sponsorship pools and authorization
2. **XCM Gateway** - Handles cross-chain message dispatch and receipt processing  
3. **Developer SDK** - Provides simple API for dApp integration

## 📁 Project Structure

```
gasleap/
├── runtime/              # Substrate runtime with sponsorship pallet
├── node/                 # Parachain node implementation
├── pallets/
│   └── sponsorship/      # Core sponsorship pallet
├── sdk/                  # TypeScript SDK for dApp integration
├── frontend/             # React demo application
├── docker/               # Docker configurations
├── .kiro/specs/          # Feature specifications and tasks
└── docs/                 # Documentation
```

## 🎯 Demo Scenario

The demo showcases:

1. **NFT Minting on Astar** - Sponsored gas for NFT creation
2. **DeFi Liquidity on Acala** - Seamless cross-chain liquidity provision
3. **Live Gas Savings Counter** - Real-time tracking of saved fees
4. **One-Click Experience** - No wallet switching or gas token management

## 🛠️ Development

### Prerequisites

- Rust 1.70+
- Node.js 18+
- Docker & Docker Compose

### Building

```bash
# Build the parachain node
cargo build --release

# Build the SDK
cd sdk && npm run build

# Build the frontend
cd frontend && npm run build
```

### Testing

```bash
# Run pallet tests
cargo test -p pallet-sponsorship

# Run SDK tests
cd sdk && npm test

# Run frontend tests
cd frontend && npm test
```

## 🔧 Configuration

### Pool Configuration

```rust
pub struct PoolConfig {
    pub max_transaction_value: Balance,
    pub daily_spending_limit: Balance,
    pub allowed_chains: Vec<ParaId>,
    pub authorization_required: bool,
}
```

### SDK Integration

```typescript
import { GasLeapDemoSDK } from '@gasleap/sdk';

// Ultra-simple demo integration
const result = await GasLeapDemoSDK.quickSponsor(
  'astar',           // target chain
  nftMintCall,       // transaction call
  'demo-pool-1'      // pool ID
);
```

## 🛠️ Development Tools

The enhanced Docker setup includes essential development tools:

- **📧 MailHog**: Email testing interface at http://localhost:8025
- **🗄️ pgAdmin**: Database administration at http://localhost:5050
- **🔧 Redis Commander**: Redis browser at http://localhost:8081
- **📊 Jaeger**: Distributed tracing at http://localhost:16686
- **🧪 Mock Parachain**: Testing without external dependencies
- **🌐 Nginx Proxy**: Production-like routing and load balancing

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup and usage instructions.

## 📊 Features

- ✅ Cross-chain gas sponsorship
- ✅ Pool-based fund management
- ✅ Authorization and spending limits
- ✅ Real-time gas savings tracking
- ✅ XCM integration for Polkadot parachains
- ✅ Developer-friendly SDK
- ✅ React hooks for frontend integration
- ✅ Docker-based development environment

## 🎪 Demo Features

- **5-minute complete demo** - From setup to cross-chain transactions
- **Pre-funded pools** - Ready-to-use sponsorship pools
- **Animated UI** - Live gas savings counter with smooth animations
- **Backup systems** - Video recording and mock wallet fallbacks
- **One-click setup** - Docker compose for instant deployment

## 🔗 Supported Chains

- Astar (NFT minting demo)
- Acala (DeFi liquidity demo)
- Extensible to any Polkadot parachain

## 📈 Roadmap

- [ ] Mainnet deployment
- [ ] Additional parachain integrations
- [ ] Advanced authorization rules
- [ ] Gas price optimization
- [ ] Mobile SDK
- [ ] Governance integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 What We Think You Should Know

This project was built for with the following goals:

- **Problem**: Complex gas management across Polkadot parachains
- **Solution**: Seamless cross-chain gas sponsorship
- **Impact**: Improved user experience and dApp adoption
- **Demo**: 5-minute end-to-end cross-chain transaction flow

---

Built with ❤️ for the Polkadot ecosystem
