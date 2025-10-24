# GasLeap Environment Configuration Guide

This guide explains how to configure GasLeap for different environments using environment variables.

## 📁 Environment Files Overview

| File | Purpose | When Used |
|------|---------|-----------|
| `.env.example` | Template with all variables | Copy to create your `.env` |
| `.env.docker` | Docker development setup | `docker-compose up` |
| `.env.local` | Local development | Running services locally |
| `.env.development.local` | Frontend development | React dev server |
| `.env.test.local` | Testing environment | Running tests |
| `.env.production.local` | Production deployment | Production servers |

## 🚀 Quick Setup

### 1. Choose Your Environment

```bash
# For Docker development (recommended)
cp .env.docker .env

# For local development
cp .env.local .env

# For frontend development
cp .env.development.local .env

# For testing
cp .env.test.local .env
```

### 2. Customize Variables

Edit your `.env` file and update the following critical variables:

```bash
# Database credentials
POSTGRES_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password

# JWT secret (production)
JWT_SECRET=your-super-secret-jwt-key

# API keys (production)
API_KEY=your-api-key

# Email settings (production)
SMTP_PASS=your-smtp-password
```

## 🐳 Docker Environment (`.env.docker`)

**Best for**: Full-stack development with all services

### Key Features:
- All services run in containers
- Internal Docker networking
- Pre-configured service discovery
- Resource limits for stability

### Usage:
```bash
cp .env.docker .env
docker-compose up -d
```

### Access Points:
- Frontend: http://localhost:3000
- API: http://localhost:3003
- Database: localhost:5432
- Redis: localhost:6379
- MailHog: http://localhost:8025
- pgAdmin: http://localhost:5050

## 💻 Local Development (`.env.local`)

**Best for**: Native development without Docker

### Key Features:
- Services run directly on host
- Faster development cycles
- Direct debugging access
- Reduced resource usage

### Prerequisites:
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Install Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Start services
brew services start postgresql redis  # macOS
sudo systemctl start postgresql redis  # Ubuntu
```

### Usage:
```bash
cp .env.local .env

# Start database
createdb gasleap_dev

# Start backend
cd backend/api && npm install && npm start

# Start frontend
cd frontend && npm install && npm start

# Start node
cargo run --release -- --dev
```

## ⚛️ Frontend Development (`.env.development.local`)

**Best for**: React development with hot reload

### Key Features:
- Optimized for Create React App
- Hot module replacement
- Source maps enabled
- Debug tools enabled

### Usage:
```bash
cd frontend
cp ../.env.development.local .env.local
npm start
```

### Development Tools:
- React DevTools enabled
- Source maps for debugging
- Hot reload for instant updates
- Mock data for offline development

## 🧪 Testing Environment (`.env.test.local`)

**Best for**: Running automated tests

### Key Features:
- Isolated test database
- Mock external services
- Minimal logging
- Fast test execution

### Usage:
```bash
# Setup test database
createdb gasleap_test

# Run tests
cp .env.test.local .env
npm test
```

### Test Configuration:
- Separate test database
- Mock blockchain calls
- Disabled external services
- Parallel test execution

## 🚀 Production Environment (`.env.production.local`)

**Best for**: Production deployment

### Key Features:
- Security hardened
- Performance optimized
- Monitoring enabled
- Backup configured

### Critical Security Steps:

1. **Change All Default Passwords**:
```bash
POSTGRES_PASSWORD=secure-random-password
REDIS_PASSWORD=secure-random-password
JWT_SECRET=cryptographically-secure-secret
```

2. **Configure HTTPS**:
```bash
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
```

3. **Set Up Monitoring**:
```bash
METRICS_ENABLED=true
JAEGER_ENDPOINT=https://your-jaeger-instance
ALERT_WEBHOOK_URL=https://your-alert-webhook
```

4. **Configure Backups**:
```bash
BACKUP_ENABLED=true
BACKUP_S3_BUCKET=your-backup-bucket
BACKUP_S3_ACCESS_KEY=your-access-key
```

## 🔧 Variable Categories

### Core Application
```bash
NODE_ENV=development|test|production
DEMO_MODE=true|false
LOG_LEVEL=debug|info|warn|error
```

### Database Configuration
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=gasleap
POSTGRES_USER=gasleap
POSTGRES_PASSWORD=password
```

### Redis Configuration
```bash
REDIS_URL=redis://host:port/db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password
REDIS_DB=0
```

### Blockchain Configuration
```bash
GASLEAP_NODE_URL=ws://localhost:9944
ASTAR_ENDPOINT=ws://localhost:9945
ACALA_ENDPOINT=ws://localhost:9946
PARA_ID=1000
```

### API Configuration
```bash
API_PORT=3003
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_ENABLED=true
```

### Frontend Configuration
```bash
REACT_APP_GASLEAP_ENDPOINT=ws://localhost:9944
REACT_APP_API_ENDPOINT=http://localhost:3003
REACT_APP_DEMO_MODE=true
```

### Security Configuration
```bash
JWT_SECRET=your-secret-key
API_KEY=your-api-key
HTTPS_ENABLED=false
RATE_LIMIT_MAX_REQUESTS=100
```

### Email Configuration
```bash
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=username
SMTP_PASS=password
EMAIL_FROM=noreply@gasleap.dev
```

### Monitoring Configuration
```bash
METRICS_ENABLED=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_PORT=9090
```

## 🎯 Environment-Specific Configurations

### Development Features
```bash
# Enable for development
FEATURE_DEBUG_LOGGING=true
FEATURE_HOT_RELOAD=true
FEATURE_MOCK_TRANSACTIONS=true
MOCK_EXTERNAL_SERVICES=true

# Disable for production
FEATURE_DEBUG_LOGGING=false
FEATURE_HOT_RELOAD=false
FEATURE_MOCK_TRANSACTIONS=false
MOCK_EXTERNAL_SERVICES=false
```

### Performance Tuning
```bash
# Development (lower resources)
DB_POOL_MAX=5
CACHE_TTL=60
ANALYTICS_BATCH_SIZE=10

# Production (higher performance)
DB_POOL_MAX=20
CACHE_TTL=3600
ANALYTICS_BATCH_SIZE=1000
```

### Security Levels
```bash
# Development (relaxed)
RATE_LIMIT_ENABLED=false
CORS_ORIGIN=*
JWT_EXPIRES_IN=30d

# Production (strict)
RATE_LIMIT_ENABLED=true
CORS_ORIGIN=https://gasleap.dev
JWT_EXPIRES_IN=24h
```

## 🔒 Security Best Practices

### 1. Never Commit Secrets
```bash
# Add to .gitignore
.env
.env.local
.env.production.local
*.key
*.pem
```

### 2. Use Environment-Specific Files
```bash
# Development
.env.development.local

# Testing
.env.test.local

# Production
.env.production.local
```

### 3. Validate Required Variables
```javascript
// In your application startup
const requiredVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Required environment variable ${varName} is not set`);
  }
});
```

### 4. Use Secrets Management
```bash
# AWS Secrets Manager
SECRETS_MANAGER=aws
SECRET_ARN=arn:aws:secretsmanager:region:account:secret:name

# HashiCorp Vault
VAULT_ENDPOINT=https://vault.example.com
VAULT_TOKEN=your-vault-token
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials
psql -h localhost -p 5432 -U gasleap -d gasleap
```

#### 2. Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Test connection
redis-cli -h localhost -p 6379
```

#### 3. Node Connection Failed
```bash
# Check if node is running
curl -H "Content-Type: application/json" \
  -d '{"id":1, "jsonrpc":"2.0", "method": "system_health"}' \
  http://localhost:9933
```

#### 4. Frontend Can't Connect to API
```bash
# Check CORS settings
CORS_ORIGIN=http://localhost:3000

# Verify API is running
curl http://localhost:3003/health
```

### Environment Validation Script
```bash
#!/bin/bash
# validate-env.sh

echo "Validating GasLeap environment..."

# Check required variables
required_vars=(
  "DATABASE_URL"
  "REDIS_URL"
  "GASLEAP_NODE_URL"
  "API_PORT"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required variable: $var"
    exit 1
  else
    echo "✅ $var is set"
  fi
done

echo "🎉 Environment validation passed!"
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Redis Configuration](https://redis.io/topics/config)

---

**Need Help?** Check the [DEVELOPMENT.md](DEVELOPMENT.md) guide or open an issue on GitHub.