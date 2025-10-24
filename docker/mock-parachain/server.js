const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const HTTP_PORT = 9933;
const WS_PORT = 9944;

app.use(cors());
app.use(express.json());

// Mock blockchain state
let blockNumber = 1000;
let transactions = [];
let pools = new Map();

// Initialize demo pools
pools.set('demo-pool-1', {
  id: 'demo-pool-1',
  owner: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  balance: '1000000000000000', // 1M units
  totalSpent: '250000000000000', // 250K units
  config: {
    maxTransactionValue: '100000000000000',
    dailySpendingLimit: '500000000000000',
    allowedChains: [1000, 2000],
    authorizationRequired: false
  }
});

// Mock RPC methods
const rpcMethods = {
  // System methods
  'system_name': () => 'GasLeap Mock Parachain',
  'system_version': () => '1.0.0-mock',
  'system_chain': () => process.env.CHAIN_NAME || 'MockChain',
  'system_health': () => ({ peers: 3, isSyncing: false, shouldHavePeers: true }),
  
  // Chain methods
  'chain_getBlock': () => ({
    block: {
      header: {
        number: `0x${blockNumber.toString(16)}`,
        parentHash: '0x' + '0'.repeat(64),
        stateRoot: '0x' + '1'.repeat(64),
        extrinsicsRoot: '0x' + '2'.repeat(64),
        digest: { logs: [] }
      },
      extrinsics: []
    }
  }),
  
  'chain_getBlockHash': (params) => {
    const num = params && params[0] ? parseInt(params[0], 16) : blockNumber;
    return '0x' + num.toString(16).padStart(64, '0');
  },
  
  // Sponsorship pallet methods
  'sponsorship_pools': (params) => {
    const poolId = params && params[0];
    if (poolId && pools.has(poolId)) {
      return pools.get(poolId);
    }
    return null;
  },
  
  'sponsorship_createPool': (params) => {
    const poolId = `pool_${Date.now()}`;
    const pool = {
      id: poolId,
      owner: params[0] || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      balance: params[1] || '1000000000000000',
      totalSpent: '0',
      config: params[2] || {
        maxTransactionValue: '100000000000000',
        dailySpendingLimit: '500000000000000',
        allowedChains: [1000, 2000],
        authorizationRequired: false
      }
    };
    pools.set(poolId, pool);
    return { poolId, txHash: '0x' + uuidv4().replace(/-/g, '') };
  },
  
  'sponsorship_sponsorTransaction': (params) => {
    const [poolId, targetChain, callData] = params;
    const txId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const txHash = '0x' + uuidv4().replace(/-/g, '');
    const gasCost = Math.floor(Math.random() * 100) + 50; // 50-150 units
    
    const transaction = {
      id: txId,
      poolId,
      targetChain,
      callData,
      gasCost,
      status: 'executed',
      txHash,
      blockNumber: blockNumber++,
      timestamp: Date.now()
    };
    
    transactions.push(transaction);
    
    // Update pool balance
    if (pools.has(poolId)) {
      const pool = pools.get(poolId);
      pool.balance = (BigInt(pool.balance) - BigInt(gasCost)).toString();
      pool.totalSpent = (BigInt(pool.totalSpent) + BigInt(gasCost)).toString();
    }
    
    return { transactionId: txId, txHash, gasCost, status: 'executed' };
  },
  
  // State queries
  'state_getStorage': (params) => {
    // Mock storage responses
    return '0x' + Math.random().toString(16).substr(2, 32);
  },
  
  'state_call': (params) => {
    // Mock runtime calls
    return '0x' + Math.random().toString(16).substr(2, 64);
  }
};

// HTTP RPC endpoint
app.post('/', (req, res) => {
  const { id, method, params } = req.body;
  
  console.log(`RPC Call: ${method}`, params);
  
  if (rpcMethods[method]) {
    try {
      const result = rpcMethods[method](params);
      res.json({ jsonrpc: '2.0', id, result });
    } catch (error) {
      res.json({ 
        jsonrpc: '2.0', 
        id, 
        error: { code: -32603, message: error.message } 
      });
    }
  } else {
    res.json({ 
      jsonrpc: '2.0', 
      id, 
      error: { code: -32601, message: `Method not found: ${method}` } 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    chain: process.env.CHAIN_NAME || 'MockChain',
    blockNumber,
    pools: pools.size,
    transactions: transactions.length
  });
});

// WebSocket server for subscriptions
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const request = JSON.parse(message);
      const { id, method, params } = request;
      
      console.log(`WS RPC Call: ${method}`, params);
      
      if (method === 'chain_subscribeNewHeads') {
        // Send initial head
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: 'subscription_id_' + Math.random().toString(36).substr(2, 9)
        }));
        
        // Send periodic new heads
        const interval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            blockNumber++;
            ws.send(JSON.stringify({
              jsonrpc: '2.0',
              method: 'chain_newHead',
              params: {
                subscription: 'subscription_id',
                result: {
                  number: `0x${blockNumber.toString(16)}`,
                  parentHash: '0x' + (blockNumber - 1).toString(16).padStart(64, '0'),
                  stateRoot: '0x' + Math.random().toString(16).substr(2, 64),
                  extrinsicsRoot: '0x' + Math.random().toString(16).substr(2, 64),
                  digest: { logs: [] }
                }
              }
            }));
          } else {
            clearInterval(interval);
          }
        }, 6000); // New block every 6 seconds
        
      } else if (rpcMethods[method]) {
        const result = rpcMethods[method](params);
        ws.send(JSON.stringify({ jsonrpc: '2.0', id, result }));
      } else {
        ws.send(JSON.stringify({ 
          jsonrpc: '2.0', 
          id, 
          error: { code: -32601, message: `Method not found: ${method}` } 
        }));
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ 
        jsonrpc: '2.0', 
        id: null, 
        error: { code: -32700, message: 'Parse error' } 
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Start HTTP server
app.listen(HTTP_PORT, () => {
  console.log(`Mock Parachain HTTP RPC server running on port ${HTTP_PORT}`);
  console.log(`Mock Parachain WebSocket server running on port ${WS_PORT}`);
  console.log(`Chain: ${process.env.CHAIN_NAME || 'MockChain'}`);
  console.log(`Mock mode: ${process.env.MOCK_MODE || 'true'}`);
});