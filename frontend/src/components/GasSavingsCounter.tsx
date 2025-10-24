import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGasLeapContext } from '../contexts/GasLeapContext';

const pulseGlow = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(74, 222, 128, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
  }
`;

const countUpAnimation = keyframes`
  0% {
    transform: translateY(20px) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translateY(-5px) scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
`;

// Optimized animation duration for demo mode
const getAnimationDuration = () => {
  const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';
  return isDemoMode ? '0.8s' : '1.5s';
};

const sparkle = keyframes`
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(0) rotate(360deg);
    opacity: 0;
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
  position: relative;
  transition: all 0.3s ease;
  
  ${props => props.$isAnimating && `
    animation: ${pulseGlow} 0.8s ease-out;
    border-color: rgba(74, 222, 128, 0.5);
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(74, 222, 128, 0.2);
  }
`;

const CounterLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;

const CounterValue = styled.div<{ $isAnimating: boolean }>`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4ade80;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  position: relative;
  
  ${props => props.$isAnimating && `
    animation: ${countUpAnimation} 0.6s ease-out;
  `}
  
  &::before {
    content: '💰';
    font-size: 1rem;
    margin-right: 0.25rem;
  }
`;

const CounterSubtext = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
  text-align: center;
`;

const SparkleEffect = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  
  ${props => props.$show && `
    &::before,
    &::after {
      content: '✨';
      position: absolute;
      font-size: 1rem;
      animation: ${sparkle} 1s ease-out;
    }
    
    &::before {
      top: -20px;
      left: -20px;
      animation-delay: 0.1s;
    }
    
    &::after {
      top: -20px;
      right: -20px;
      animation-delay: 0.3s;
    }
  `}
`;

const TrendIndicator = styled.div<{ $trend: 'up' | 'down' | 'stable' }>`
  font-size: 0.6rem;
  margin-left: 0.25rem;
  color: ${props => {
    switch (props.$trend) {
      case 'up': return '#4ade80';
      case 'down': return '#f87171';
      default: return 'rgba(255, 255, 255, 0.6)';
    }
  }};
  
  &::before {
    content: ${props => {
      switch (props.$trend) {
        case 'up': return '"📈"';
        case 'down': return '"📉"';
        default: return '"➡️"';
      }
    }};
  }
`;

const AnimatedNumber = styled.span<{ $isChanging: boolean }>`
  display: inline-block;
  transition: all 0.3s ease;
  
  ${props => props.$isChanging && `
    animation: ${countUpAnimation} 0.4s ease-out;
  `}
`;

function GasSavingsCounter() {
  const { savings, isAnimating, savingsInfo, refreshSavings } = useGasLeapContext();
  const [displayValue, setDisplayValue] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const previousSavings = useRef(0);
  const animationFrameRef = useRef<number>();

  // Smooth number animation
  useEffect(() => {
    if (savings !== displayValue) {
      const difference = savings - displayValue;
      const increment = difference / 30; // 30 frames for smooth animation
      
      const animate = () => {
        setDisplayValue(current => {
          const newValue = current + increment;
          if (Math.abs(newValue - savings) < Math.abs(increment)) {
            return savings;
          }
          return newValue;
        });
        
        if (Math.abs(displayValue - savings) > Math.abs(increment)) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [savings, displayValue]);

  // Handle sparkle effect and trend calculation
  useEffect(() => {
    if (savings > previousSavings.current && previousSavings.current > 0) {
      setShowSparkle(true);
      setTrend('up');
      
      // Hide sparkle after animation
      const timer = setTimeout(() => setShowSparkle(false), 1000);
      return () => clearTimeout(timer);
    } else if (savings < previousSavings.current) {
      setTrend('down');
    } else if (savings === previousSavings.current && previousSavings.current > 0) {
      setTrend('stable');
    }
    
    previousSavings.current = savings;
  }, [savings]);

  // Periodic refresh for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSavings();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [refreshSavings]);

  const formatSavings = (value: number): string => {
    const roundedValue = Math.floor(value);
    if (roundedValue < 1000) {
      return roundedValue.toString();
    } else if (roundedValue < 1000000) {
      return `${(roundedValue / 1000).toFixed(1)}K`;
    } else {
      return `${(roundedValue / 1000000).toFixed(1)}M`;
    }
  };

  const formatCurrency = (value: number): string => {
    // Convert gas units to approximate USD value (mock calculation)
    const usdValue = (value * 0.001); // Assuming 1 gas unit = $0.001
    return `$${usdValue.toFixed(2)}`;
  };

  return (
    <CounterContainer $isAnimating={isAnimating}>
      <CounterLabel>Gas Saved</CounterLabel>
      <CounterValue $isAnimating={isAnimating}>
        <AnimatedNumber $isChanging={isAnimating}>
          {formatSavings(displayValue)}
        </AnimatedNumber>
        <TrendIndicator $trend={trend} />
      </CounterValue>
      {savingsInfo && (
        <CounterSubtext>
          {formatCurrency(displayValue)} • {savingsInfo.transactionCount} txns
        </CounterSubtext>
      )}
      <SparkleEffect $show={showSparkle} />
    </CounterContainer>
  );
}

export default GasSavingsCounter;