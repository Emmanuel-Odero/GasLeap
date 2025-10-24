import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSponsoredTransaction } from '../../../sdk/dist/hooks';
import { useGasLeapContext } from '../contexts/GasLeapContext';

const PageContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageTitle = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
`;

const DemoCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ChainInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
`;

const ChainIcon = styled.div`
  font-size: 2rem;
`;

const ChainDetails = styled.div`
  flex: 1;
`;

const ChainName = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
`;

const ChainDescription = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const LiquidityForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`;

const TokenPairSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: center;
`;

const TokenInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TokenSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;

  option {
    background: #1a1a1a;
    color: white;
  }

  &:focus {
    outline: none;
    border-color: #4ade80;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
  }
`;

const AmountInput = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #4ade80;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
  }
`;

const SwapIcon = styled.div`
  font-size: 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
`;

const PoolInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
`;

const PoolInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const PoolInfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
`;

const PoolInfoValue = styled.span`
  color: white;
  font-weight: 500;
`;

const shimmerAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const successPulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
`;

const ProvideLiquidityButton = styled.button<{ $isLoading: boolean; $success: boolean }>`
  background: ${props => props.$success 
    ? 'linear-gradient(45deg, #4ade80, #22c55e)' 
    : 'linear-gradient(45deg, #f59e0b, #d97706)'};
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 280px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  ${props => props.$success && `
    animation: ${successPulse} 0.6s ease-out;
  `}

  ${props => props.$isLoading && `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      animation: ${shimmerAnimation} 1.5s infinite;
    }
  `}
`;

const slideIn = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  animation: ${slideIn} 0.3s ease-out;
  background: ${props => {
    switch (props.$type) {
      case 'success': return 'linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(34, 197, 94, 0.1))';
      case 'error': return 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))';
      default: return 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))';
    }
  }};
  border: 2px solid ${props => {
    switch (props.$type) {
      case 'success': return 'rgba(74, 222, 128, 0.5)';
      case 'error': return 'rgba(239, 68, 68, 0.5)';
      default: return 'rgba(59, 130, 246, 0.5)';
    }
  }};
  
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  
  &::before {
    content: ${props => {
      switch (props.$type) {
        case 'success': return '"✅"';
        case 'error': return '"❌"';
        default: return '"ℹ️"';
      }
    }};
    font-size: 1.2rem;
    flex-shrink: 0;
  }
`;

const StatusContent = styled.div`
  flex: 1;
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
    opacity: 0.9;
  }
`;

const TransactionDetails = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .label {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .value {
    color: white;
    font-weight: 500;
  }
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin: 1rem 0;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.$progress}%;
    background: linear-gradient(90deg, #f59e0b, #d97706);
    transition: width 0.3s ease;
    border-radius: 2px;
  }
`;

const LiquidityPreview = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(245, 158, 11, 0.5);
    background: rgba(245, 158, 11, 0.05);
  }
  
  .preview-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
    color: #f59e0b;
  }
  
  .preview-pair {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  
  .token {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
`;

const CompletionMessage = styled.div`
  text-align: center;
  padding: 2rem;
  background: rgba(74, 222, 128, 0.1);
  border: 2px solid rgba(74, 222, 128, 0.3);
  border-radius: 16px;
  margin-top: 2rem;
`;

const CompletionTitle = styled.h2`
  color: #4ade80;
  margin-bottom: 1rem;
  font-size: 1.8rem;
`;

const CompletionText = styled.p`
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 1rem;
`;

function DeFiLiquidityPage() {
  const [tokenA, setTokenA] = useState('ACA');
  const [tokenB, setTokenB] = useState('DOT');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [progress, setProgress] = useState(0);
  const [liquidityStage, setLiquidityStage] = useState<'idle' | 'preparing' | 'signing' | 'submitting' | 'confirming' | 'complete'>('idle');
  
  const { sponsorTransaction, isLoading, result, error } = useSponsoredTransaction();
  const { connectionStatus } = useGasLeapContext();

  // Demo data suggestions
  const demoSuggestions = [
    { tokenA: 'ACA', tokenB: 'DOT', amountA: '100', amountB: '10' },
    { tokenA: 'aUSD', tokenB: 'DOT', amountA: '500', amountB: '10' },
    { tokenA: 'LDOT', tokenB: 'ACA', amountA: '50', amountB: '200' }
  ];

  const [selectedDemo, setSelectedDemo] = useState(0);

  // Auto-fill demo data
  useEffect(() => {
    const demo = demoSuggestions[selectedDemo];
    setTokenA(demo.tokenA);
    setTokenB(demo.tokenB);
    setAmountA(demo.amountA);
    setAmountB(demo.amountB);
  }, [selectedDemo]);

  // Progress simulation during liquidity provision
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setLiquidityStage('preparing');
      
      const stages = [
        { stage: 'preparing', progress: 20, delay: 500 },
        { stage: 'signing', progress: 40, delay: 800 },
        { stage: 'submitting', progress: 70, delay: 1000 },
        { stage: 'confirming', progress: 90, delay: 800 },
        { stage: 'complete', progress: 100, delay: 500 }
      ];

      let currentStageIndex = 0;
      const progressTimer = () => {
        if (currentStageIndex < stages.length && isLoading) {
          const currentStage = stages[currentStageIndex];
          setLiquidityStage(currentStage.stage as any);
          setProgress(currentStage.progress);
          currentStageIndex++;
          
          if (currentStageIndex < stages.length) {
            setTimeout(progressTimer, currentStage.delay);
          }
        }
      };
      
      setTimeout(progressTimer, 200);
    } else {
      setLiquidityStage('idle');
      setProgress(0);
    }
  }, [isLoading]);

  const handleProvideLiquidity = async () => {
    if (!amountA || !amountB) return;

    try {
      await sponsorTransaction({
        poolId: 'demo-pool-1',
        targetChain: 'acala', // Acala parachain
        callData: {
          tokenA,
          tokenB,
          amountA,
          amountB,
        },
      });
    } catch (err) {
      console.error('Failed to provide liquidity:', err);
    }
  };

  const getStageMessage = () => {
    switch (liquidityStage) {
      case 'preparing': return 'Preparing liquidity transaction...';
      case 'signing': return 'Signing with wallet...';
      case 'submitting': return 'Submitting to Acala network...';
      case 'confirming': return 'Confirming on blockchain...';
      case 'complete': return 'Liquidity provided successfully!';
      default: return '';
    }
  };

  const getTokenEmoji = (token: string) => {
    switch (token) {
      case 'ACA': return '🔴';
      case 'DOT': return '🟣';
      case 'aUSD': return '💵';
      case 'LDOT': return '🟪';
      default: return '🪙';
    }
  };

  const isFormValid = amountA && amountB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0;

  return (
    <PageContainer>
      <PageTitle>💱 DeFi Liquidity Demo</PageTitle>
      
      <DemoCard>
        <ChainInfo>
          <ChainIcon>🔴</ChainIcon>
          <ChainDetails>
            <ChainName>Acala Network</ChainName>
            <ChainDescription>
              DeFi hub of Polkadot with native stablecoin and liquid staking
            </ChainDescription>
          </ChainDetails>
        </ChainInfo>

        <LiquidityForm>
          {/* Demo Data Selector */}
          <FormGroup>
            <Label>Quick Demo Options</Label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {demoSuggestions.map((demo, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedDemo(index)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: selectedDemo === index ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.3)',
                    background: selectedDemo === index ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {demo.tokenA}/{demo.tokenB}
                </button>
              ))}
            </div>
          </FormGroup>

          <FormGroup>
            <Label>Token Pair</Label>
            <TokenPairSelector>
              <TokenInput>
                <TokenSelect value={tokenA} onChange={(e) => setTokenA(e.target.value)}>
                  <option value="ACA">🔴 ACA</option>
                  <option value="aUSD">💵 aUSD</option>
                  <option value="LDOT">🟪 LDOT</option>
                </TokenSelect>
                <AmountInput
                  type="number"
                  placeholder="0.0"
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value)}
                />
              </TokenInput>
              
              <SwapIcon>+</SwapIcon>
              
              <TokenInput>
                <TokenSelect value={tokenB} onChange={(e) => setTokenB(e.target.value)}>
                  <option value="DOT">🟣 DOT</option>
                  <option value="ACA">🔴 ACA</option>
                  <option value="aUSD">💵 aUSD</option>
                </TokenSelect>
                <AmountInput
                  type="number"
                  placeholder="0.0"
                  value={amountB}
                  onChange={(e) => setAmountB(e.target.value)}
                />
              </TokenInput>
            </TokenPairSelector>
          </FormGroup>

          {/* Liquidity Preview */}
          {isFormValid && (
            <LiquidityPreview>
              <div className="preview-header">
                💱 Liquidity Pool Preview
              </div>
              <div className="preview-pair">
                <div className="token">
                  {getTokenEmoji(tokenA)} {amountA} {tokenA}
                </div>
                <span>+</span>
                <div className="token">
                  {getTokenEmoji(tokenB)} {amountB} {tokenB}
                </div>
              </div>
            </LiquidityPreview>
          )}

          {isFormValid && (
            <PoolInfo>
              <PoolInfoRow>
                <PoolInfoLabel>Pool Share:</PoolInfoLabel>
                <PoolInfoValue>~0.01%</PoolInfoValue>
              </PoolInfoRow>
              <PoolInfoRow>
                <PoolInfoLabel>LP Tokens:</PoolInfoLabel>
                <PoolInfoValue>{Math.sqrt(parseFloat(amountA) * parseFloat(amountB)).toFixed(4)}</PoolInfoValue>
              </PoolInfoRow>
              <PoolInfoRow>
                <PoolInfoLabel>Estimated APY:</PoolInfoLabel>
                <PoolInfoValue>12.5%</PoolInfoValue>
              </PoolInfoRow>
              <PoolInfoRow>
                <PoolInfoLabel>Daily Rewards:</PoolInfoLabel>
                <PoolInfoValue>~${(parseFloat(amountA) * parseFloat(amountB) * 0.000342).toFixed(2)}</PoolInfoValue>
              </PoolInfoRow>
            </PoolInfo>
          )}

          {/* Connection Status */}
          {connectionStatus !== 'connected' && (
            <StatusMessage $type="info">
              <StatusContent>
                <h4>Connecting to Network</h4>
                <p>Setting up connection to Acala parachain...</p>
              </StatusContent>
            </StatusMessage>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div>
              <ProgressBar $progress={progress} />
              <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                {getStageMessage()}
              </div>
            </div>
          )}

          <ProvideLiquidityButton
            onClick={handleProvideLiquidity}
            disabled={isLoading || !isFormValid || connectionStatus !== 'connected'}
            $isLoading={isLoading}
            $success={result?.status === 'Executed'}
          >
            {isLoading 
              ? `${getStageMessage()}` 
              : result?.status === 'Executed'
              ? '✅ Liquidity Added Successfully!'
              : '🚀 Provide Liquidity (Gas Sponsored)'
            }
          </ProvideLiquidityButton>
        </LiquidityForm>

        {result && result.status === 'Executed' && (
          <StatusMessage $type="success">
            <StatusContent>
              <h4>Liquidity Added Successfully! 🎉</h4>
              <p>Your liquidity has been added to the {tokenA}/{tokenB} pool on Acala with sponsored gas fees.</p>
              <TransactionDetails>
                <div className="detail-row">
                  <span className="label">Transaction Hash:</span>
                  <span className="value">{result.txHash.slice(0, 20)}...</span>
                </div>
                <div className="detail-row">
                  <span className="label">Gas Saved:</span>
                  <span className="value">{result.gasCost} units (~$0.08)</span>
                </div>
                <div className="detail-row">
                  <span className="label">Network:</span>
                  <span className="value">Acala Parachain</span>
                </div>
                <div className="detail-row">
                  <span className="label">Pool:</span>
                  <span className="value">{tokenA}/{tokenB}</span>
                </div>
                <div className="detail-row">
                  <span className="label">LP Tokens:</span>
                  <span className="value">{Math.sqrt(parseFloat(amountA) * parseFloat(amountB)).toFixed(4)}</span>
                </div>
              </TransactionDetails>
            </StatusContent>
          </StatusMessage>
        )}

        {error && (
          <StatusMessage $type="error">
            <StatusContent>
              <h4>Liquidity Provision Failed</h4>
              <p>{error.message}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                Don't worry! This is a demo environment. The transaction simulation helps showcase the gas sponsorship flow.
              </p>
            </StatusContent>
          </StatusMessage>
        )}

        {isLoading && (
          <StatusMessage $type="info">
            <StatusContent>
              <h4>Processing Transaction</h4>
              <p>Your sponsored transaction is being processed on Acala parachain...</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                No ACA tokens required - GasLeap is handling all gas fees seamlessly!
              </p>
            </StatusContent>
          </StatusMessage>
        )}
      </DemoCard>

      {result && result.status === 'Executed' && (
        <CompletionMessage>
          <CompletionTitle>🎉 Demo Complete!</CompletionTitle>
          <CompletionText>
            You've successfully completed the GasLeap cross-chain demo:
          </CompletionText>
          <CompletionText>
            ✅ Minted an NFT on Astar with sponsored gas<br />
            ✅ Provided DeFi liquidity on Acala with sponsored gas<br />
            ✅ Saved gas fees across multiple parachains<br />
            ✅ Experienced seamless cross-chain interactions
          </CompletionText>
          <CompletionText>
            <strong>Total gas saved: Check the counter in the header! 💰</strong>
          </CompletionText>
        </CompletionMessage>
      )}
    </PageContainer>
  );
}

export default DeFiLiquidityPage;