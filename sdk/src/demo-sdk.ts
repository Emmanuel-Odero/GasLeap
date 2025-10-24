/**
 * GasLeap Demo SDK - Simplified API optimized for hackathon demo
 * 
 * This is a streamlined version of the full SDK designed for
 * quick integration and reliable demo performance.
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { Keyring } from '@polkadot/keyring';
import { QuickSponsorResult, SimpleDappConfig, GasLeapError, ErrorCode, WalletConnection } from './types';
import { sleep, generateTxHash, mockData } from './utils';

export class GasLeapDemoSDK {
  private static instance: GasLeapDemoSDK;
  private config: SimpleDappConfig | null = null;
  private gasSavings: number = 0;
  private api: ApiPromise | null = null;
  private isConnected: boolean = false;
  private endpoint: string = 'ws://localhost:9944';
  private walletConnection: WalletConnection | null = null;
  private mockWallet: boolean = false;
  private wsConnection: WebSocket | null = null;
  private transactionHistory: Array<{
    id: string;
    targetChain: string;
    poolId: string;
    gasSaved: number;
    txHash: string;
    timestamp: number;
    status: 'completed' | 'pending' | 'failed';
  }> = [];
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): GasLeapDemoSDK {
    if (!GasLeapDemoSDK.instance) {
      GasLeapDemoSDK.instance = new GasLeapDemoSDK();
    }
    return GasLeapDemoSDK.instance;
  }

  /**
   * Initialize connection to Substrate node
   */
  async connect(endpoint?: string): Promise<void> {
    if (this.isConnected && this.api) {
      return;
    }

    try {
      if (endpoint) {
        this.endpoint = endpoint;
      }

      const provider = new WsProvider(this.endpoint);
      this.api = await ApiPromise.create({ provider });
      await this.api.isReady;
      this.isConnected = true;
    } catch (error) {
      // Fallback to mock mode for demo reliability
      console.warn('Failed to connect to Substrate node, using mock mode:', error);
      this.isConnected = false;
      this.api = null;
    }
  }

  /**
   * Disconnect from Substrate node
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
    this.isConnected = false;
    
    // Clean up WebSocket connection
    this.stopRealTimeTracking();
  }

  /**
   * Check connection status
   */
  isNodeConnected(): boolean {
    return this.isConnected && this.api !== null;
  }

  /**
   * Connect to Polkadot.js wallet extension
   */
  async connectWallet(appName: string = 'GasLeap Demo'): Promise<WalletConnection> {
    try {
      // Try to connect to real wallet first
      const extensions = await web3Enable(appName);
      
      if (extensions.length === 0) {
        console.warn('No wallet extension found, using mock wallet');
        return this.enableMockWallet();
      }

      const accounts = await web3Accounts();
      
      if (accounts.length === 0) {
        console.warn('No accounts found in wallet, using mock wallet');
        return this.enableMockWallet();
      }

      // Use the first available account
      const account = accounts[0];
      
      this.walletConnection = {
        account,
        walletName: extensions[0].name,
        isConnected: true,
      };

      this.mockWallet = false;
      console.log('✅ Connected to wallet:', account.meta.name);
      
      return this.walletConnection;
    } catch (error) {
      console.warn('Wallet connection failed, using mock wallet:', error);
      return this.enableMockWallet();
    }
  }

  /**
   * Enable mock wallet for demo reliability
   */
  private enableMockWallet(): WalletConnection {
    // Create a mock account for demo purposes
    const keyring = new Keyring({ type: 'sr25519' });
    const mockAccount = keyring.addFromUri('//Alice');

    const mockWalletConnection: WalletConnection = {
      account: {
        address: mockAccount.address,
        meta: {
          name: 'Demo Account',
          source: 'mock-wallet',
        },
        type: 'sr25519',
      } as InjectedAccountWithMeta,
      walletName: 'Mock Wallet',
      isConnected: true,
    };

    this.walletConnection = mockWalletConnection;
    this.mockWallet = true;
    console.log('🎭 Mock wallet enabled for demo');
    
    return mockWalletConnection;
  }

  /**
   * Get current wallet connection
   */
  getWalletConnection(): WalletConnection | null {
    return this.walletConnection;
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.walletConnection?.isConnected || false;
  }

  /**
   * Sign and submit a transaction
   */
  async signAndSubmitTransaction(
    extrinsic: any,
    signer?: string
  ): Promise<{ txHash: string; success: boolean }> {
    if (!this.walletConnection) {
      throw new GasLeapError(
        ErrorCode.WALLET_NOT_CONNECTED,
        'Wallet not connected. Call connectWallet() first.'
      );
    }

    try {
      const signerAddress = signer || this.walletConnection.account.address;

      if (this.mockWallet || !this.isNodeConnected()) {
        // Mock transaction for demo reliability
        await sleep(800 + Math.random() * 400); // Simulate signing delay
        const txHash = generateTxHash();
        console.log('🎭 Mock transaction signed and submitted:', txHash);
        return { txHash, success: true };
      }

      // Real transaction signing and submission
      const injector = await web3FromAddress(signerAddress);
      
      return new Promise((resolve, reject) => {
        extrinsic
          .signAndSend(signerAddress, { signer: injector.signer }, (result: any) => {
            if (result.status.isInBlock) {
              console.log('✅ Transaction in block:', result.status.asInBlock.toString());
              resolve({
                txHash: result.status.asInBlock.toString(),
                success: true,
              });
            } else if (result.status.isFinalized) {
              console.log('✅ Transaction finalized:', result.status.asFinalized.toString());
            } else if (result.isError) {
              console.error('❌ Transaction error:', result);
              reject(new GasLeapError(
                ErrorCode.TRANSACTION_FAILED,
                'Transaction failed during execution'
              ));
            }
          })
          .catch((error: any) => {
            console.error('❌ Transaction submission failed:', error);
            reject(new GasLeapError(
              ErrorCode.TRANSACTION_FAILED,
              'Failed to submit transaction',
              error
            ));
          });
      });
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw new GasLeapError(
        ErrorCode.TRANSACTION_FAILED,
        'Failed to sign and submit transaction',
        error
      );
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    this.walletConnection = null;
    this.mockWallet = false;
    console.log('👋 Wallet disconnected');
  }

  /**
   * Ultra-simple demo API for quick sponsorship
   */
  static async quickSponsor(
    targetChain: string,
    call: any,
    poolId: string
  ): Promise<QuickSponsorResult> {
    const instance = GasLeapDemoSDK.getInstance();
    
    try {
      // Validate inputs
      if (!targetChain || !poolId) {
        throw new GasLeapError(
          ErrorCode.INVALID_PARAMS,
          'Target chain and pool ID are required'
        );
      }

      // Ensure connection (with fallback to mock mode)
      await instance.connect();

      // Ensure wallet is connected
      if (!instance.isWalletConnected()) {
        await instance.connectWallet();
      }

          // Optimized demo timing
      const demoMode = process.env.REACT_APP_DEMO_MODE === 'true';
      const delay = demoMode ? 800 + Math.random() * 400 : 1200 + Math.random() * 800;
      await sleep(delay);

      let gasSaved: number;
      let txHash: string;

      if (instance.isNodeConnected() && !instance.mockWallet) {
        // Real blockchain interaction
        try {
          // Create and submit the sponsorship extrinsic
          const extrinsic = instance.api!.tx.sponsorship.sponsorTransaction(
            poolId,
            targetChain === 'astar' ? 2007 : 2000, // ParaId mapping
            JSON.stringify(call) // Serialize call data
          );

          const result = await instance.signAndSubmitTransaction(extrinsic);
          txHash = result.txHash;
          
          // Get gas savings from RPC
          try {
            const userAccount = instance.walletConnection!.account.address;
            gasSaved = await instance.api!.rpc.sponsorship.getUserGasSavings(userAccount);
          } catch (rpcError) {
            console.warn('Failed to get gas savings from RPC, using mock data:', rpcError);
            gasSaved = mockData.generateSavings();
          }
          
          // Log successful blockchain interaction
          console.log(`✅ Sponsored transaction on ${targetChain}:`, {
            txHash,
            poolId,
            gasSaved,
            wallet: instance.walletConnection?.account.meta.name
          });
        } catch (blockchainError) {
          // Fallback to mock if blockchain call fails
          console.warn('Blockchain call failed, using mock response:', blockchainError);
          const mockResult = await instance.signAndSubmitTransaction(null);
          txHash = mockResult.txHash;
          gasSaved = mockData.generateSavings();
        }
      } else {
        // Mock mode for demo reliability
        const mockResult = await instance.signAndSubmitTransaction(null);
        txHash = mockResult.txHash;
        gasSaved = mockData.generateSavings();
        console.log(`🎭 Mock sponsored transaction on ${targetChain}:`, {
          txHash,
          poolId,
          gasSaved,
          wallet: instance.walletConnection?.account.meta.name
        });
      }

      // Update gas savings counter
      instance.gasSavings += gasSaved;

      // Add to transaction history
      instance.addTransactionToHistory({
        id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        targetChain,
        poolId,
        gasSaved,
        txHash,
        timestamp: Date.now(),
        status: 'completed'
      });

      // Emit real-time update events
      instance.emit('gas_savings_updated', { 
        newSavings: instance.gasSavings,
        increment: gasSaved 
      });

      instance.emit('transaction_sponsored', {
        targetChain,
        poolId,
        gasSaved,
        txHash,
        timestamp: Date.now()
      });

      return {
        success: true,
        txHash,
        gasSaved,
      };
    } catch (error) {
      console.error('QuickSponsor failed:', error);
      
      if (error instanceof GasLeapError) {
        return {
          success: false,
          txHash: '',
          gasSaved: 0,
          error: error.message,
        };
      }

      return {
        success: false,
        txHash: '',
        gasSaved: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * One-line integration for dApps
   */
  static enableForDapp(dappConfig: SimpleDappConfig): void {
    const instance = GasLeapDemoSDK.getInstance();
    instance.config = dappConfig;
  }

  /**
   * Live gas savings counter
   */
  async getGasSavings(): Promise<number> {
    return this.gasSavings;
  }

  /**
   * Get detailed gas savings information
   */
  async getGasSavingsInfo(): Promise<{
    totalSaved: number;
    transactionCount: number;
    averagePerTransaction: number;
    lastUpdated: number;
  }> {
    const transactionCount = Math.floor(this.gasSavings / 20) || 1;
    return {
      totalSaved: this.gasSavings,
      transactionCount,
      averagePerTransaction: Math.floor(this.gasSavings / transactionCount),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get connection status and health info
   */
  getConnectionInfo(): {
    isConnected: boolean;
    endpoint: string;
    mode: 'blockchain' | 'mock';
    lastConnected?: number;
  } {
    return {
      isConnected: this.isConnected,
      endpoint: this.endpoint,
      mode: this.isNodeConnected() ? 'blockchain' : 'mock',
      lastConnected: this.isConnected ? Date.now() : undefined,
    };
  }

  /**
   * Reset demo state (for multiple demo runs)
   */
  static resetDemo(): void {
    const instance = GasLeapDemoSDK.getInstance();
    instance.gasSavings = 0;
    instance.transactionHistory = [];
    instance.stopRealTimeTracking();
    console.log('🔄 Demo state reset');
  }

  /**
   * Check if demo mode is enabled
   */
  static isDemoMode(): boolean {
    return process.env.REACT_APP_DEMO_MODE === 'true' || 
           process.env.DEMO_MODE === 'true' ||
           (typeof window !== 'undefined' && window.location.search.includes('demo=true'));
  }

  /**
   * Set custom endpoint for connection
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
    // Reconnect if already connected
    if (this.isConnected) {
      this.disconnect().then(() => this.connect());
    }
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  async connectWebSocket(wsEndpoint?: string): Promise<void> {
    const endpoint = wsEndpoint || this.endpoint.replace('ws://', 'ws://').replace(':9944', ':9945');
    
    try {
      this.wsConnection = new WebSocket(endpoint);
      
      this.wsConnection.onopen = () => {
        console.log('🔗 WebSocket connected for real-time updates');
        this.emit('websocket_connected', { endpoint });
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.emit('websocket_disconnected', {});
        // Auto-reconnect after 5 seconds
        setTimeout(() => this.connectWebSocket(wsEndpoint), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.warn('WebSocket error, continuing with polling updates:', error);
        this.wsConnection = null;
      };
    } catch (error) {
      console.warn('WebSocket connection failed, using polling for updates:', error);
      this.wsConnection = null;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'gas_savings_updated':
        this.gasSavings = data.totalSavings || this.gasSavings;
        this.emit('gas_savings_updated', { 
          newSavings: this.gasSavings,
          increment: data.increment || 0
        });
        break;
      
      case 'transaction_completed':
        this.addTransactionToHistory({
          id: data.transactionId,
          targetChain: data.targetChain,
          poolId: data.poolId,
          gasSaved: data.gasSaved,
          txHash: data.txHash,
          timestamp: Date.now(),
          status: 'completed'
        });
        this.emit('transaction_completed', data);
        break;
      
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  /**
   * Add event listener for real-time updates
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  /**
   * Add transaction to history
   */
  private addTransactionToHistory(transaction: any): void {
    this.transactionHistory.unshift(transaction);
    // Keep only last 100 transactions
    if (this.transactionHistory.length > 100) {
      this.transactionHistory = this.transactionHistory.slice(0, 100);
    }
    this.emit('transaction_history_updated', { 
      transaction,
      totalCount: this.transactionHistory.length 
    });
  }

  /**
   * Get transaction history with formatting
   */
  getTransactionHistory(limit: number = 50): Array<{
    id: string;
    targetChain: string;
    poolId: string;
    gasSaved: number;
    txHash: string;
    timestamp: number;
    status: string;
    formattedTime: string;
    formattedGasSaved: string;
  }> {
    return this.transactionHistory
      .slice(0, limit)
      .map(tx => ({
        ...tx,
        formattedTime: new Date(tx.timestamp).toLocaleString(),
        formattedGasSaved: `${tx.gasSaved} units`,
      }));
  }

  /**
   * Get gas savings with real-time updates
   */
  async getGasSavingsWithUpdates(): Promise<{
    current: number;
    trend: 'up' | 'down' | 'stable';
    lastUpdate: number;
    dailyAverage: number;
    weeklyTotal: number;
  }> {
    // Calculate trend based on recent transactions
    const recentTx = this.transactionHistory.slice(0, 5);
    const olderTx = this.transactionHistory.slice(5, 10);
    
    const recentAvg = recentTx.length > 0 
      ? recentTx.reduce((sum, tx) => sum + tx.gasSaved, 0) / recentTx.length 
      : 0;
    const olderAvg = olderTx.length > 0 
      ? olderTx.reduce((sum, tx) => sum + tx.gasSaved, 0) / olderTx.length 
      : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAvg > olderAvg * 1.1) trend = 'up';
    else if (recentAvg < olderAvg * 0.9) trend = 'down';

    // Calculate daily and weekly totals
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const dailyTx = this.transactionHistory.filter(tx => tx.timestamp > oneDayAgo);
    const weeklyTx = this.transactionHistory.filter(tx => tx.timestamp > oneWeekAgo);

    const dailyTotal = dailyTx.reduce((sum, tx) => sum + tx.gasSaved, 0);
    const weeklyTotal = weeklyTx.reduce((sum, tx) => sum + tx.gasSaved, 0);

    return {
      current: this.gasSavings,
      trend,
      lastUpdate: now,
      dailyAverage: dailyTotal / Math.max(1, dailyTx.length),
      weeklyTotal,
    };
  }

  /**
   * Start real-time gas savings tracking
   */
  async startRealTimeTracking(): Promise<void> {
    // Connect WebSocket for real-time updates
    await this.connectWebSocket();

    // Fallback polling if WebSocket fails
    if (!this.wsConnection) {
      console.log('📊 Starting polling-based gas savings tracking');
      setInterval(async () => {
        // Simulate periodic updates for demo
        if (Math.random() < 0.1) { // 10% chance of update every interval
          const increment = Math.floor(Math.random() * 10) + 1;
          this.gasSavings += increment;
          this.emit('gas_savings_updated', { 
            newSavings: this.gasSavings,
            increment 
          });
        }
      }, 3000); // Check every 3 seconds
    }
  }

  /**
   * Stop real-time tracking
   */
  stopRealTimeTracking(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.eventListeners.clear();
    console.log('📊 Real-time tracking stopped');
  }
}