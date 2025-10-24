/**
 * GasLeap SDK - Cross-chain gas sponsorship for Polkadot ecosystem
 * 
 * This SDK provides a simple interface for dApps to integrate cross-chain
 * gas sponsorship functionality, allowing users to perform transactions
 * across parachains without holding native gas tokens.
 */

export { GasLeapSDK } from './sdk';
export { GasLeapDemoSDK } from './demo-sdk';
export * from './types';
export * from './utils';

// React hooks (optional)
export * from './hooks';

// Version
export const VERSION = '0.1.0';