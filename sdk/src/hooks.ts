/**
 * React hooks for GasLeap SDK integration
 */

import { useState, useEffect, useCallback } from 'react';
import { GasLeapSDK } from './sdk';
import { GasLeapDemoSDK } from './demo-sdk';
import { 
  UseGasLeapResult, 
  UseSponsoredTransactionResult, 
  UseGasSavingsResult,
  GasLeapConfig,
  SponsorParams,
  TransactionResult,
  TransactionStatus,
  GasSavingsInfo,
  GasLeapError 
} from './types';

/**
 * Main hook for GasLeap SDK integration
 */
export function useGasLeap(config?: GasLeapConfig): UseGasLeapResult {
  const [sdk, setSdk] = useState<GasLeapSDK | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GasLeapError | null>(null);

  const connect = useCallback(async () => {
    if (!config) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const gasLeapSDK = new GasLeapSDK(config);
      await gasLeapSDK.initialize();
      
      const accounts = await gasLeapSDK.connectWallet();
      
      setSdk(gasLeapSDK);
      setAccount(accounts[0]);
      setIsConnected(true);
    } catch (err) {
      setError(err as GasLeapError);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const disconnect = useCallback(async () => {
    if (sdk) {
      await sdk.disconnect();
      setSdk(null);
      setAccount(null);
      setIsConnected(false);
    }
  }, [sdk]);

  return {
    sdk,
    isConnected,
    account,
    connect,
    disconnect,
    isLoading,
    error,
  };
}

/**
 * Hook for sponsored transactions
 */
export function useSponsoredTransaction(): UseSponsoredTransactionResult {
  const [status, setStatus] = useState<TransactionStatus | null>(null);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GasLeapError | null>(null);

  const sponsorTransaction = useCallback(async (params: SponsorParams): Promise<TransactionResult> => {
    setIsLoading(true);
    setError(null);
    setStatus('Pending' as TransactionStatus);

    try {
      // Use demo SDK for simplified demo flow
      const demoResult = await GasLeapDemoSDK.quickSponsor(
        params.targetChain,
        params.callData,
        params.poolId
      );

      const transactionResult: TransactionResult = {
        transactionId: Math.random().toString(),
        txHash: demoResult.txHash,
        gasCost: demoResult.gasSaved.toString(),
        status: demoResult.success ? 'Executed' as TransactionStatus : 'Failed' as TransactionStatus,
      };

      setResult(transactionResult);
      setStatus(transactionResult.status);
      
      return transactionResult;
    } catch (err) {
      const gasLeapError = err as GasLeapError;
      setError(gasLeapError);
      setStatus('Failed' as TransactionStatus);
      throw gasLeapError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sponsorTransaction,
    status,
    result,
    isLoading,
    error,
  };
}

/**
 * Hook for gas savings with animated counter
 */
export function useGasSavings(): UseGasSavingsResult {
  const [savings, setSavings] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [savingsInfo, setSavingsInfo] = useState<GasSavingsInfo | null>(null);

  const refresh = useCallback(async () => {
    try {
      const demoSDK = GasLeapDemoSDK.getInstance();
      const newSavings = await demoSDK.getGasSavings();
      
      if (newSavings > savings) {
        setIsAnimating(true);
        
        // Animate counter upward
        const increment = (newSavings - savings) / 20;
        let current = savings;
        
        const animateStep = () => {
          current += increment;
          if (current >= newSavings) {
            setSavings(newSavings);
            setIsAnimating(false);
          } else {
            setSavings(Math.floor(current));
            requestAnimationFrame(animateStep);
          }
        };
        
        requestAnimationFrame(animateStep);
      } else {
        setSavings(newSavings);
      }

      // Mock savings info for demo
      setSavingsInfo({
        totalSaved: newSavings.toString(),
        transactionCount: Math.floor(newSavings / 20),
        dailySaved: Math.floor(newSavings * 0.3).toString(),
        averagePerTransaction: '20',
      });
    } catch (error) {
      console.error('Failed to refresh gas savings:', error);
    }
  }, [savings]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  return {
    savings,
    isAnimating,
    savingsInfo,
    refresh,
  };
}