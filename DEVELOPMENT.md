# GasLeap Development Guide

## 🚀 Quick Start

### One-Click Demo Setup
```bash
# For hackathon judges - complete demo in one command
docker-compose -f demo-compose.yml up -d

# Access points:
# - Frontend: http://localhost:3000
# - MailHog: http://localhost:8025
# - pgAdmin: http://localhost:5050 (admin@gasleap.dev / admin123)
# - Redis Commander: http://localhost:8081
# - Jaeger Tracing: http://localhost:16686
```

### Full Development Environment
```bash
# Complete development setup with all services
docker-compose up -d

# Or start specific services
docker-compose up gasleap-node frontend api-server postgres-db redis-cache
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Backend   │    │  GasLeap Node   │
│   (React)       │◄──►│   (Express)     │◄──►│  (Substrate)    │
│   Port: 3000    │    │   Port: 3003    │    │   Port: 9944    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         └──────────────►│   Port: 5432    │◄─────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Redis       │
                        │   Port: 6379    │
                        └─────────────────┘
```

## 🛠️ Development Services

### Core Services
- **GasLeap Node** (9944): Substrate parachain with sponsorship pallet
- **Frontend** (3000): React demo application
- **API Backend** (3003): Express.js API for transaction history and analytics
- **PostgreSQL** (5432): Transaction history and user data
- **Redis** (6379): Caching and session management

### Development Tools
- **MailHog** (8025): Email testing interface
- **pgAdmin** (5050): Database administration
- **Redis Commander** (8081): Redis data browser
- **Jaeger** (16686): Distributed tracing
- **Mock Parachain** (9948): Testing without external dependencies

### Demo Parachains
- **Astar Local** (9945): For NFT minting demo
- **Acala Local** (9946): For DeFi liquidity demo

## 📊 Service Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| API Backend | http://localhost:3003 | - |
| GasLeap Node RPC | ws://localhost:9944 | - |
| MailHog UI | http://localhost:8025 | - |
| pgAdmin | http://localhost:5050 | admin@gasleap.dev / admin123 |
| Redis Commander | http://localhost:8081 | - |
| Jaeger UI | http://localhost:16686 | - |
| PostgreSQL | localhost:5432 | gasleap / gasleap123 |
| Redis | localhost:6379 | - |

## 🔧 Development Workflows

### Frontend Development
```bash
# Start frontend with hot reload
cd frontend
npm install
npm start

# Or use Docker with volume mounting
docker-compose up frontend
```

### Backend API Development
```bash
# Start API server with nodemon
cd backend/api
npm install
npm run dev

# Or use Docker
docker-compose up api-server
```

### Substrate Development
```bash
# Build and run locally
cargo build --release
./target/release/gasleap-node --dev

# Or use Docker
docker-compose up gasleap-node
```

### SDK Development
```bash
# Build SDK
cd sdk
npm install
npm run build

# Run tests
npm test

# Publish to local registry
npm publish --registry http://localhost:4873
```

## 🧪 Testing Strategies

### Unit Testing
```bash
# Rust pallet tests
cargo test -p pallet-sponsorship

# Frontend tests
cd frontend && npm test

# SDK tests
cd sdk && npm test

# API tests
cd backend/api && npm test
```

### Integration Testing
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration
```

### Demo Testing
```bash
# Quick demo validation
docker-compose -f demo-compose.yml up -d
curl http://localhost:3000/health
curl http://localhost:3003/health
```

## 📧 Email Testing with MailHog

MailHog captures all emails sent by the application:

1. **Access UI**: http://localhost:8025
2. **SMTP Config**: Host: mailhog, Port: 1025
3. **Test Notifications**: 
   - Pool low balance alerts
   - Transaction completion emails
   - User registration confirmations

### Example Email Test
```javascript
// In your API code
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'mailhog',
  port: 1025,
  secure: false
});

await transporter.sendMail({
  from: 'noreply@gasleap.dev',
  to: 'user@example.com',
  subject: 'Transaction Sponsored!',
  html: '<h1>Your gas fees were sponsored!</h1>'
});
```

## 🗄️ Database Management with pgAdmin

### Initial Setup
1. Access pgAdmin: http://localhost:5050
2. Login: admin@gasleap.dev / admin123
3. Server is pre-configured as "GasLeap PostgreSQL"

### Useful Queries
```sql
-- View recent transactions
SELECT * FROM transaction_history 
ORDER BY created_at DESC 
LIMIT 10;

-- Check gas savings by user
SELECT 
  user_account,
  total_saved,
  transaction_count,
  total_saved::float / transaction_count as avg_per_tx
FROM user_gas_savings 
ORDER BY total_saved DESC;

-- Pool analytics
SELECT 
  pool_id,
  SUM(total_transactions) as total_txs,
  SUM(total_gas_sponsored) as total_gas
FROM pool_analytics 
GROUP BY pool_id;
```

## 🔍 Debugging with Jaeger

Jaeger provides distributed tracing for complex cross-chain flows:

1. **Access UI**: http://localhost:16686
2. **Service**: Select "gasleap-api" or "gasleap-node"
3. **Traces**: View XCM message flows and performance bottlenecks

### Adding Traces
```javascript
// In your API code
const opentracing = require('opentracing');

const span = opentracing.globalTracer().startSpan('sponsor_transaction');
span.setTag('pool_id', poolId);
span.setTag('target_chain', targetChain);

try {
  // Your transaction logic
  const result = await sponsorTransaction(params);
  span.setTag('success', true);
  return result;
} catch (error) {
  span.setTag('error', true);
  span.log({ error: error.message });
  throw error;
} finally {
  span.finish();
}
```

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :9944

# Kill processes if needed
kill -9 $(lsof -t -i:3000)
```

#### Docker Issues
```bash
# Clean up containers
docker-compose down -v
docker system prune -f

# Rebuild images
docker-compose build --no-cache
```

#### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres-db

# Reset database
docker-compose down -v
docker-compose up postgres-db
```

#### Node Connection Issues
```bash
# Check node logs
docker-compose logs gasleap-node

# Verify RPC endpoint
curl -H "Content-Type: application/json" \
  -d '{"id":1, "jsonrpc":"2.0", "method": "system_health"}' \
  http://localhost:9933
```

### Performance Optimization

#### Resource Limits
All services have resource limits defined:
- **Memory**: 64M - 1G depending on service
- **CPU**: 0.1 - 1.0 cores depending on service

#### Monitoring
```bash
# Check resource usage
docker stats

# View service health
docker-compose ps
```

## 🎯 Demo Optimization

### For Hackathon Judges
1. **Use demo-compose.yml** for fastest setup
2. **Pre-funded pools** are automatically created
3. **Mock data** is populated in database
4. **All tools accessible** via single ports

### Demo Flow
1. Start: `docker-compose -f demo-compose.yml up -d`
2. Frontend: http://localhost:3000
3. NFT Demo: Mint on Astar (simulated)
4. DeFi Demo: Add liquidity on Acala (simulated)
5. View Data: Check pgAdmin for transaction history
6. Email: Check MailHog for notifications

### Backup Plans
- **Video Recording**: Pre-recorded demo available
- **Mock Services**: All external dependencies mocked
- **Offline Mode**: Works without internet connection

## 📚 Additional Resources

- [Substrate Documentation](https://docs.substrate.io/)
- [Polkadot XCM Guide](https://wiki.polkadot.network/docs/learn-xcm)
- [React Documentation](https://reactjs.org/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test: `docker-compose up -d`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

---

**Happy Developing! 🚀**