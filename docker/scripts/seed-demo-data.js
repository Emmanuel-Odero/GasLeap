#!/usr/bin/env node

// Demo Data Seeding Script using Polkadot.js API
// This script connects to the local chains and seeds demo data

const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');

// Configuration
const GASLEAP_ENDPOINT = process.env.GASLEAP_ENDPOINT || 'ws://localhost:9944';
const ASTAR_ENDPOINT = process.env.ASTAR_ENDPOINT || 'ws://localhost:9945';
const ACALA_ENDPOINT = process.env.ACALA_ENDPOINT || 'ws://localhost:9946';

// Demo accounts
const DEMO_ACCOUNTS = {
  alice: '//Alice',
  bob: '//Bob', 
  charlie: '//Charlie',
  demoUser: '//DemoUser',
  demoDapp: '//DemoDapp'
};

async function main() {
  console.log('🌱 Starting GasLeap demo data seeding...');
  
  // Wait for crypto to be ready
  await cryptoWaitReady();
  
  // Initialize keyring
  const keyring = new Keyring({ type: 'sr25519' });
  const accounts = {};
  
  // Create demo accounts
  for (const [name, seed] of Object.entries(DEMO_ACCOUNTS)) {
    accounts[name] = keyring.addFromUri(seed);
    console.log(`👤 Created account ${name}: ${accounts[name].address}`);
  }
  
  try {
    // Connect to GasLeap parachain
    console.log('🔗 Connecting to GasLeap parachain...');
    const gasleapProvider = new WsProvider(GASLEAP_ENDPOINT);
    const gasleapApi = await ApiPromise.create({ provider: gasleapProvider });
    
    // Seed GasLeap parachain data
    await seedGasLeapData(gasleapApi, accounts);
    
    // Connect to Astar (if available)
    try {
      console.log('⭐ Connecting to Astar local...');
      const astarProvider = new WsProvider(ASTAR_ENDPOINT);
      const astarApi = await ApiPromise.create({ provider: astarProvider });
      await seedAstarData(astarApi, accounts);
    } catch (error) {
      console.log('⚠️  Astar not available, using mock data');
      await createMockAstarData();
    }
    
    // Connect to Acala (if available)
    try {
      console.log('🏦 Connecting to Acala local...');
      const acalaProvider = new WsProvider(ACALA_ENDPOINT);
      const acalaApi = await ApiPromise.create({ provider: acalaProvider });
      await seedAcalaData(acalaApi, accounts);
    } catch (error) {
      console.log('⚠️  Acala not available, using mock data');
      await createMockAcalaData();
    }
    
    console.log('✅ Demo data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

async function seedGasLeapData(api, accounts) {
  console.log('💰 Seeding GasLeap sponsorship pools...');
  
  try {
    // Create NFT Minting Pool
    const createNftPool = api.tx.sponsorship.createPool(
      '100000000000000', // 100 GLAP initial deposit
      {
        maxTransactionValue: '10000000000000',
        dailySpendingLimit: '50000000000000',
        allowedChains: [2006], // Astar
        authorizationRequired: false
      }
    );
    
    await submitAndWait(api, createNftPool, accounts.alice, 'NFT Pool Creation');
    
    // Create DeFi Pool
    const createDefiPool = api.tx.sponsorship.createPool(
      '200000000000000', // 200 GLAP initial deposit
      {
        maxTransactionValue: '50000000000000',
        dailySpendingLimit: '100000000000000', 
        allowedChains: [2034], // Acala
        authorizationRequired: false
      }
    );
    
    await submitAndWait(api, createDefiPool, accounts.bob, 'DeFi Pool Creation');
    
    // Create Universal Pool
    const createUniversalPool = api.tx.sponsorship.createPool(
      '500000000000000', // 500 GLAP initial deposit
      {
        maxTransactionValue: '25000000000000',
        dailySpendingLimit: '200000000000000',
        allowedChains: [2006, 2034], // Both chains
        authorizationRequired: false
      }
    );
    
    await submitAndWait(api, createUniversalPool, accounts.charlie, 'Universal Pool Creation');
    
    // Authorize demo user for all pools
    const authorizations = [
      api.tx.sponsorship.addAuthorization(1, accounts.demoUser.address, '10000000000000'),
      api.tx.sponsorship.addAuthorization(2, accounts.demoUser.address, '50000000000000'),
      api.tx.sponsorship.addAuthorization(3, accounts.demoUser.address, '25000000000000')
    ];
    
    for (let i = 0; i < authorizations.length; i++) {
      const poolOwner = [accounts.alice, accounts.bob, accounts.charlie][i];
      await submitAndWait(api, authorizations[i], poolOwner, `Authorization for Pool ${i + 1}`);
    }
    
  } catch (error) {
    console.log('⚠️  Using mock GasLeap data due to:', error.message);
    await createMockGasLeapData();
  }
}

async function seedAstarData(api, accounts) {
  console.log('🎨 Seeding Astar NFT data...');
  
  try {
    // Create NFT collection
    const createCollection = api.tx.uniques.create(0, accounts.alice.address);
    await submitAndWait(api, createCollection, accounts.alice, 'NFT Collection Creation');
    
    // Set collection metadata
    const setCollectionMetadata = api.tx.uniques.setCollectionMetadata(
      0,
      'GasLeap Demo NFTs',
      false
    );
    await submitAndWait(api, setCollectionMetadata, accounts.alice, 'Collection Metadata');
    
    // Pre-mint some demo NFTs
    for (let i = 1; i <= 3; i++) {
      const mintNft = api.tx.uniques.mint(0, i, accounts.alice.address);
      await submitAndWait(api, mintNft, accounts.alice, `NFT ${i} Minting`);
      
      const setMetadata = api.tx.uniques.setMetadata(
        0,
        i,
        `GasLeap Demo NFT #${i}`,
        false
      );
      await submitAndWait(api, setMetadata, accounts.alice, `NFT ${i} Metadata`);
    }
    
  } catch (error) {
    console.log('⚠️  Using mock Astar data due to:', error.message);
    await createMockAstarData();
  }
}

async function seedAcalaData(api, accounts) {
  console.log('🏦 Seeding Acala DeFi data...');
  
  try {
    // Create liquidity pools (if DEX pallet is available)
    const addLiquidity = api.tx.dex.addLiquidity(
      { Token: 'ACA' },
      { Token: 'AUSD' },
      '1000000000000000',
      '1000000000000000',
      '0',
      false
    );
    
    await submitAndWait(api, addLiquidity, accounts.alice, 'Initial Liquidity Pool');
    
  } catch (error) {
    console.log('⚠️  Using mock Acala data due to:', error.message);
    await createMockAcalaData();
  }
}

async function createMockGasLeapData() {
  const mockData = {
    pools: [
      {
        id: 1,
        owner: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        balance: '100000000000000',
        name: 'NFT Minting Pool',
        allowedChains: [2006]
      },
      {
        id: 2,
        owner: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        balance: '200000000000000',
        name: 'DeFi Pool',
        allowedChains: [2034]
      },
      {
        id: 3,
        owner: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
        balance: '500000000000000',
        name: 'Universal Pool',
        allowedChains: [2006, 2034]
      }
    ]
  };
  
  require('fs').writeFileSync('/data/mock-gasleap-data.json', JSON.stringify(mockData, null, 2));
  console.log('📁 Created mock GasLeap data');
}

async function createMockAstarData() {
  const mockData = {
    nfts: [
      {
        collectionId: 0,
        itemId: 1,
        name: 'GasLeap Demo NFT #1',
        owner: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      },
      {
        collectionId: 0,
        itemId: 2,
        name: 'GasLeap Demo NFT #2',
        owner: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      }
    ]
  };
  
  require('fs').writeFileSync('/data/mock-astar-data.json', JSON.stringify(mockData, null, 2));
  console.log('📁 Created mock Astar data');
}

async function createMockAcalaData() {
  const mockData = {
    liquidityPools: [
      {
        poolId: 1,
        tokenA: 'ACA',
        tokenB: 'AUSD',
        reserveA: '1000000000000000',
        reserveB: '1000000000000000'
      }
    ]
  };
  
  require('fs').writeFileSync('/data/mock-acala-data.json', JSON.stringify(mockData, null, 2));
  console.log('📁 Created mock Acala data');
}

async function submitAndWait(api, tx, signer, description) {
  return new Promise((resolve, reject) => {
    console.log(`📤 Submitting: ${description}`);
    
    tx.signAndSend(signer, ({ status, events }) => {
      if (status.isInBlock) {
        console.log(`✅ ${description} included in block`);
        resolve();
      } else if (status.isFinalized) {
        console.log(`🎯 ${description} finalized`);
        resolve();
      } else if (status.isError) {
        console.error(`❌ ${description} failed`);
        reject(new Error(`Transaction failed: ${description}`));
      }
    }).catch(reject);
  });
}

// Run the seeding script
main().catch(console.error);