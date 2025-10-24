# GasLeap Development Makefile
.PHONY: help build test test-pallet fmt clippy clean dev-shell watch start-dev stop-dev logs demo setup-chains seed-data

# Default target
help:
	@echo "GasLeap Development Commands:"
	@echo ""
	@echo "Docker Development:"
	@echo "  dev-shell      - Start interactive development shell"
	@echo "  build          - Build the project in Docker"
	@echo "  test           - Run all tests in Docker"
	@echo "  test-pallet    - Run pallet-sponsorship tests in Docker"
	@echo "  fmt            - Format code in Docker"
	@echo "  clippy         - Run clippy linter in Docker"
	@echo "  watch          - Run tests in watch mode"
	@echo ""
	@echo "Docker Services:"
	@echo "  start-dev      - Start development services"
	@echo "  stop-dev       - Stop development services"
	@echo "  logs           - Show logs from development services"
	@echo ""
	@echo "Demo & Parachain Setup:"
	@echo "  demo           - Start one-click demo environment (for judges)"
	@echo "  setup-chains   - Set up local parachain environment"
	@echo "  seed-data      - Seed demo data"
	@echo "  reset-demo     - Reset demo environment completely"
	@echo "  health         - Check health of all services"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean          - Clean build artifacts and Docker volumes"

# Development shell
dev-shell:
	@echo "🚀 Starting GasLeap development shell..."
	docker-compose -f docker-compose.dev.yml run --rm gasleap-dev bash

# Build project
build:
	@echo "🔨 Building GasLeap project..."
	docker-compose -f docker-compose.dev.yml run --rm build

# Run all tests
test:
	@echo "🧪 Running all tests..."
	docker-compose -f docker-compose.dev.yml run --rm test-runner

# Run pallet tests specifically
test-pallet:
	@echo "🧪 Running pallet-sponsorship tests..."
	docker-compose -f docker-compose.dev.yml run --rm pallet-test

# Format code
fmt:
	@echo "🎨 Formatting code..."
	docker-compose -f docker-compose.dev.yml run --rm gasleap-dev cargo fmt --all

# Run clippy
clippy:
	@echo "📎 Running clippy..."
	docker-compose -f docker-compose.dev.yml run --rm gasleap-dev cargo clippy --all-targets --all-features -- -D warnings

# Code quality check (fmt + clippy)
check: fmt clippy
	@echo "✅ Code quality check completed"

# Watch mode for tests
watch:
	@echo "👀 Starting test watch mode..."
	docker-compose -f docker-compose.dev.yml up watch

# Start development services
start-dev:
	@echo "🚀 Starting development services..."
	docker-compose -f docker-compose.dev.yml up -d

# Stop development services
stop-dev:
	@echo "🛑 Stopping development services..."
	docker-compose -f docker-compose.dev.yml down

# Show logs
logs:
	@echo "📋 Showing development logs..."
	docker-compose -f docker-compose.dev.yml logs -f

# Clean everything
clean:
	@echo "🧹 Cleaning up..."
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f
	docker volume prune -f

# Quick development cycle
dev: fmt clippy test
	@echo "✅ Development cycle completed successfully!"

# Production services (from main docker-compose.yml)
start-prod:
	@echo "🚀 Starting production services..."
	docker-compose up -d

stop-prod:
	@echo "🛑 Stopping production services..."
	docker-compose down

# Demo and parachain setup commands
demo:
	@echo "🎯 Starting demo environment (one-click for judges)..."
	./demo-setup.sh

setup-chains:
	@echo "🔗 Setting up local parachain environment..."
	./docker/scripts/setup-local-chains.sh

seed-data:
	@echo "🌱 Seeding demo data..."
	cd docker/scripts && npm install && npm run seed

reset-demo:
	@echo "🔄 Resetting demo environment completely..."
	docker-compose -f demo-compose.yml down -v --remove-orphans
	docker system prune -f --volumes
	./demo-setup.sh

health:
	@echo "🏥 Checking service health..."
	@echo "GasLeap Node:"
	@curl -s http://localhost:9933/health || echo "❌ Not responding"
	@echo ""
	@echo "Frontend:"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Healthy" || echo "❌ Not responding"
	@echo ""
	@echo "API Server:"
	@curl -s http://localhost:3003/health || echo "❌ Not responding"

quick-demo:
	@echo "⚡ Quick demo setup (minimal services)..."
	docker-compose -f demo-compose.yml up -d gasleap-node frontend demo-seeder

# Run specific cargo commands in Docker
cargo-%:
	@echo "🦀 Running cargo $*..."
	docker-compose -f docker-compose.dev.yml run --rm gasleap-dev cargo $*