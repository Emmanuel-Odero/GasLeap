/**
 * Utility functions for GasLeap SDK
 */

import { GasLeapError, ErrorCode } from './types';

/**
 * Format balance for display
 */
export function formatBalance(balance: string | number, decimals = 12): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  const divisor = Math.pow(10, decimals);
  const formatted = (num / divisor).toFixed(4);
  return parseFloat(formatted).toString();
}

/**
 * Format gas savings for display
 */
export function formatGasSavings(savings: number): string {
  if (savings < 1000) {
    return savings.toString();
  } else if (savings < 1000000) {
    return `${(savings / 1000).toFixed(1)}K`;
  } else {
    return `${(savings / 1000000).toFixed(1)}M`;
  }
}

/**
 * Validate parachain ID
 */
export function isValidParachainId(parachainId: string | number): boolean {
  const id = typeof parachainId === 'string' ? parseInt(parachainId) : parachainId;
  return !isNaN(id) && id > 0 && id < 4096; // Polkadot parachain ID range
}

/**
 * Validate account address
 */
export function isValidAccountAddress(address: string): boolean {
  // Basic validation for Substrate addresses
  return address.length >= 47 && address.length <= 48;
}

/**
 * Generate transaction hash (for demo purposes)
 */
export function generateTxHash(): string {
  return `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
}

/**
 * Sleep utility for demo delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw new GasLeapError(
    ErrorCode.NETWORK_ERROR,
    `Failed after ${maxAttempts} attempts`,
    lastError
  );
}

/**
 * Parse error from substrate
 */
export function parseSubstrateError(error: any): GasLeapError {
  if (error.isModule) {
    const decoded = error.registry.findMetaError(error.asModule);
    return new GasLeapError(
      ErrorCode.TRANSACTION_FAILED,
      `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`,
      error
    );
  }

  return new GasLeapError(
    ErrorCode.TRANSACTION_FAILED,
    error.toString(),
    error
  );
}

/**
 * Calculate gas savings percentage
 */
export function calculateSavingsPercentage(
  originalCost: number,
  sponsoredCost: number
): number {
  if (originalCost === 0) return 0;
  return Math.round(((originalCost - sponsoredCost) / originalCost) * 100);
}

/**
 * Format time duration
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Debounce utility
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if running in demo mode
 */
export function isDemoMode(): boolean {
  return process.env.REACT_APP_DEMO_MODE === 'true' || 
         process.env.DEMO_MODE === 'true' ||
         window.location.search.includes('demo=true');
}

/**
 * Get supported chains for demo
 */
export function getDemoChains(): Array<{ id: string; name: string; icon: string }> {
  return [
    { id: '1000', name: 'Astar', icon: '🌟' },
    { id: '2000', name: 'Acala', icon: '🔴' },
    { id: '2004', name: 'Moonbeam', icon: '🌙' },
    { id: '2006', name: 'Astar', icon: '⭐' },
  ];
}

/**
 * Mock data generators for demo
 */
export const mockData = {
  generatePoolId: () => `pool_${Math.floor(Math.random() * 1000)}`,
  
  generateTransactionId: () => `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  
  generateGasCost: () => Math.floor(Math.random() * 100) + 10,
  
  generateSavings: () => Math.floor(Math.random() * 50) + 5,
};