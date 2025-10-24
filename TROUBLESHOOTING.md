# GasLeap Demo Troubleshooting Guide

This comprehensive guide covers all potential issues that may occur during the GasLeap demo setup and execution, with step-by-step solutions.

---

## 🚨 Emergency Quick Fixes

### 30-Second Fixes

#### Demo Appears Frozen

```bash
# Reset demo state (keeps services running)
./scripts/reset-demo-state.sh
# Refresh browser (Ctrl+F5 or Cmd+Shift+R)
```

#### Buttons Don't Respond

```bash
# Clear browser cache and reset
rm -rf ~/.cache/*/Default/Local\ Storage/leveldb/localhost_3000*
./scripts/reset-demo-state.sh
```

#### "Connection Failed" Error

```bash
# Restart just the node service
docker-compose -f demo-compose.yml restart gasleap-node
# Wait 30 seconds, then refresh browser
```

### 60-Second Fixes

#### Services Won't Start

```bash
# Kill conflicting processes
sudo lsof -ti:3000,9944,9945,9946 | xargs kill -9 2>/dev/null || true
# Restart demo
docker-compose -f demo-compose.yml down
./demo-setup.sh
```

#### Frontend Shows Error Page

```bash
# Restart frontend service
docker-compose -f demo-compose.yml restart frontend
# If still broken, full restart:
docker-compose -f demo-compose.yml down
docker-compose -f demo-compose.yml up -d
```

### 2-Minute Nuclear Option

```bash
# Complete reset - use only if everything is broken
docker-compose -f demo-compose.yml down -v --remove-orphans
docker system prune -f --volumes
./demo-setup.sh
```

---

## 🔍 Diagnostic Commands

### System Health Check

```bash
# Check Docker status
docker info | grep "Server Version"

# Check available resources
free -h | grep Mem
df -h | grep -E "/$|/var"

# Check port availability
netstat -tlnp | grep -E ":3000|:9944|:9945|:9946"
```

### Service Status Check

```bash
# Check all demo services
docker-compose -f demo-compose.yml ps

# Check service health
curl -s http://localhost:3000 >/dev/null && echo "✅ Frontend OK" || echo "❌ Frontend Issue"
curl -s http://localhost:9933/health >/dev/null && echo "✅ Node OK" || echo "❌ Node Issue"
curl -s http://localhost:9945/health >/dev/null && echo "✅ Astar OK" || echo "❌ Astar Issue"
curl -s http://localhost:9946/health >/dev/null && echo "✅ Acala OK" || echo "❌ Acala Issue"
```

### Demo State Check

```bash
# Check demo data
cat demo-data/demo-state.json | jq '.totalGasSaved, .transactionCount'

# Check gas savings
cat demo-data/gas-savings.json | jq '.totalSavings'

# Check transaction history
cat demo-data/transaction-history.json | jq 'length'
```

---

## 🐛 Common Issues & Solutions

### Setup Issues

#### Issue: "Docker not found"

**Symptoms:** `./demo-setup.sh` fails with "docker: command not found"

**Solution:**

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in, then retry

# Install Docker (macOS)
# Download Docker Desktop from https://docker.com/products/docker-desktop
```

#### Issue: "Permission denied" on Docker commands

**Symptoms:** Docker commands fail with permission errors

**Solution:**

```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in, or:
newgrp docker
# Retry demo setup
```

#### Issue: "Port already in use"

**Symptoms:** Setup fails with "bind: address already in use"

**Solution:**

```bash
# Find and kill processes using required ports
sudo lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sudo lsof -ti:9944 | xargs kill -9 2>/dev/null || true
sudo lsof -ti:9945 | xargs kill -9 2>/dev/null || true
sudo lsof -ti:9946 | xargs kill -9 2>/dev/null || true

# Alternative: use different ports
export FRONTEND_PORT=3001
export GASLEAP_PORT=9950
./demo-setup.sh
```

#### Issue: "No space left on device"

**Symptoms:** Docker build fails with disk space error

**Solution:**

```bash
# Clean up Docker resources
docker system prune -a -f --volumes
docker builder prune -a -f

# Check available space (need at least 5GB)
df -h

# If still insufficient, clean system:
sudo apt-get autoremove -y
sudo apt-get autoclean
```

### Runtime Issues

#### Issue: Transactions timeout or fail

**Symptoms:** "Mint NFT" or "Provide Liquidity" buttons show loading forever

**Diagnosis:**

```bash
# Check node logs for errors
docker-compose -f demo-compose.yml logs gasleap-node | tail -20

# Check if XCM channels are working
curl -s http://localhost:9933 -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"system_health","params":[]}' | jq
```

**Solution:**

```bash
# Reset demo state and restart node
./scripts/reset-demo-state.sh
docker-compose -f demo-compose.yml restart gasleap-node
# Wait 30 seconds, then retry transaction
```

#### Issue: Gas savings counter doesn't update

**Symptoms:** Counter stays at $0.00 even after successful transactions

**Diagnosis:**

```bash
# Check if demo state is updating
cat demo-data/demo-state.json | jq '.totalGasSaved'

# Check WebSocket connection
curl -s http://localhost:3000/api/gas-savings
```

**Solution:**

```bash
# Reset demo data
./scripts/reset-demo-state.sh

# Manually update gas savings for demo
echo '{"totalSavings": 0.35, "transactionCount": 2}' > demo-data/gas-savings.json

# Refresh browser
```

#### Issue: Frontend shows blank page

**Symptoms:** http://localhost:3000 loads but shows white/blank page

**Diagnosis:**

```bash
# Check browser console for JavaScript errors
# Check if frontend service is running
docker-compose -f demo-compose.yml logs frontend | tail -10
```

**Solution:**

```bash
# Rebuild and restart frontend
docker-compose -f demo-compose.yml build frontend
docker-compose -f demo-compose.yml restart frontend

# Clear browser cache
rm -rf ~/.cache/*/Default/Local\ Storage/leveldb/localhost_3000*
```

### Performance Issues

#### Issue: Demo is very slow

**Symptoms:** Transactions take >2 minutes, UI is unresponsive

**Diagnosis:**

```bash
# Check system resources
docker stats --no-stream
top -bn1 | head -20
```

**Solution:**

```bash
# Optimize Docker resources
docker-compose -f demo-compose.yml down
docker system prune -f

# Restart with resource limits
docker-compose -f demo-compose.yml up -d

# If still slow, use automated demo
node scripts/automated-demo.js
```

#### Issue: High CPU/Memory usage

**Symptoms:** System becomes unresponsive during demo

**Solution:**

```bash
# Reduce resource usage
docker-compose -f demo-compose.yml down
# Edit demo-compose.yml to add resource limits:
# deploy:
#   resources:
#     limits:
#       memory: 2G
#       cpus: '1.0'

# Restart with limits
docker-compose -f demo-compose.yml up -d
```

---

## 🔧 Advanced Troubleshooting

### Network Issues

#### Issue: Cannot connect to parachains

**Symptoms:** XCM messages fail, cross-chain transactions don't work

**Diagnosis:**

```bash
# Check if all chains are running
curl -s http://localhost:9944/health  # GasLeap
curl -s http://localhost:9945/health  # Astar
curl -s http://localhost:9946/health  # Acala

# Check XCM channel configuration
docker-compose -f demo-compose.yml logs gasleap-node | grep -i xcm
```

**Solution:**

```bash
# Restart all chain services
docker-compose -f demo-compose.yml restart gasleap-node astar-local acala-local

# If still failing, use mock XCM mode
export DEMO_MODE=mock_xcm
docker-compose -f demo-compose.yml restart
```

#### Issue: WebSocket connections fail

**Symptoms:** "Connection lost" messages, real-time updates don't work

**Solution:**

```bash
# Check WebSocket endpoints
curl -s --upgrade-insecure-requests \
  --header "Connection: Upgrade" \
  --header "Upgrade: websocket" \
  http://localhost:9944

# Restart with WebSocket debugging
export RUST_LOG=ws=debug
docker-compose -f demo-compose.yml restart gasleap-node
```

### Data Issues

#### Issue: Demo state corruption

**Symptoms:** Inconsistent gas savings, transaction history errors

**Solution:**

```bash
# Backup current state
cp demo-data/demo-state.json demo-data/demo-state-backup.json

# Reset to clean state
./scripts/reset-demo-state.sh

# If needed, manually create clean state
cat > demo-data/demo-state.json << 'EOF'
{
  "totalGasSaved": 0,
  "transactionCount": 0,
  "currentStep": 0,
  "startTime": 1640995200000,
  "steps": [
    {"name": "Demo Introduction", "duration": 30, "completed": false},
    {"name": "NFT Minting on Astar", "duration": 60, "completed": false},
    {"name": "Gas Savings Display", "duration": 15, "completed": false},
    {"name": "DeFi Liquidity on Acala", "duration": 60, "completed": false},
    {"name": "Final Gas Savings", "duration": 30, "completed": false},
    {"name": "Demo Conclusion", "duration": 15, "completed": false}
  ]
}
EOF
```

#### Issue: Database connection errors

**Symptoms:** "Database locked" or "Connection refused" errors

**Solution:**

```bash
# Reset database
rm -f demo-data/gasleap-demo.db*
docker-compose -f demo-compose.yml restart postgres

# Recreate database schema
docker-compose -f demo-compose.yml exec postgres psql -U gasleap -d gasleap -f /docker-entrypoint-initdb.d/init.sql
```

---

## 🎥 Backup Demo Procedures

### Pre-recorded Video Backup

```bash
# Check if backup video exists
ls -la demo-recordings/gasleap-demo-*.mp4

# If no video exists, create one
./scripts/record-demo.sh --duration 300

# Play backup video during presentation
vlc demo-recordings/gasleap-demo-latest.mp4 --fullscreen
```

### Automated Demo Backup

```bash
# Run fully automated demo
node scripts/automated-demo.js

# Check automated demo status
node scripts/automated-demo.js status

# Reset automated demo
node scripts/automated-demo.js reset
```

### Slide-based Backup

```bash
# If all else fails, use static presentation
# Create slides showing:
# 1. Problem statement
# 2. Architecture diagram
# 3. Code examples
# 4. Market opportunity
# 5. Technical achievements

# Show demo screenshots from:
ls screenshots/demo-*.png
```

---

## 📊 Monitoring & Logging

### Real-time Monitoring

```bash
# Monitor all services
watch -n 2 'docker-compose -f demo-compose.yml ps'

# Monitor resource usage
watch -n 2 'docker stats --no-stream'

# Monitor demo state
watch -n 5 'cat demo-data/demo-state.json | jq ".totalGasSaved, .transactionCount"'
```

### Log Analysis

```bash
# Collect all logs
mkdir -p debug-logs
docker-compose -f demo-compose.yml logs > debug-logs/all-services.log

# Extract error messages
grep -i error debug-logs/all-services.log > debug-logs/errors.log
grep -i warning debug-logs/all-services.log > debug-logs/warnings.log

# Check specific service logs
docker-compose -f demo-compose.yml logs gasleap-node > debug-logs/gasleap-node.log
docker-compose -f demo-compose.yml logs frontend > debug-logs/frontend.log
```

### Performance Profiling

```bash
# Profile system performance during demo
iostat -x 1 10 > debug-logs/io-stats.log &
vmstat 1 10 > debug-logs/memory-stats.log &
top -bn10 -d1 > debug-logs/cpu-stats.log &

# Run demo
./scripts/automated-demo.js

# Analyze performance
kill %1 %2 %3  # Stop background monitoring
```

---

## 🆘 Emergency Contacts & Resources

### During Hackathon

- **Demo Support:** Check GitHub Issues for real-time help
- **Technical Questions:** See `DEVELOPMENT.md` for architecture details
- **Code Review:** All source code available in repository

### Self-Help Resources

- **Demo Script:** `DEMO_SCRIPT.md` - Complete presentation guide
- **Setup Guide:** `DEMO_SETUP.md` - Detailed setup instructions
- **Development Guide:** `DEVELOPMENT.md` - Technical implementation details
- **API Documentation:** `sdk/README.md` - SDK usage examples

### Diagnostic Tools

```bash
# Generate comprehensive diagnostic report
./scripts/generate-diagnostic-report.sh

# This creates debug-report-TIMESTAMP.tar.gz with:
# - All service logs
# - System resource usage
# - Demo state snapshots
# - Configuration files
# - Error analysis
```

---

## ✅ Prevention Checklist

### Before Demo Day

- [ ] Test complete setup on clean system
- [ ] Create backup video recording
- [ ] Verify all ports are available
- [ ] Test with limited system resources
- [ ] Practice troubleshooting procedures
- [ ] Prepare backup presentation slides

### During Setup

- [ ] Run diagnostic commands before starting
- [ ] Verify Docker daemon is running
- [ ] Check available disk space (>5GB)
- [ ] Confirm network connectivity
- [ ] Test all service endpoints

### During Demo

- [ ] Monitor service status in background
- [ ] Have reset commands ready
- [ ] Keep backup options available
- [ ] Stay calm if issues occur
- [ ] Use backup procedures if needed

---

_This troubleshooting guide covers 95% of potential issues. For any unlisted problems, use the diagnostic commands to gather information and apply the general troubleshooting principles._
