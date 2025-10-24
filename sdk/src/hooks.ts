/**
 * React hooks for GasLeap SDK integration
 * Note: These hooks require React to be installed as a peer dependency
 */

// Conditional React import for environments where React is available
let React: any;
let useState: any;
let useEffect: any;
let useCallback: any;

try {
  React = require('react');
  useState = React.useState;
  useEffect = React.useEffect;
  useCallback = React.useCallback;
} catch (error) {
  // React not available - hooks will throw runtime errors if used
  const createMockHook = (name: string) => () => {
    throw new Error(`${name} requires React to be installed as a peer dependency`);
  };
  
  useState = createMockHook('useState');
  useEffect = createMockHook('useEffect');
  useCallback = createMockHook('useCallback');
}
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
 * Hook for gas savings with animated counter and real-time updates
 */
export function useGasSavings(): UseGasSavingsResult {
  const [savings, setSavings] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [savingsInfo, setSavingsInfo] = useState<GasSavingsInfo | null>(null);

  const animateToValue = useCallback((newValue: number) => {
    if (newValue > savings) {
      setIsAnimating(true);
      
      // Smooth animation to new value
      const increment = (newValue - savings) / 30; // 30 frames for smooth animation
      let current = savings;
      
      const animateStep = () => {
        current += increment;
        if (current >= newValue) {
          setSavings(newValue);
          setIsAnimating(false);
        } else {
          setSavings(Math.floor(current));
          requestAnimationFrame(animateStep);
        }
      };
      
      requestAnimationFrame(animateStep);
    } else {
      setSavings(newValue);
    }
  }, [savings]);

  const refresh = useCallback(async () => {
    try {
      const demoSDK = GasLeapDemoSDK.getInstance();
      const savingsData = await demoSDK.getGasSavingsWithUpdates();
      
      animateToValue(savingsData.current);

      // Update savings info with real-time data
      setSavingsInfo({
        totalSaved: savingsData.current.toString(),
        transactionCount: Math.floor(savingsData.current / savingsData.dailyAverage) || 1,
        dailySaved: Math.floor(savingsData.dailyAverage).toString(),
        averagePerTransaction: Math.floor(savingsData.dailyAverage).toString(),
      });
    } catch (error) {
      console.error('Failed to refresh gas savings:', error);
    }
  }, [animateToValue]);

  // Set up real-time event listeners
  useEffect(() => {
    const demoSDK = GasLeapDemoSDK.getInstance();
    
    // Start real-time tracking
    demoSDK.startRealTimeTracking();

    // Listen for real-time updates
    const handleGasSavingsUpdate = (data: { newSavings: number; increment: number }) => {
      animateToValue(data.newSavings);
    };

    demoSDK.on('gas_savings_updated', handleGasSavingsUpdate);

    // Initial load
    refresh();

    // Cleanup
    return () => {
      demoSDK.off('gas_savings_updated', handleGasSavingsUpdate);
    };
  }, [refresh, animateToValue]);

  // Fallback polling for reliability
  useEffect(() => {
    const interval = setInterval(refresh, 10000); // Every 10 seconds as fallback
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    savings,
    isAnimating,
    savingsInfo,
    refresh,
  };
}

/**
 * Hook for transaction history with real-time updates
 */
export function useTransactionHistory(limit: number = 20) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const demoSDK = GasLeapDemoSDK.getInstance();
      const history = demoSDK.getTransactionHistory(limit);
      setTransactions(history);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const demoSDK = GasLeapDemoSDK.getInstance();

    // Listen for new transactions
    const handleTransactionUpdate = () => {
      refresh();
    };

    demoSDK.on('transaction_history_updated', handleTransactionUpdate);
    demoSDK.on('transaction_sponsored', handleTransactionUpdate);

    // Initial load
    refresh();

    // Cleanup
    return () => {
      demoSDK.off('transaction_history_updated', handleTransactionUpdate);
      demoSDK.off('transaction_sponsored', handleTransactionUpdate);
    };
  }, [refresh]);

  return {
    transactions,
    isLoading,
    refresh,
  };
}