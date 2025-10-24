# Contributing to GasLeap

Welcome to GasLeap! We're excited that you're interested in contributing to our cross-chain gas sponsorship protocol. This guide will help you get started with contributing to the project.

## 🚀 Quick Start for Contributors

### 1. Fork and Clone
```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/GasLeap.git
cd GasLeap

# Add upstream remote
git remote add upstream https://github.com/Emmanuel-Odero/GasLeap.git
```

### 2. Set Up Development Environment
```bash
# Copy environment configuration
cp .env.docker .env

# Start development environment
docker-compose up -d

# Verify everything is running
curl http://localhost:3000/health
curl http://localhost:3003/health
```

### 3. Create a Feature Branch
```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

## 🎯 Ways to Contribute

### 🐛 Bug Reports
Found a bug? Help us fix it!

**Before submitting:**
- Check existing issues to avoid duplicates
- Test with the latest version
- Gather relevant information (logs, environment, steps to reproduce)

**Bug Report Template:**
```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g. macOS, Ubuntu]
- Node version: [e.g. 18.17.0]
- Docker version: [e.g. 24.0.0]
- Browser: [e.g. Chrome 115]

**Logs**
```
Paste relevant logs here
```
```

### 💡 Feature Requests
Have an idea for a new feature?

**Feature Request Template:**
```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How would you like this feature to work?

**Alternatives Considered**
Any alternative solutions you've considered.

**Additional Context**
Screenshots, mockups, or examples that help explain the feature.
```

### 🔧 Code Contributions

#### Areas We Need Help With:
- **Substrate/Rust**: Pallet improvements, XCM integration, performance optimization
- **TypeScript/React**: Frontend features, SDK enhancements, developer tools
- **DevOps**: Docker improvements, CI/CD, deployment automation
- **Documentation**: Guides, tutorials, API documentation
- **Testing**: Unit tests, integration tests, end-to-end tests

## 📋 Development Guidelines

### Code Style

#### Rust Code
```rust
// Use descriptive names
pub fn calculate_sponsorship_fee(
    pool_id: &PoolId,
    transaction_weight: Weight,
    target_chain: ParaId,
) -> Result<Balance, Error> {
    // Implementation
}

// Add comprehensive documentation
/// Calculates the sponsorship fee for a cross-chain transaction.
/// 
/// # Arguments
/// * `pool_id` - The sponsorship pool identifier
/// * `transaction_weight` - The weight of the transaction to sponsor
/// * `target_chain` - The destination parachain ID
/// 
/// # Returns
/// The calculated fee or an error if calculation fails
```

#### TypeScript Code
```typescript
// Use TypeScript types
interface SponsorshipRequest {
  poolId: string;
  targetChain: string;
  transactionCall: string;
  maxFee?: string;
}

// Add JSDoc comments
/**
 * Sponsors a cross-chain transaction using the specified pool
 * @param request - The sponsorship request parameters
 * @returns Promise resolving to the transaction result
 */
export async function sponsorTransaction(
  request: SponsorshipRequest
): Promise<SponsorshipResult> {
  // Implementation
}
```

#### React Components
```tsx
// Use functional components with TypeScript
interface GasSavingsCounterProps {
  totalSaved: string;
  transactionCount: number;
  animated?: boolean;
}

export const GasSavingsCounter: React.FC<GasSavingsCounterProps> = ({
  totalSaved,
  transactionCount,
  animated = true
}) => {
  // Component implementation
};
```

### Testing Requirements

#### Rust Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use frame_support::{assert_ok, assert_noop};

    #[test]
    fn test_create_sponsorship_pool() {
        new_test_ext().execute_with(|| {
            // Test implementation
            assert_ok!(Sponsorship::create_pool(
                Origin::signed(1),
                pool_config.clone()
            ));
        });
    }
}
```

#### TypeScript Tests
```typescript
describe('GasLeapSDK', () => {
  it('should sponsor transaction successfully', async () => {
    const mockRequest: SponsorshipRequest = {
      poolId: 'test-pool',
      targetChain: 'astar',
      transactionCall: '0x123...'
    };

    const result = await sdk.sponsorTransaction(mockRequest);
    
    expect(result.success).toBe(true);
    expect(result.transactionHash).toBeDefined();
  });
});
```

#### React Component Tests
```tsx
import { render, screen } from '@testing-library/react';
import { GasSavingsCounter } from './GasSavingsCounter';

test('displays gas savings correctly', () => {
  render(
    <GasSavingsCounter 
      totalSaved="1.5" 
      transactionCount={10} 
    />
  );
  
  expect(screen.getByText('1.5 DOT saved')).toBeInTheDocument();
  expect(screen.getByText('10 transactions')).toBeInTheDocument();
});
```

### Commit Message Format

We use conventional commits for clear history:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(pallet): add cross-chain fee calculation
fix(frontend): resolve gas counter animation glitch
docs(sdk): add integration examples
test(api): add sponsorship pool tests
```

## 🧪 Testing Your Changes

### 1. Run Local Tests
```bash
# Rust tests
cargo test -p pallet-sponsorship

# Frontend tests
cd frontend && npm test

# SDK tests
cd sdk && npm test

# API tests
cd backend/api && npm test
```

### 2. Integration Testing
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration
```

### 3. Manual Testing
```bash
# Start development environment
docker-compose up -d

# Test the demo flow
# 1. Visit http://localhost:3000
# 2. Try NFT minting on Astar
# 3. Try DeFi liquidity on Acala
# 4. Check transaction history in pgAdmin
```

## 📝 Documentation

### Code Documentation
- Add JSDoc/rustdoc comments for all public APIs
- Include examples in documentation
- Document complex algorithms and business logic
- Keep README files up to date

### User Documentation
- Update relevant guides when adding features
- Add screenshots for UI changes
- Include migration guides for breaking changes
- Test documentation with fresh eyes

## 🔄 Pull Request Process

### 1. Before Submitting
- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format
- [ ] Branch is up to date with main

### 2. Pull Request Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
```

### 3. Review Process
1. **Automated Checks**: CI/CD pipeline runs tests and checks
2. **Code Review**: Maintainers review code for quality and consistency
3. **Testing**: Changes are tested in development environment
4. **Approval**: At least one maintainer approval required
5. **Merge**: Changes are merged into main branch

## 🏗️ Project Architecture

Understanding the project structure helps with contributions:

```
gasleap/
├── runtime/              # Substrate runtime
│   ├── src/
│   │   ├── lib.rs       # Runtime configuration
│   │   └── xcm_config.rs # XCM configuration
│   └── Cargo.toml
├── pallets/
│   └── sponsorship/      # Core sponsorship pallet
│       ├── src/
│       │   ├── lib.rs   # Pallet implementation
│       │   ├── types.rs # Type definitions
│       │   └── weights.rs # Weight calculations
│       └── Cargo.toml
├── node/                 # Parachain node
│   ├── src/
│   │   ├── main.rs      # Node entry point
│   │   ├── service.rs   # Service configuration
│   │   └── rpc.rs       # RPC extensions
│   └── Cargo.toml
├── sdk/                  # TypeScript SDK
│   ├── src/
│   │   ├── index.ts     # Main SDK exports
│   │   ├── client.ts    # Blockchain client
│   │   └── types.ts     # Type definitions
│   └── package.json
├── frontend/             # React demo app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Utility functions
│   └── package.json
└── backend/
    └── api/              # Express.js API
        ├── server.js     # API server
        └── package.json
```

## 🎯 Contribution Areas

### High Priority
- **XCM Integration**: Improve cross-chain message handling
- **Gas Optimization**: Reduce transaction costs
- **Security Audits**: Review and improve security measures
- **Performance**: Optimize database queries and caching
- **Mobile Support**: React Native SDK development

### Medium Priority
- **Additional Parachains**: Support for more Polkadot parachains
- **Advanced Authorization**: Role-based access control
- **Analytics Dashboard**: Enhanced monitoring and reporting
- **API Rate Limiting**: Improved DoS protection
- **Internationalization**: Multi-language support

### Good First Issues
- **Documentation**: Improve guides and tutorials
- **Unit Tests**: Add test coverage for existing code
- **UI Polish**: Improve animations and user experience
- **Error Handling**: Better error messages and recovery
- **Code Cleanup**: Refactor and optimize existing code

## 🤝 Community Guidelines

### Be Respectful
- Use inclusive language
- Be constructive in feedback
- Help newcomers get started
- Celebrate others' contributions

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code review and collaboration

### Getting Help
- Check existing documentation first
- Search issues for similar problems
- Ask specific questions with context
- Provide minimal reproducible examples

## 🏆 Recognition

We appreciate all contributions! Contributors will be:
- Listed in our contributors section
- Mentioned in release notes for significant contributions
- Invited to join our contributor community
- Eligible for contributor rewards and recognition

## 📄 License

By contributing to GasLeap, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to GasLeap! 🚀**

Your contributions help make cross-chain gas sponsorship accessible to everyone in the Polkadot ecosystem.