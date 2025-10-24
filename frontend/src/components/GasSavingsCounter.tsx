import React from 'react';
import styled from 'styled-components';
import { useGasLeapContext } from '../contexts/GasLeapContext';

const CounterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const CounterLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CounterValue = styled.div<{ $isAnimating: boolean }>`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4ade80;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  animation: ${props => props.$isAnimating ? 'pulse 0.6s ease-out' : 'none'};
  
  &::before {
    content: '💰';
    font-size: 1rem;
  }
`;

const CounterSubtext = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
`;

function GasSavingsCounter() {
  const { savings, isAnimating, savingsInfo } = useGasLeapContext();

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
    <CounterContainer>
      <CounterLabel>Gas Saved</CounterLabel>
      <CounterValue $isAnimating={isAnimating}>
        {formatSavings(savings)}
      </CounterValue>
      {savingsInfo && (
        <CounterSubtext>
          {savingsInfo.transactionCount} transactions
        </CounterSubtext>
      )}
    </CounterContainer>
  );
}

export default GasSavingsCounter;