import React, { useState } from 'react';
import styled from 'styled-components';
import { useSponsoredTransaction } from '@gasleap/sdk';

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

const ProvideLiquidityButton = styled.button<{ $isLoading: boolean }>`
  background: linear-gradient(45deg, #f59e0b, #d97706);
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

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  ${props => props.$isLoading && `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      animation: shimmer 1.5s infinite;
    }
  `}
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  background: ${props => {
    switch (props.$type) {
      case 'success': return 'rgba(74, 222, 128, 0.2)';
      case 'error': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(59, 130, 246, 0.2)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$type) {
      case 'success': return 'rgba(74, 222, 128, 0.5)';
      case 'error': return 'rgba(239, 68, 68, 0.5)';
      default: return 'rgba(59, 130, 246, 0.5)';
    }
  }};
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
  const { sponsorTransaction, isLoading, result, error } = useSponsoredTransaction();

  const handleProvideLiquidity = async () => {
    if (!amountA || !amountB) return;

    try {
      await sponsorTransaction({
        poolId: 'demo-pool-1',
        targetChain: '2000', // Acala parachain ID
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
          <FormGroup>
            <Label>Token Pair</Label>
            <TokenPairSelector>
              <TokenInput>
                <TokenSelect value={tokenA} onChange={(e) => setTokenA(e.target.value)}>
                  <option value="ACA">ACA</option>
                  <option value="aUSD">aUSD</option>
                  <option value="LDOT">LDOT</option>
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
                  <option value="DOT">DOT</option>
                  <option value="ACA">ACA</option>
                  <option value="aUSD">aUSD</option>
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
            </PoolInfo>
          )}

          <ProvideLiquidityButton
            onClick={handleProvideLiquidity}
            disabled={isLoading || !isFormValid}
            $isLoading={isLoading}
          >
            {isLoading ? 'Adding Liquidity with Sponsored Gas...' : '🚀 Provide Liquidity (Gas Sponsored)'}
          </ProvideLiquidityButton>
        </LiquidityForm>

        {result && result.status === 'Executed' && (
          <StatusMessage $type="success">
            ✅ Liquidity provided successfully! Transaction: {result.txHash.slice(0, 10)}...
            <br />
            💰 Gas saved: {result.gasCost} units
          </StatusMessage>
        )}

        {error && (
          <StatusMessage $type="error">
            ❌ Failed to provide liquidity: {error.message}
          </StatusMessage>
        )}

        {isLoading && (
          <StatusMessage $type="info">
            ⏳ Processing your sponsored transaction on Acala...
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