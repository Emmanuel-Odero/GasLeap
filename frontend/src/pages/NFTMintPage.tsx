import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const NFTForm = styled.div`
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

const Input = styled.input`
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

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #4ade80;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
  }
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
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
  }
`;

const MintButton = styled.button<{ $isLoading: boolean; $success: boolean }>`
  background: ${props => props.$success 
    ? 'linear-gradient(45deg, #4ade80, #22c55e)' 
    : 'linear-gradient(45deg, #4ade80, #22c55e)'};
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
  min-width: 250px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(74, 222, 128, 0.3);
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
    background: linear-gradient(90deg, #4ade80, #22c55e);
    transition: width 0.3s ease;
    border-radius: 2px;
  }
`;

const NFTPreview = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(74, 222, 128, 0.5);
    background: rgba(74, 222, 128, 0.05);
  }
  
  .preview-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.7;
  }
  
  .preview-text {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }
`;

const NextStepButton = styled(Link)`
  display: inline-block;
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  text-align: center;
  margin-top: 1rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
  }
`;

function NFTMintPage() {
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [mintingStage, setMintingStage] = useState<'idle' | 'preparing' | 'signing' | 'submitting' | 'confirming' | 'complete'>('idle');
  
  const { sponsorTransaction, isLoading, result, error } = useSponsoredTransaction();
  const { connectionStatus, isConnected } = useGasLeapContext();

  // Demo data suggestions
  const demoSuggestions = [
    {
      name: "Polkadot Genesis NFT",
      description: "A commemorative NFT celebrating the birth of cross-chain interoperability",
      image: "https://via.placeholder.com/400x400/667eea/ffffff?text=Genesis+NFT"
    },
    {
      name: "Cross-Chain Explorer",
      description: "Digital art representing the seamless journey across parachains",
      image: "https://via.placeholder.com/400x400/764ba2/ffffff?text=Explorer+NFT"
    },
    {
      name: "Gas-Free Future",
      description: "Symbolizing a world where users don't worry about gas fees",
      image: "https://via.placeholder.com/400x400/4ade80/ffffff?text=Future+NFT"
    }
  ];

  const [selectedDemo, setSelectedDemo] = useState(0);

  // Auto-fill demo data
  useEffect(() => {
    const demo = demoSuggestions[selectedDemo];
    setNftName(demo.name);
    setNftDescription(demo.description);
    setImageUrl(demo.image);
  }, [selectedDemo]);

  // Progress simulation during minting
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setMintingStage('preparing');
      
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
          setMintingStage(currentStage.stage as any);
          setProgress(currentStage.progress);
          currentStageIndex++;
          
          if (currentStageIndex < stages.length) {
            setTimeout(progressTimer, currentStage.delay);
          }
        }
      };
      
      setTimeout(progressTimer, 200);
    } else {
      setMintingStage('idle');
      setProgress(0);
    }
  }, [isLoading]);

  const handleMint = async () => {
    if (!nftName.trim()) return;

    try {
      await sponsorTransaction({
        poolId: 'demo-pool-1',
        targetChain: 'astar', // Astar parachain
        callData: {
          name: nftName,
          description: nftDescription,
          image: imageUrl,
        },
      });
    } catch (err) {
      console.error('Failed to mint NFT:', err);
    }
  };

  const getStageMessage = () => {
    switch (mintingStage) {
      case 'preparing': return 'Preparing transaction...';
      case 'signing': return 'Signing with wallet...';
      case 'submitting': return 'Submitting to Astar network...';
      case 'confirming': return 'Confirming on blockchain...';
      case 'complete': return 'NFT minted successfully!';
      default: return '';
    }
  };

  return (
    <PageContainer>
      <PageTitle>🎨 NFT Minting Demo</PageTitle>
      
      <DemoCard>
        <ChainInfo>
          <ChainIcon>🌟</ChainIcon>
          <ChainDetails>
            <ChainName>Astar Network</ChainName>
            <ChainDescription>
              Smart contract platform for Polkadot ecosystem with EVM and WASM support
            </ChainDescription>
          </ChainDetails>
        </ChainInfo>

        <NFTForm>
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
                    border: selectedDemo === index ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.3)',
                    background: selectedDemo === index ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {demo.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="nftName">NFT Name *</Label>
            <Input
              id="nftName"
              type="text"
              placeholder="Enter your NFT name"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="nftDescription">Description</Label>
            <TextArea
              id="nftDescription"
              placeholder="Describe your NFT (optional)"
              value={nftDescription}
              onChange={(e) => setNftDescription(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </FormGroup>

          {/* NFT Preview */}
          {(nftName || imageUrl) && (
            <NFTPreview>
              <div className="preview-icon">
                {imageUrl ? '🖼️' : '🎨'}
              </div>
              <div className="preview-text">
                {nftName ? `"${nftName}"` : 'Your NFT Preview'}
                {nftDescription && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    {nftDescription.slice(0, 100)}{nftDescription.length > 100 ? '...' : ''}
                  </div>
                )}
              </div>
            </NFTPreview>
          )}

          {/* Connection Status */}
          {connectionStatus !== 'connected' && (
            <StatusMessage $type="info">
              <StatusContent>
                <h4>Connecting to Network</h4>
                <p>Setting up connection to Astar parachain...</p>
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

          <MintButton
            onClick={handleMint}
            disabled={isLoading || !nftName.trim() || connectionStatus !== 'connected'}
            $isLoading={isLoading}
            $success={result?.status === 'Executed'}
          >
            {isLoading 
              ? `${getStageMessage()}` 
              : result?.status === 'Executed'
              ? '✅ NFT Minted Successfully!'
              : '🚀 Mint NFT (Gas Sponsored)'
            }
          </MintButton>
        </NFTForm>

        {result && result.status === 'Executed' && (
          <StatusMessage $type="success">
            <StatusContent>
              <h4>NFT Minted Successfully! 🎉</h4>
              <p>Your NFT has been created on Astar parachain with sponsored gas fees.</p>
              <TransactionDetails>
                <div className="detail-row">
                  <span className="label">Transaction Hash:</span>
                  <span className="value">{result.txHash.slice(0, 20)}...</span>
                </div>
                <div className="detail-row">
                  <span className="label">Gas Saved:</span>
                  <span className="value">{result.gasCost} units (~$0.05)</span>
                </div>
                <div className="detail-row">
                  <span className="label">Network:</span>
                  <span className="value">Astar Parachain</span>
                </div>
                <div className="detail-row">
                  <span className="label">NFT Name:</span>
                  <span className="value">"{nftName}"</span>
                </div>
              </TransactionDetails>
              <NextStepButton to="/defi-liquidity">
                Continue to DeFi Demo →
              </NextStepButton>
            </StatusContent>
          </StatusMessage>
        )}

        {error && (
          <StatusMessage $type="error">
            <StatusContent>
              <h4>Minting Failed</h4>
              <p>{error.message}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                Don't worry! This is a demo environment. Try again or continue to the next demo.
              </p>
            </StatusContent>
          </StatusMessage>
        )}

        {isLoading && (
          <StatusMessage $type="info">
            <StatusContent>
              <h4>Processing Transaction</h4>
              <p>Your sponsored transaction is being processed on Astar parachain...</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                No gas tokens required - GasLeap is handling everything!
              </p>
            </StatusContent>
          </StatusMessage>
        )}
      </DemoCard>
    </PageContainer>
  );
}

export default NFTMintPage;