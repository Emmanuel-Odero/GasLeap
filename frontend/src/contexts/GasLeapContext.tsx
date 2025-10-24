import React, { createContext, useContext, ReactNode } from 'react';
import { useGasLeap, useGasSavings } from '@gasleap/sdk';

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
}

const GasLeapContext = createContext<GasLeapContextType | undefined>(undefined);

interface GasLeapProviderProps {
  children: ReactNode;
}

export function GasLeapProvider({ children }: GasLeapProviderProps) {
  const gasLeapHook = useGasLeap({
    endpoint: process.env.REACT_APP_GASLEAP_ENDPOINT || 'ws://localhost:9944',
    demoMode: true,
  });

  const savingsHook = useGasSavings();

  const contextValue: GasLeapContextType = {
    ...gasLeapHook,
    savings: savingsHook.savings,
    isAnimating: savingsHook.isAnimating,
    savingsInfo: savingsHook.savingsInfo,
    refreshSavings: savingsHook.refresh,
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