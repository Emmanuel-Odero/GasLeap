#!/bin/bash

# GasLeap Demo Setup Validation Script
# Comprehensive validation of demo environment for judges

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}${1}${NC}"
    echo -e "${CYAN}$(echo "$1" | sed 's/./=/g')${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️  WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ FAIL]${NC} $1"
}

print_test() {
    echo -e "${MAGENTA}[TEST]${NC} $1"
}

# Global counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Test result tracking
test_result() {
    local result=$1
    local message=$2
    
    case $result in
        "pass")
            print_success "$message"
            ((TESTS_PASSED++))
            ;;
        "fail")
            print_error "$message"
            ((TESTS_FAILED++))
            ;;
        "warn")
            print_warning "$message"
            ((TESTS_WARNING++))
            ;;
    esac
}

echo ""
print_header "🔍 GasLeap Demo Setup Validation"
echo ""
print_status "This script validates that your demo environment is ready for presentation."
print_status "Running comprehensive checks on all components..."
echo ""

# System Requirements Check
print_header "1. System Requirements"

print_test "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    test_result "pass" "Docker installed (version $DOCKER_VERSION)"
else
    test_result "fail" "Docker not installed - required for demo"
fi

print_test "Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
    test_result "pass" "Docker Compose installed (version $COMPOSE_VERSION)"
else
    test_result "fail" "Docker Compose not installed - required for demo"
fi

print_test "Checking Docker daemon status..."
if docker info &> /dev/null; then
    test_result "pass" "Docker daemon is running"
else
    test_result "fail" "Docker daemon not running - start Docker first"
fi

print_test "Checking available memory..."
AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
if [ "$AVAILABLE_MEM" -gt 4096 ]; then
    test_result "pass" "Sufficient memory available (${AVAILABLE_MEM}MB)"
elif [ "$AVAILABLE_MEM" -gt 2048 ]; then
    test_result "warn" "Limited memory available (${AVAILABLE_MEM}MB) - demo may be slow"
else
    test_result "fail" "Insufficient memory (${AVAILABLE_MEM}MB) - need at least 2GB"
fi

print_test "Checking available disk space..."
AVAILABLE_DISK=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
if [ "$AVAILABLE_DISK" -gt 10 ]; then
    test_result "pass" "Sufficient disk space available (${AVAILABLE_DISK}GB)"
elif [ "$AVAILABLE_DISK" -gt 5 ]; then
    test_result "warn" "Limited disk space available (${AVAILABLE_DISK}GB)"
else
    test_result "fail" "Insufficient disk space (${AVAILABLE_DISK}GB) - need at least 5GB"
fi

echo ""

# Port Availability Check
print_header "2. Port Availability"

REQUIRED_PORTS=(3000 9933 9944 9945 9946)
for port in "${REQUIRED_PORTS[@]}"; do
    print_test "Checking port $port availability..."
    if lsof -i:$port &> /dev/null; then
        PROCESS=$(lsof -ti:$port | head -1)
        PROCESS_NAME=$(ps -p $PROCESS -o comm= 2>/dev/null || echo "unknown")
        test_result "warn" "Port $port in use by $PROCESS_NAME (PID: $PROCESS)"
    else
        test_result "pass" "Port $port is available"
    fi
done

echo ""

# Demo Files Check
print_header "3. Demo Files and Configuration"

print_test "Checking demo setup script..."
if [ -f "./demo-setup.sh" ] && [ -x "./demo-setup.sh" ]; then
    test_result "pass" "Demo setup script exists and is executable"
else
    test_result "fail" "Demo setup script missing or not executable"
fi

print_test "Checking Docker Compose configuration..."
if [ -f "demo-compose.yml" ]; then
    if docker-compose -f demo-compose.yml config &> /dev/null; then
        test_result "pass" "Docker Compose configuration is valid"
    else
        test_result "fail" "Docker Compose configuration has errors"
    fi
else
    test_result "fail" "demo-compose.yml not found"
fi

print_test "Checking demo documentation..."
DEMO_DOCS=("DEMO_SETUP.md" "DEMO_SCRIPT.md" "JUDGE_SETUP.md" "TROUBLESHOOTING.md")
for doc in "${DEMO_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        test_result "pass" "$doc exists"
    else
        test_result "warn" "$doc missing - may affect judge experience"
    fi
done

print_test "Checking demo scripts..."
DEMO_SCRIPTS=("scripts/reset-demo-state.sh" "scripts/automated-demo.js" "scripts/record-demo.sh")
for script in "${DEMO_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        test_result "pass" "$(basename $script) exists"
    else
        test_result "warn" "$(basename $script) missing - reduced functionality"
    fi
done

echo ""

# Service Health Check (if running)
print_header "4. Service Health Check"

print_test "Checking if demo services are running..."
if docker-compose -f demo-compose.yml ps | grep -q "Up"; then
    print_status "Demo services are running - checking health..."
    
    print_test "Checking frontend service..."
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        test_result "pass" "Frontend is responding on port 3000"
    else
        test_result "fail" "Frontend not responding - may still be starting"
    fi
    
    print_test "Checking GasLeap node..."
    if curl -s http://localhost:9933/health >/dev/null 2>&1; then
        test_result "pass" "GasLeap node is responding on port 9933"
    else
        test_result "fail" "GasLeap node not responding - check logs"
    fi
    
    print_test "Checking demo data..."
    if [ -f "demo-data/demo-state.json" ]; then
        TOTAL_SAVED=$(cat demo-data/demo-state.json | jq -r '.totalGasSaved // 0' 2>/dev/null || echo "0")
        if [ "$TOTAL_SAVED" = "0" ]; then
            test_result "pass" "Demo state is reset and ready"
        else
            test_result "warn" "Demo state shows previous activity - consider resetting"
        fi
    else
        test_result "warn" "Demo state file not found - will be created on first run"
    fi
    
else
    print_status "Demo services not running - this is normal if not started yet"
    test_result "pass" "Services ready to start"
fi

echo ""

# Build Artifacts Check
print_header "5. Build Artifacts"

print_test "Checking Rust/Substrate build..."
if [ -f "target/release/gasleap-node" ]; then
    test_result "pass" "GasLeap node binary exists"
elif [ -f "target/debug/gasleap-node" ]; then
    test_result "warn" "Only debug build available - release build recommended for demo"
else
    test_result "warn" "Node binary not found - will be built during setup"
fi

print_test "Checking frontend build..."
if [ -d "frontend/build" ] || [ -d "frontend/dist" ]; then
    test_result "pass" "Frontend build artifacts exist"
elif [ -d "frontend/node_modules" ]; then
    test_result "warn" "Frontend dependencies installed but not built"
else
    test_result "warn" "Frontend not built - will be built during setup"
fi

print_test "Checking SDK build..."
if [ -d "sdk/dist" ]; then
    test_result "pass" "SDK build artifacts exist"
elif [ -d "sdk/node_modules" ]; then
    test_result "warn" "SDK dependencies installed but not built"
else
    test_result "warn" "SDK not built - will be built during setup"
fi

echo ""

# Network Connectivity Check
print_header "6. Network Connectivity"

print_test "Checking internet connectivity..."
if ping -c 1 google.com &> /dev/null; then
    test_result "pass" "Internet connectivity available"
else
    test_result "warn" "Limited internet connectivity - may affect Docker image pulls"
fi

print_test "Checking Docker Hub connectivity..."
if docker pull hello-world:latest &> /dev/null; then
    test_result "pass" "Docker Hub accessible"
    docker rmi hello-world:latest &> /dev/null || true
else
    test_result "warn" "Docker Hub connectivity issues - may affect image pulls"
fi

echo ""

# Demo Readiness Assessment
print_header "7. Demo Readiness Assessment"

print_test "Calculating demo readiness score..."
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))
READINESS_SCORE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

if [ $TESTS_FAILED -eq 0 ] && [ $READINESS_SCORE -gt 90 ]; then
    test_result "pass" "Demo environment is EXCELLENT (${READINESS_SCORE}% ready)"
    DEMO_STATUS="🟢 READY"
elif [ $TESTS_FAILED -eq 0 ] && [ $READINESS_SCORE -gt 75 ]; then
    test_result "pass" "Demo environment is GOOD (${READINESS_SCORE}% ready)"
    DEMO_STATUS="🟡 MOSTLY READY"
elif [ $TESTS_FAILED -le 2 ]; then
    test_result "warn" "Demo environment has minor issues (${READINESS_SCORE}% ready)"
    DEMO_STATUS="🟡 NEEDS ATTENTION"
else
    test_result "fail" "Demo environment has major issues (${READINESS_SCORE}% ready)"
    DEMO_STATUS="🔴 NOT READY"
fi

echo ""

# Final Summary
print_header "📊 Validation Summary"
echo ""
echo -e "Demo Status: ${DEMO_STATUS}"
echo -e "Readiness Score: ${READINESS_SCORE}%"
echo ""
echo -e "Test Results:"
echo -e "  ✅ Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "  ⚠️  Warnings: ${YELLOW}${TESTS_WARNING}${NC}"
echo -e "  ❌ Failed: ${RED}${TESTS_FAILED}${NC}"
echo -e "  📊 Total: ${TOTAL_TESTS}"
echo ""

# Recommendations
print_header "💡 Recommendations"

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Critical Issues Found:${NC}"
    echo "  • Fix failed tests before running demo"
    echo "  • Check TROUBLESHOOTING.md for solutions"
    echo "  • Consider using backup demo options"
    echo ""
fi

if [ $TESTS_WARNING -gt 0 ]; then
    echo -e "${YELLOW}Warnings Found:${NC}"
    echo "  • Address warnings for optimal demo experience"
    echo "  • Have backup procedures ready"
    echo "  • Monitor performance during demo"
    echo ""
fi

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}Next Steps:${NC}"
    if docker-compose -f demo-compose.yml ps | grep -q "Up"; then
        echo "  • Demo is already running - visit http://localhost:3000"
        echo "  • Run './scripts/reset-demo-state.sh' to reset for fresh demo"
    else
        echo "  • Run './demo-setup.sh' to start the demo"
        echo "  • Visit http://localhost:3000 when setup completes"
    fi
    echo "  • Review DEMO_SCRIPT.md for presentation timing"
    echo "  • Keep TROUBLESHOOTING.md handy during demo"
    echo ""
fi

# Quick Commands Reference
print_header "🚀 Quick Commands"
echo ""
echo "Start Demo:     ./demo-setup.sh"
echo "Reset Demo:     ./scripts/reset-demo-state.sh"
echo "Stop Demo:      docker-compose -f demo-compose.yml down"
echo "View Logs:      docker-compose -f demo-compose.yml logs -f"
echo "Health Check:   curl http://localhost:3000 && curl http://localhost:9933/health"
echo "Backup Demo:    node scripts/automated-demo.js"
echo ""

# Exit with appropriate code
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Validation failed - fix critical issues before demo${NC}"
    exit 1
elif [ $TESTS_WARNING -gt 3 ]; then
    echo -e "${YELLOW}⚠️  Validation passed with warnings - monitor demo closely${NC}"
    exit 2
else
    echo -e "${GREEN}✅ Validation passed - demo environment is ready!${NC}"
    exit 0
fi