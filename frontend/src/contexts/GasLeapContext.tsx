import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { GasLeapDemoSDK } from '@gasleap/sdk';

// Import hooks directly from the hooks file - using relative path that works in build
import { useGasLeap, useGasSavings } from '../../../sdk/dist/hooks';

interface GasLeapContextType {
  sdk: any;
  isConnected: boolean;
  account: any;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  error: any;
  savings: number;
  isAnimating: boolean;
  savingsInfo: any;
  refreshSavings: () => Promise<void>;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  demoMode: boolean;
}

const GasLeapContext = createContext<GasLeapContextType | undefined>(undefined);

interface GasLeapProviderProps {
  children: ReactNode;
}

export function GasLeapProvider({ children }: GasLeapProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [demoMode] = useState(true); // Always use demo mode for hackathon

  const gasLeapHook = useGasLeap({
    endpoint: process.env.REACT_APP_GASLEAP_ENDPOINT || 'ws://localhost:9944',
    demoMode: true,
  });

  const savingsHook = useGasSavings();

  // Initialize demo SDK and connection
  useEffect(() => {
    const initializeDemo = async () => {
      setConnectionStatus('connecting');
      try {
        const demoSDK = GasLeapDemoSDK.getInstance();
        
        // Try to connect to the node (with fallback to mock mode)
        await demoSDK.connect(process.env.REACT_APP_GASLEAP_ENDPOINT || 'ws://localhost:9944');
        
        // Connect wallet (with fallback to mock wallet)
        await demoSDK.connectWallet('GasLeap Demo');
        
        // Start real-time tracking
        await demoSDK.startRealTimeTracking();
        
        console.log('✅ Connected to GasLeap node:', {
          endpoint: process.env.REACT_APP_GASLEAP_ENDPOINT || 'ws://localhost:9944',
          nodeConnected: demoSDK.isNodeConnected(),
          walletConnected: demoSDK.isWalletConnected(),
        });
        
        setConnectionStatus('connected');
        console.log('✅ GasLeap demo initialized successfully');
      } catch (error) {
        console.warn('Demo initialization failed, using fallback mode:', error);
        setConnectionStatus('error');
        
        // Even in error state, we can still use mock functionality
        setTimeout(() => {
          setConnectionStatus('connected');
        }, 2000);
      }
    };

    initializeDemo();

    // Cleanup on unmount
    return () => {
      const demoSDK = GasLeapDemoSDK.getInstance();
      demoSDK.stopRealTimeTracking();
    };
  }, []);

  // Enhanced connect function that ensures demo SDK is ready
  const enhancedConnect = async () => {
    if (connectionStatus === 'connected') {
      return gasLeapHook.connect();
    }
    
    setConnectionStatus('connecting');
    try {
      const demoSDK = GasLeapDemoSDK.getInstance();
      await demoSDK.connectWallet('GasLeap Demo');
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('error');
      throw error;
    }
  };

  // Enhanced disconnect function
  const enhancedDisconnect = async () => {
    try {
      const demoSDK = GasLeapDemoSDK.getInstance();
      await demoSDK.disconnectWallet();
      setConnectionStatus('disconnected');
      if (gasLeapHook.disconnect) {
        gasLeapHook.disconnect();
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const contextValue: GasLeapContextType = {
    ...gasLeapHook,
    connect: enhancedConnect,
    disconnect: enhancedDisconnect,
    savings: savingsHook.savings,
    isAnimating: savingsHook.isAnimating,
    savingsInfo: savingsHook.savingsInfo,
    refreshSavings: savingsHook.refresh,
    connectionStatus,
    demoMode,
  };

  return (
    <GasLeapContext.Provider value={contextValue}>
      {children}
    </GasLeapContext.Provider>
  );
}

export function useGasLeapContext() {
  const context = useContext(GasLeapContext);
  if (context === undefined) {
    throw new Error('useGasLeapContext must be used within a GasLeapProvider');
  }
  return context;
}