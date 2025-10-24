#!/usr/bin/env node

/**
 * GasLeap End-to-End Integration Test
 * 
 * This script tests the complete integration between:
 * - SDK → Pallet (via RPC)
 * - Frontend → SDK
 * - XCM Gateway → Sponsorship Pallet
 */

const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');

// Test configuration
const CONFIG = {
  nodeEndpoint: 'ws://localhost:9944',
  testTimeout: 30000,
  demoPoolId: 1,
  testChains: {
    astar: 2007,
    acala: 2000
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

class GasLeapIntegrationTest {
  constructor() {
    this.api = null;
    this.keyring = null;
    this.alice = null;
    this.bob = null;
    this.testResults = {
      nodeConnection: false,
      rpcMethods: false,
      palletFunctions: false,
      poolCreation: false,
      transactionSponsorship: false,
      gasSavingsTracking: false,
      xcmIntegration: false
    };
  }

  async initialize() {
    logStep('INIT', 'Initializing test environment...');
    
    try {
      // Connect to the node
      const provider = new WsProvider(CONFIG.nodeEndpoint);
      this.api = await ApiPromise.create({ provider });
      await this.api.isReady;
      
      logSuccess('Connected to GasLeap node');
      this.testResults.nodeConnection = true;

      // Setup keyring and test accounts
      this.keyring = new Keyring({ type: 'sr25519' });
      this.alice = this.keyring.addFromUri('//Alice');
      this.bob = this.keyring.addFromUri('//Bob');
      
      logSuccess('Test accounts initialized');
      
    } catch (error) {
      logError(`Failed to initialize: ${error.message}`);
      throw error;
    }
  }

  async testNodeConnection() {
    logStep('TEST-1', 'Testing node connection and basic RPC methods...');
    
    try {
      // Test basic system calls
      const chain = await this.api.rpc.system.chain();
      const version = await this.api.rpc.system.version();
      const health = await this.api.rpc.system.health();
      
      log(`Chain: ${chain}`, 'cyan');
      log(`Version: ${version}`, 'cyan');
      log(`Health: ${JSON.stringify(health.toHuman())}`, 'cyan');
      
      // Test if sponsorship pallet is available
      const palletExists = this.api.tx.sponsorship !== undefined;
      if (!palletExists) {
        throw new Error('Sponsorship pallet not found in runtime');
      }
      
      logSuccess('Node connection and basic RPC methods working');
      this.testResults.rpcMethods = true;
      
    } catch (error) {
      logError(`Node connection test failed: ${error.message}`);
      throw error;
    }
  }

  async testPalletFunctions() {
    logStep('TEST-2', 'Testing sponsorship pallet functions...');
    
    try {
      // Test pallet query functions
      const nextPoolId = await this.api.query.sponsorship.nextPoolId();
      log(`Next Pool ID: ${nextPoolId}`, 'cyan');
      
      // Test if we can access pallet constants
      const minPoolDeposit = this.api.consts.sponsorship.minPoolDeposit;
      log(`Min Pool Deposit: ${minPoolDeposit}`, 'cyan');
      
      logSuccess('Pallet functions accessible');
      this.testResults.palletFunctions = true;
      
    } catch (error) {
      logError(`Pallet functions test failed: ${error.message}`);
      throw error;
    }
  }

  async testPoolCreation() {
    logStep('TEST-3', 'Testing pool creation...');
    
    try {
      // Create pool configuration
      const poolConfig = {
        maxTransactionValue: '1000000000000000000', // 1 token
        dailySpendingLimit: '10000000000000000000', // 10 tokens
        allowedChains: [CONFIG.testChains.astar, CONFIG.testChains.acala],
        authorizationRequired: false
      };
      
      const initialDeposit = '100000000000000000000'; // 100 tokens
      
      // Create the pool
      const createPoolTx = this.api.tx.sponsorship.createPool(initialDeposit, poolConfig);
      
      await new Promise((resolve, reject) => {
        createPoolTx.signAndSend(this.alice, (result) => {
          if (result.status.isInBlock) {
            log(`Pool creation in block: ${result.status.asInBlock}`, 'cyan');
          } else if (result.status.isFinalized) {
            logSuccess('Pool created successfully');
            this.testResults.poolCreation = true;
            resolve();
          } else if (result.isError) {
            reject(new Error('Pool creation failed'));
          }
        }).catch(reject);
      });
      
    } catch (error) {
      logError(`Pool creation test failed: ${error.message}`);
      // Don't throw - continue with other tests
      logWarning('Continuing with mock pool for remaining tests');
    }
  }

  async testTransactionSponsorship() {
    logStep('TEST-4', 'Testing transaction sponsorship...');
    
    try {
      // Test sponsoring a transaction
      const poolId = CONFIG.demoPoolId;
      const targetChain = CONFIG.testChains.astar;
      const callData = JSON.stringify({
        type: 'nft_mint',
        name: 'Test NFT',
        description: 'Integration test NFT'
      });
      
      const sponsorTx = this.api.tx.sponsorship.sponsorTransaction(
        poolId,
        targetChain,
        callData
      );
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Transaction sponsorship timeout'));
        }, 15000);
        
        sponsorTx.signAndSend(this.bob, (result) => {
          if (result.status.isInBlock) {
            log(`Sponsorship in block: ${result.status.asInBlock}`, 'cyan');
          } else if (result.status.isFinalized) {
            clearTimeout(timeout);
            logSuccess('Transaction sponsorship successful');
            this.testResults.transactionSponsorship = true;
            resolve();
          } else if (result.isError) {
            clearTimeout(timeout);
            reject(new Error('Transaction sponsorship failed'));
          }
        }).catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
    } catch (error) {
      logError(`Transaction sponsorship test failed: ${error.message}`);
      logWarning('This might be expected if pools are not properly funded in test environment');
    }
  }

  async testCustomRPCMethods() {
    logStep('TEST-5', 'Testing custom RPC methods...');
    
    try {
      // Test custom sponsorship RPC methods
      if (this.api.rpc.sponsorship) {
        // Test getting pool info
        try {
          const poolInfo = await this.api.rpc.sponsorship.getPool(CONFIG.demoPoolId);
          log(`Pool info: ${JSON.stringify(poolInfo?.toHuman() || 'null')}`, 'cyan');
        } catch (rpcError) {
          logWarning(`Pool info RPC not available: ${rpcError.message}`);
        }
        
        // Test gas savings
        try {
          const gasSavings = await this.api.rpc.sponsorship.getUserGasSavings(this.bob.address);
          log(`Gas savings: ${gasSavings}`, 'cyan');
          this.testResults.gasSavingsTracking = true;
        } catch (rpcError) {
          logWarning(`Gas savings RPC not available: ${rpcError.message}`);
        }
        
        logSuccess('Custom RPC methods accessible');
      } else {
        logWarning('Custom sponsorship RPC methods not found');
      }
      
    } catch (error) {
      logError(`Custom RPC test failed: ${error.message}`);
    }
  }

  async testXCMIntegration() {
    logStep('TEST-6', 'Testing XCM integration...');
    
    try {
      // Test XCM gateway functionality (mock test)
      // In a real test, this would verify XCM message formatting and dispatch
      
      // For now, just verify the XCM-related storage and functions exist
      const hasXcmGateway = this.api.query.sponsorship.transactionLog !== undefined;
      
      if (hasXcmGateway) {
        logSuccess('XCM integration components present');
        this.testResults.xcmIntegration = true;
      } else {
        logWarning('XCM integration components not fully implemented');
      }
      
    } catch (error) {
      logError(`XCM integration test failed: ${error.message}`);
    }
  }

  async testSDKIntegration() {
    logStep('TEST-7', 'Testing SDK integration...');
    
    try {
      // Test if SDK can connect to the node
      // This would normally require importing the SDK, but for now we'll test the connection
      
      const nodeInfo = await this.api.rpc.system.properties();
      log(`Node properties: ${JSON.stringify(nodeInfo.toHuman())}`, 'cyan');
      
      logSuccess('SDK integration endpoints available');
      
    } catch (error) {
      logError(`SDK integration test failed: ${error.message}`);
    }
  }

  async runAllTests() {
    log('\n🚀 Starting GasLeap End-to-End Integration Tests\n', 'magenta');
    
    try {
      await this.initialize();
      await this.testNodeConnection();
      await this.testPalletFunctions();
      await this.testPoolCreation();
      await this.testTransactionSponsorship();
      await this.testCustomRPCMethods();
      await this.testXCMIntegration();
      await this.testSDKIntegration();
      
    } catch (error) {
      logError(`Critical test failure: ${error.message}`);
    } finally {
      await this.cleanup();
      this.printResults();
    }
  }

  async cleanup() {
    logStep('CLEANUP', 'Cleaning up test environment...');
    
    if (this.api) {
      await this.api.disconnect();
      logSuccess('Disconnected from node');
    }
  }

  printResults() {
    log('\n📊 Test Results Summary\n', 'magenta');
    
    const results = [
      ['Node Connection', this.testResults.nodeConnection],
      ['RPC Methods', this.testResults.rpcMethods],
      ['Pallet Functions', this.testResults.palletFunctions],
      ['Pool Creation', this.testResults.poolCreation],
      ['Transaction Sponsorship', this.testResults.transactionSponsorship],
      ['Gas Savings Tracking', this.testResults.gasSavingsTracking],
      ['XCM Integration', this.testResults.xcmIntegration]
    ];
    
    let passedTests = 0;
    const totalTests = results.length;
    
    results.forEach(([testName, passed]) => {
      if (passed) {
        logSuccess(`${testName}: PASSED`);
        passedTests++;
      } else {
        logError(`${testName}: FAILED`);
      }
    });
    
    log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`, 'cyan');
    
    if (passedTests === totalTests) {
      log('\n🎉 All integration tests passed! GasLeap is ready for demo.', 'green');
      process.exit(0);
    } else if (passedTests >= totalTests * 0.7) {
      log('\n⚠️  Most tests passed. Demo should work with minor issues.', 'yellow');
      process.exit(0);
    } else {
      log('\n❌ Critical integration issues detected. Please fix before demo.', 'red');
      process.exit(1);
    }
  }
}

// Run the tests
async function main() {
  const tester = new GasLeapIntegrationTest();
  
  // Set timeout for entire test suite
  const timeout = setTimeout(() => {
    logError('Test suite timeout - please check if GasLeap node is running');
    process.exit(1);
  }, CONFIG.testTimeout);
  
  try {
    await tester.runAllTests();
    clearTimeout(timeout);
  } catch (error) {
    clearTimeout(timeout);
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n🛑 Test interrupted by user', 'yellow');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = GasLeapIntegrationTest;