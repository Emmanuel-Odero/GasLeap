import React, { createContext, useContext, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import './App.css';

// Mock context for demo purposes (simplified for build compatibility)
interface MockGasLeapContextType {
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

const MockGasLeapContext = createContext<MockGasLeapContextType | undefined>(undefined);

function MockGasLeapProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [savings, setSavings] = useState(1250);
  const [isAnimating, setIsAnimating] = useState(false);
  const [connectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connected');

  const contextValue: MockGasLeapContextType = {
    isConnected,
    account: { meta: { name: 'Demo Account' } },
    connect: async () => setIsConnected(true),
    disconnect: () => setIsConnected(false),
    isLoading: false,
    error: null,
    savings,
    isAnimating,
    savingsInfo: { transactionCount: 8 },
    refreshSavings: async () => {
      setIsAnimating(true);
      setSavings(prev => prev + Math.floor(Math.random() * 50) + 10);
      setTimeout(() => setIsAnimating(false), 600);
    },
    connectionStatus,
    demoMode: true,
  };

  return (
    <MockGasLeapContext.Provider value={contextValue}>
      {children}
    </MockGasLeapContext.Provider>
  );
}

function useMockGasLeapContext() {
  const context = useContext(MockGasLeapContext);
  if (context === undefined) {
    throw new Error('useMockGasLeapContext must be used within a MockGasLeapProvider');
  }
  return context;
}

// Mock sponsored transaction hook
function useMockSponsoredTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const sponsorTransaction = async (params: any) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    const mockResult = {
      transactionId: Math.random().toString(),
      txHash: '0x' + Math.random().toString(16).substr(2, 40),
      gasCost: (Math.random() * 50 + 10).toFixed(0),
      status: 'Executed',
    };

    setResult(mockResult);
    setIsLoading(false);
    return mockResult;
  };

  return { sponsorTransaction, isLoading, result, error };
}

// Styled components
const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const MainContent = styled.main`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Nav = styled.nav`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  color: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.8)'};
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
`;

const CounterContainer = styled.div<{ $isAnimating: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  ${props => props.$isAnimating && `
    animation: pulse 0.8s ease-out;
    border-color: rgba(74, 222, 128, 0.5);
  `}
`;

const CounterValue = styled.div<{ $isAnimating: boolean }>`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4ade80;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &::before {
    content: '💰';
    font-size: 1rem;
    margin-right: 0.25rem;
  }
`;

// Components
function GasSavingsCounter() {
  const { savings, isAnimating, savingsInfo } = useMockGasLeapContext();

  const formatSavings = (value: number): string => {
    if (value < 1000) {
      return value.toString();
    } else if (value < 1000000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return `${(value / 1000000).toFixed(1)}M`;
    }
  };

  return (
    <CounterContainer $isAnimating={isAnimating}>
      <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>
        Gas Saved
      </div>
      <CounterValue $isAnimating={isAnimating}>
        {formatSavings(savings)}
      </CounterValue>
      {savingsInfo && (
        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
          {savingsInfo.transactionCount} transactions
        </div>
      )}
    </CounterContainer>
  );
}

function Header() {
  const location = useLocation();
  const { isConnected, account, connect, disconnect } = useMockGasLeapContext();

  return (
    <HeaderContainer>
      <Logo>⚡ GasLeap</Logo>
      
      <Nav>
        <NavLink to="/" $active={location.pathname === '/'}>Home</NavLink>
        <NavLink to="/nft-mint" $active={location.pathname === '/nft-mint'}>NFT Mint Demo</NavLink>
        <NavLink to="/defi-liquidity" $active={location.pathname === '/defi-liquidity'}>DeFi Demo</NavLink>
      </Nav>

      <Nav>
        <GasSavingsCounter />
        {isConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>{account?.meta?.name || 'Connected'}</span>
            <button onClick={disconnect} style={{ 
              background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}>
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={connect} style={{ 
            background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '8px', 
            cursor: 'pointer' 
          }}>
            Connect Wallet
          </button>
        )}
      </Nav>
    </HeaderContainer>
  );
}

// Pages
function HomePage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Cross-Chain Gas Sponsorship</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', lineHeight: '1.6' }}>
        Experience seamless transactions across Polkadot parachains without holding native gas tokens. 
        GasLeap handles the complexity, you enjoy the simplicity.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        <Link to="/nft-mint" style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '2rem', 
          borderRadius: '16px', 
          textDecoration: 'none', 
          color: 'white',
          transition: 'transform 0.3s ease',
          display: 'block'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>NFT Minting Demo</h3>
          <p>Mint NFTs on Astar parachain with sponsored gas fees. No need to hold ASTR tokens!</p>
        </Link>

        <Link to="/defi-liquidity" style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '2rem', 
          borderRadius: '16px', 
          textDecoration: 'none', 
          color: 'white',
          transition: 'transform 0.3s ease',
          display: 'block'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💱</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>DeFi Liquidity Demo</h3>
          <p>Provide liquidity on Acala's DeFi protocols without ACA tokens. Seamless cross-chain DeFi!</p>
        </Link>
      </div>
    </div>
  );
}

function NFTMintPage() {
  const [nftName, setNftName] = useState('Polkadot Genesis NFT');
  const [nftDescription, setNftDescription] = useState('A commemorative NFT celebrating cross-chain interoperability');
  const { sponsorTransaction, isLoading, result, error } = useMockSponsoredTransaction();
  const { refreshSavings } = useMockGasLeapContext();

  const handleMint = async () => {
    if (!nftName.trim()) return;
    
    try {
      await sponsorTransaction({
        poolId: 'demo-pool-1',
        targetChain: '1000',
        callData: { name: nftName, description: nftDescription },
      });
      await refreshSavings();
    } catch (err) {
      console.error('Failed to mint NFT:', err);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2.5rem' }}>🎨 NFT Minting Demo</h1>
      
      <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
          <div style={{ fontSize: '2rem' }}>🌟</div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Astar Network</h3>
            <p style={{ margin: '0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
              Smart contract platform for Polkadot ecosystem
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>NFT Name *</label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
            <textarea
              value={nftDescription}
              onChange={(e) => setNftDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={handleMint}
            disabled={isLoading || !nftName.trim()}
            style={{
              background: result?.status === 'Executed' 
                ? 'linear-gradient(45deg, #4ade80, #22c55e)' 
                : 'linear-gradient(45deg, #4ade80, #22c55e)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              minWidth: '250px'
            }}
          >
            {isLoading 
              ? 'Minting with Sponsored Gas...' 
              : result?.status === 'Executed'
              ? '✅ NFT Minted Successfully!'
              : '🚀 Mint NFT (Gas Sponsored)'
            }
          </button>
        </div>

        {result && result.status === 'Executed' && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '12px', 
            marginTop: '1rem',
            background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(34, 197, 94, 0.1))',
            border: '2px solid rgba(74, 222, 128, 0.5)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>✅ NFT Minted Successfully! 🎉</h4>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>
              Your NFT has been created on Astar parachain with sponsored gas fees.
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Transaction Hash:</span>
                <span>{result.txHash.slice(0, 20)}...</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Gas Saved:</span>
                <span>{result.gasCost} units (~$0.05)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Network:</span>
                <span>Astar Parachain</span>
              </div>
            </div>
            <Link to="/defi-liquidity" style={{
              display: 'inline-block',
              background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
              color: 'white',
              textDecoration: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontWeight: '600',
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              Continue to DeFi Demo →
            </Link>
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '12px', 
            marginTop: '1rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
            border: '2px solid rgba(239, 68, 68, 0.5)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>❌ Minting Failed</h4>
            <p style={{ margin: '0', fontSize: '0.9rem' }}>{error.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DeFiLiquidityPage() {
  const [tokenA, setTokenA] = useState('ACA');
  const [tokenB, setTokenB] = useState('DOT');
  const [amountA, setAmountA] = useState('100');
  const [amountB, setAmountB] = useState('10');
  const { sponsorTransaction, isLoading, result, error } = useMockSponsoredTransaction();
  const { refreshSavings } = useMockGasLeapContext();

  const handleProvideLiquidity = async () => {
    if (!amountA || !amountB) return;
    
    try {
      await sponsorTransaction({
        poolId: 'demo-pool-1',
        targetChain: '2000',
        callData: { tokenA, tokenB, amountA, amountB },
      });
      await refreshSavings();
    } catch (err) {
      console.error('Failed to provide liquidity:', err);
    }
  };

  const isFormValid = amountA && amountB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2.5rem' }}>💱 DeFi Liquidity Demo</h1>
      
      <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
          <div style={{ fontSize: '2rem' }}>🔴</div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Acala Network</h3>
            <p style={{ margin: '0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
              DeFi hub of Polkadot with native stablecoin and liquid staking
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Token Pair</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
              <div>
                <select 
                  value={tokenA} 
                  onChange={(e) => setTokenA(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '1rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <option value="ACA" style={{ background: '#1a1a1a' }}>🔴 ACA</option>
                  <option value="aUSD" style={{ background: '#1a1a1a' }}>💵 aUSD</option>
                  <option value="LDOT" style={{ background: '#1a1a1a' }}>🟪 LDOT</option>
                </select>
                <input
                  type="number"
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ fontSize: '1.5rem', textAlign: 'center' }}>+</div>
              
              <div>
                <select 
                  value={tokenB} 
                  onChange={(e) => setTokenB(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '1rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <option value="DOT" style={{ background: '#1a1a1a' }}>🟣 DOT</option>
                  <option value="ACA" style={{ background: '#1a1a1a' }}>🔴 ACA</option>
                  <option value="aUSD" style={{ background: '#1a1a1a' }}>💵 aUSD</option>
                </select>
                <input
                  type="number"
                  value={amountB}
                  onChange={(e) => setAmountB(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          </div>

          {isFormValid && (
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Pool Share:</span>
                <span>~0.01%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>LP Tokens:</span>
                <span>{Math.sqrt(parseFloat(amountA) * parseFloat(amountB)).toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Estimated APY:</span>
                <span>12.5%</span>
              </div>
            </div>
          )}

          <button
            onClick={handleProvideLiquidity}
            disabled={isLoading || !isFormValid}
            style={{
              background: result?.status === 'Executed' 
                ? 'linear-gradient(45deg, #4ade80, #22c55e)' 
                : 'linear-gradient(45deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              minWidth: '280px'
            }}
          >
            {isLoading 
              ? 'Adding Liquidity with Sponsored Gas...' 
              : result?.status === 'Executed'
              ? '✅ Liquidity Added Successfully!'
              : '🚀 Provide Liquidity (Gas Sponsored)'
            }
          </button>
        </div>

        {result && result.status === 'Executed' && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '12px', 
            marginTop: '1rem',
            background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(34, 197, 94, 0.1))',
            border: '2px solid rgba(74, 222, 128, 0.5)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>✅ Liquidity Added Successfully! 🎉</h4>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>
              Your liquidity has been added to the {tokenA}/{tokenB} pool on Acala with sponsored gas fees.
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Transaction Hash:</span>
                <span>{result.txHash.slice(0, 20)}...</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Gas Saved:</span>
                <span>{result.gasCost} units (~$0.08)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Network:</span>
                <span>Acala Parachain</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pool:</span>
                <span>{tokenA}/{tokenB}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '12px', 
            marginTop: '1rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
            border: '2px solid rgba(239, 68, 68, 0.5)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>❌ Liquidity Provision Failed</h4>
            <p style={{ margin: '0', fontSize: '0.9rem' }}>{error.message}</p>
          </div>
        )}
      </div>

      {result && result.status === 'Executed' && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(74, 222, 128, 0.1)',
          border: '2px solid rgba(74, 222, 128, 0.3)',
          borderRadius: '16px',
          marginTop: '2rem'
        }}>
          <h2 style={{ color: '#4ade80', marginBottom: '1rem', fontSize: '1.8rem' }}>🎉 Demo Complete!</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            You've successfully completed the GasLeap cross-chain demo:
          </p>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            ✅ Minted an NFT on Astar with sponsored gas<br />
            ✅ Provided DeFi liquidity on Acala with sponsored gas<br />
            ✅ Saved gas fees across multiple parachains<br />
            ✅ Experienced seamless cross-chain interactions
          </p>
          <p style={{ fontWeight: 'bold' }}>
            Total gas saved: Check the counter in the header! 💰
          </p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <MockGasLeapProvider>
      <Router>
        <AppContainer>
          <Header />
          <MainContent>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/nft-mint" element={<NFTMintPage />} />
              <Route path="/defi-liquidity" element={<DeFiLiquidityPage />} />
            </Routes>
          </MainContent>
        </AppContainer>
      </Router>
    </MockGasLeapProvider>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);