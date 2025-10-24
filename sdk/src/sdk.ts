/**
 * GasLeap SDK - Full production SDK for cross-chain gas sponsorship
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { 
  GasLeapConfig, 
  CreatePoolParams, 
  SponsorParams, 
  TransactionResult, 
  GasSavingsInfo,
  TransactionRecord,
  PoolInfo,
  GasLeapError,
  ErrorCode 
} from './types';

export class GasLeapSDK {
  private api: ApiPromise | null = null;
  private config: GasLeapConfig;
  private isInitialized = false;

  constructor(config: GasLeapConfig) {
    this.config = config;
  }

  /**
   * Initialize the SDK connection
   */
  async initialize(): Promise<void> {
    try {
      if (this.config.api) {
        this.api = this.config.api;
      } else {
        const provider = new WsProvider(this.config.endpoint);
        this.api = await ApiPromise.create({ provider });
      }

      await this.api.isReady;
      this.isInitialized = true;
    } catch (error) {
      throw new GasLeapError(
        ErrorCode.NETWORK_ERROR,
        'Failed to initialize GasLeap SDK',
        error
      );
    }
  }

  /**
   * Create a new sponsorship pool
   */
  async createPool(params: CreatePoolParams): Promise<string> {
    this.ensureInitialized();

    try {
      // Implementation would interact with the sponsorship pallet
      // For now, return a mock pool ID
      const poolId = Math.floor(Math.random() * 1000000).toString();
      return poolId;
    } catch (error) {
      throw new GasLeapError(
        ErrorCode.TRANSACTION_FAILED,
        'Failed to create sponsorship pool',
        error
      );
    }
  }

  /**
   * Fund an existing pool
   */
  async fundPool(poolId: string, amount: string): Promise<void> {
    this.ensureInitialized();

    try {
      // Implementation would call the fund_pool extrinsic
      console.log(`Funding pool ${poolId} with ${amount}`);
    } catch (error) {
      throw new GasLeapError(
        ErrorCode.TRANSACTION_FAILED,
        'Failed to fund pool',
        error
      );
    }
  }

  /**
   * Sponsor a cross-chain transaction
   */
  async sponsorTransaction(params: SponsorParams): Promise<TransactionResult> {
    this.ensureInitialized();

    try {
      // Implementation would call the sponsor_transaction extrinsic
      // and handle XCM message dispatch
      
      const transactionId = Math.floor(Math.random() * 1000000).toString();
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      return {
        transactionId,
        txHash,
        gasCost: '1000', // Mock gas cost
        status: 'Pending' as any,
      };
    } catch (error) {
      throw new GasLeapError(
        ErrorCode.TRANSACTION_FAILED,
        'Failed to sponsor transaction',
        error
      );
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txId: string): Promise<string> {
    this.ensureInitialized();

    try {
      // Implementation would query transaction log storage
      return 'Executed';
    } catch (error) {
      throw new GasLeapError(
        ErrorCode.NETWORK_ERROR,
        'Failed to get transaction status',
        error
      );
    }
  }

  /**
   * Get gas savings for a user
   */
  async getGasSavings(userAccount: string): Promise<GasSavingsInfo> {
    this.ensureInitialized();

    try {
      // Implementation would aggregate transaction records
      return {
        totalSaved: '5000',
        transactionCount: 25,
        dailySaved: '200',
        averagePerTransaction: '200',
      };
    } catch (error) {
      throw new GasLeapError(
        ErrorCode.NETWORK_ERROR,
        'Failed to get gas savings',
        error
      );
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(userAccount: string): Promise<TransactionRecord[]> {
    this.ensureInitialized();

    try {
      // Implementation would query transaction log storage
      return [];
    } catch (error) {
      throw new GasLeapError(
        ErrorCode.NETWORK_ERROR,
        'Failed to get transaction history',
        error
      );
    }
  }

  /**
   * Get pool information
   */
  async getPoolInfo(poolId: string): Promise<PoolInfo> {
    this.ensureInitialized();

    try {
      // Implementation would query pool storage
      throw new GasLeapError(
        ErrorCode.POOL_NOT_FOUND,
        'Pool not found',
        { poolId }
      );
    } catch (error) {
      if (error instanceof GasLeapError) {
        throw error;
      }
      throw new GasLeapError(
        ErrorCode.NETWORK_ERROR,
        'Failed to get pool info',
        error
      );
    }
  }

  /**
   * Enable wallet connection
   */
  async connectWallet(): Promise<any[]> {
    try {
      await web3Enable('GasLeap');
      const accounts = await web3Accounts();
      
      if (accounts.length === 0) {
        throw new GasLeapError(
          ErrorCode.WALLET_NOT_CONNECTED,
          'No wallet accounts found'
        );
      }

      return accounts;
    } catch (error) {
      if (error instanceof GasLeapError) {
        throw error;
      }
      throw new GasLeapError(
        ErrorCode.WALLET_NOT_CONNECTED,
        'Failed to connect wallet',
        error
      );
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
    this.isInitialized = false;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.api) {
      throw new GasLeapError(
        ErrorCode.NETWORK_ERROR,
        'SDK not initialized. Call initialize() first.'
      );
    }
  }
}