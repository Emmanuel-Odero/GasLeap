/**
 * Core types for GasLeap SDK
 */

import { ApiPromise } from '@polkadot/api';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

// Core configuration types
export interface GasLeapConfig {
  /** WebSocket endpoint for GasLeap parachain */
  endpoint: string;
  /** Optional custom API instance */
  api?: ApiPromise;
  /** Enable demo mode with simplified flows */
  demoMode?: boolean;
}

export interface SimpleDappConfig {
  /** dApp name for display */
  name: string;
  /** Default pool ID to use for sponsorship */
  defaultPoolId: string;
  /** Supported target chains */
  supportedChains: string[];
}

// Pool management types
export interface CreatePoolParams {
  /** Initial deposit amount */
  initialDeposit: string;
  /** Pool configuration */
  config: PoolConfig;
}

export interface PoolConfig {
  /** Maximum value per transaction */
  maxTransactionValue: string;
  /** Daily spending limit */
  dailySpendingLimit: string;
  /** List of allowed parachain IDs */
  allowedChains: number[];
  /** Whether authorization is required */
  authorizationRequired: boolean;
}

export interface PoolInfo {
  /** Pool owner account */
  owner: string;
  /** Current pool balance */
  balance: string;
  /** Total amount spent */
  totalSpent: string;
  /** Block number when created */
  createdAt: number;
  /** Pool configuration */
  config: PoolConfig;
  /** Current pool status */
  status: PoolStatus;
}

export enum PoolStatus {
  Active = 'Active',
  Paused = 'Paused',
  Closed = 'Closed'
}

// Transaction types
export interface SponsorParams {
  /** Pool ID to use for sponsorship */
  poolId: string;
  /** Target parachain ID */
  targetChain: string;
  /** Call data to execute */
  callData: any;
  /** User account performing the transaction */
  userAccount?: string;
}

export interface TransactionResult {
  /** Unique transaction ID */
  transactionId: string;
  /** Transaction hash */
  txHash: string;
  /** Estimated gas cost */
  gasCost: string;
  /** Current transaction status */
  status: TransactionStatus;
}

export enum TransactionStatus {
  Pending = 'Pending',
  Dispatched = 'Dispatched',
  Executed = 'Executed',
  Failed = 'Failed',
  Refunded = 'Refunded'
}

export interface TransactionRecord {
  /** Transaction ID */
  id: string;
  /** Pool ID used */
  poolId: string;
  /** User account */
  user: string;
  /** Target parachain */
  targetChain: number;
  /** Call hash */
  callHash: string;
  /** Gas cost */
  gasCost: string;
  /** Transaction status */
  status: TransactionStatus;
  /** Timestamp */
  timestamp: number;
}

// Gas savings tracking
export interface GasSavingsInfo {
  /** Total gas saved in native tokens */
  totalSaved: string;
  /** Number of sponsored transactions */
  transactionCount: number;
  /** Gas saved today */
  dailySaved: string;
  /** Average gas saved per transaction */
  averagePerTransaction: string;
}

// Demo-specific types
export interface QuickSponsorResult {
  /** Whether sponsorship was successful */
  success: boolean;
  /** Transaction hash */
  txHash: string;
  /** Amount of gas saved */
  gasSaved: number;
  /** Error message if failed */
  error?: string;
}

// Wallet integration types
export interface WalletConnection {
  /** Connected account */
  account: InjectedAccountWithMeta;
  /** Wallet extension name */
  walletName: string;
  /** Whether wallet is connected */
  isConnected: boolean;
}

// Error types
export enum ErrorCode {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  CHAIN_NOT_SUPPORTED = 'CHAIN_NOT_SUPPORTED'
}

export class GasLeapError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GasLeapError';
  }
}

// Event types for real-time updates
export interface GasLeapEvent {
  /** Event type */
  type: 'transaction_sponsored' | 'pool_funded' | 'gas_savings_updated';
  /** Event data */
  data: any;
  /** Timestamp */
  timestamp: number;
}

// React hook types (optional)
export interface UseGasLeapResult {
  /** SDK instance */
  sdk: any;
  /** Connection status */
  isConnected: boolean;
  /** Current account */
  account: InjectedAccountWithMeta | null;
  /** Connect wallet function */
  connect: () => Promise<void>;
  /** Disconnect wallet function */
  disconnect: () => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: GasLeapError | null;
}

export interface UseSponsoredTransactionResult {
  /** Sponsor transaction function */
  sponsorTransaction: (params: SponsorParams) => Promise<TransactionResult>;
  /** Current transaction status */
  status: TransactionStatus | null;
  /** Transaction result */
  result: TransactionResult | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: GasLeapError | null;
}

export interface UseGasSavingsResult {
  /** Current gas savings */
  savings: number;
  /** Whether counter is animating */
  isAnimating: boolean;
  /** Gas savings info */
  savingsInfo: GasSavingsInfo | null;
  /** Refresh savings data */
  refresh: () => Promise<void>;
}