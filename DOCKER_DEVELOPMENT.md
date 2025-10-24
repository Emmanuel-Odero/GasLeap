# Docker Development Guide for GasLeap

This guide explains how to use Docker for GasLeap development, testing, and deployment.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Make (optional, for convenience commands)

### Development Commands

```bash
# Start interactive development shell
make dev-shell

# Run tests for the sponsorship pallet
make test-pallet

# Run all tests
make test

# Format and lint code
make fmt
make clippy

# Build the project
make build

# Start watch mode for continuous testing
make watch
```

## Docker Configurations

### Development Environment (`docker-compose.dev.yml`)

Focused on development and testing:

- **gasleap-dev**: Interactive development container with all Rust tools
- **test-runner**: Automated test execution
- **pallet-test**: Specific pallet testing
- **code-quality**: Code formatting and linting
- **build**: Release builds
- **watch**: Continuous testing

### Production Environment (`docker-compose.yml`)

Full application stack:

- **gasleap-node**: The main parachain node
- **frontend**: React frontend application
- **api-server**: Backend API service
- **postgres-db**: PostgreSQL database
- **redis-cache**: Redis for caching
- **nginx-proxy**: Reverse proxy
- Plus development tools and mock services

## Development Workflow

### 1. Start Development Shell

```bash
make dev-shell
```

This gives you an interactive shell inside a container with:
- Rust toolchain (rustc, cargo, rustfmt, clippy)
- All project dependencies pre-built
- Your source code mounted as a volume

### 2. Run Tests

```bash
# Inside the development shell
cargo test -p pallet-sponsorship

# Or from host machine
make test-pallet
```

### 3. Code Quality

```bash
# Format code
make fmt

# Run linter
make clippy

# Both together
make check
```

### 4. Continuous Development

```bash
# Start watch mode - automatically runs tests when files change
make watch
```

### 5. Build Release

```bash
make build
```

## Working with the Sponsorship Pallet

### Running Pallet Tests

```bash
# Method 1: Using make command
make test-pallet

# Method 2: Direct docker-compose
docker-compose -f docker-compose.dev.yml run --rm pallet-test

# Method 3: In development shell
make dev-shell
cargo test -p pallet-sponsorship
```

### Debugging Tests

```bash
# Run with debug output
make dev-shell
RUST_LOG=debug cargo test -p pallet-sponsorship -- --nocapture

# Run specific test
cargo test -p pallet-sponsorship create_pool_works -- --nocapture
```

### Code Development

```bash
# Start development shell
make dev-shell

# Make changes to pallets/sponsorship/src/lib.rs
# Run tests to verify
cargo test -p pallet-sponsorship

# Format and lint
cargo fmt
cargo clippy
```

## Docker Volumes

The development setup uses Docker volumes for caching:

- `cargo-cache`: Caches downloaded crates
- `target-cache`: Caches build artifacts

This significantly speeds up subsequent builds.

## Troubleshooting

### Build Issues

```bash
# Clean everything and rebuild
make clean
make build
```

### Permission Issues

If you encounter permission issues with files created in Docker:

```bash
# Fix ownership (Linux/macOS)
sudo chown -R $USER:$USER .
```

### Memory Issues

If builds fail due to memory constraints:

```bash
# Limit parallel jobs
docker-compose -f docker-compose.dev.yml run --rm gasleap-dev cargo build -j 1
```

## Advanced Usage

### Custom Cargo Commands

```bash
# Run any cargo command in Docker
make cargo-check
make cargo-doc
make cargo-bench

# Or directly
docker-compose -f docker-compose.dev.yml run --rm gasleap-dev cargo check
```

### Debugging with GDB

```bash
# Build with debug symbols
docker-compose -f docker-compose.dev.yml run --rm gasleap-dev cargo build

# Run with GDB (requires privileged container)
docker-compose -f docker-compose.dev.yml run --rm --privileged gasleap-dev gdb target/debug/gasleap-node
```

### Performance Profiling

```bash
# Install profiling tools
docker-compose -f docker-compose.dev.yml run --rm gasleap-dev cargo install flamegraph

# Profile tests
docker-compose -f docker-compose.dev.yml run --rm --privileged gasleap-dev cargo flamegraph --test -- --test-threads=1
```

## Production Deployment

### Start Full Stack

```bash
# Start all services
make start-prod

# Check status
docker-compose ps

# View logs
docker-compose logs -f gasleap-node
```

### Services Available

- **GasLeap Node**: http://localhost:9944 (WebSocket), http://localhost:9933 (HTTP RPC)
- **Frontend**: http://localhost:3000
- **API Server**: http://localhost:3003
- **Database Admin**: http://localhost:5050 (pgAdmin)
- **Redis Commander**: http://localhost:8081
- **Jaeger Tracing**: http://localhost:16686
- **Mail Testing**: http://localhost:8025 (MailHog)

## Environment Variables

Key environment variables for development:

```bash
RUST_LOG=debug          # Enable debug logging
RUST_BACKTRACE=1        # Show full backtraces
NODE_ENV=development    # Development mode
```

## Tips

1. **Use volumes**: The setup uses Docker volumes to persist build caches
2. **Parallel builds**: Adjust `-j` flag based on your system resources
3. **Watch mode**: Use `make watch` for continuous testing during development
4. **Shell access**: Use `make dev-shell` for interactive development
5. **Clean builds**: Use `make clean` if you encounter weird build issues

## Next Steps

1. Start with `make dev-shell` to get familiar with the environment
2. Run `make test-pallet` to verify the sponsorship pallet tests
3. Use `make watch` for continuous development
4. Explore the full stack with `make start-prod`