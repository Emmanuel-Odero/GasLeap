import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

const MintButton = styled.button<{ $isLoading: boolean }>`
  background: linear-gradient(45deg, #4ade80, #22c55e);
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
    box-shadow: 0 8px 25px rgba(74, 222, 128, 0.3);
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
  const { sponsorTransaction, isLoading, result, error } = useSponsoredTransaction();

  const handleMint = async () => {
    if (!nftName.trim()) return;

    try {
      await sponsorTransaction({
        poolId: 'demo-pool-1',
        targetChain: '1000', // Astar parachain ID
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

          <MintButton
            onClick={handleMint}
            disabled={isLoading || !nftName.trim()}
            $isLoading={isLoading}
          >
            {isLoading ? 'Minting with Sponsored Gas...' : '🚀 Mint NFT (Gas Sponsored)'}
          </MintButton>
        </NFTForm>

        {result && result.status === 'Executed' && (
          <StatusMessage $type="success">
            ✅ NFT minted successfully! Transaction: {result.txHash.slice(0, 10)}...
            <br />
            💰 Gas saved: {result.gasCost} units
            <NextStepButton to="/defi-liquidity">
              Continue to DeFi Demo →
            </NextStepButton>
          </StatusMessage>
        )}

        {error && (
          <StatusMessage $type="error">
            ❌ Failed to mint NFT: {error.message}
          </StatusMessage>
        )}

        {isLoading && (
          <StatusMessage $type="info">
            ⏳ Processing your sponsored transaction on Astar...
          </StatusMessage>
        )}
      </DemoCard>
    </PageContainer>
  );
}

export default NFTMintPage;