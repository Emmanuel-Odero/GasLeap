import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HomeContainer = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Hero = styled.div`
  margin-bottom: 4rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #fff, #a8edea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const DemoSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const DemoCard = styled(Link)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2rem;
  text-decoration: none;
  color: white;
  transition: all 0.3s ease;
  display: block;

  &:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const CardIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const CardDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
`;

const Features = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
`;

const Feature = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const FeatureTitle = styled.h4`
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const FeatureText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
`;

function HomePage() {
  return (
    <HomeContainer>
      <Hero>
        <Title>Cross-Chain Gas Sponsorship</Title>
        <Subtitle>
          Experience seamless transactions across Polkadot parachains without holding native gas tokens. 
          GasLeap handles the complexity, you enjoy the simplicity.
        </Subtitle>
      </Hero>

      <DemoSection>
        <DemoCard to="/nft-mint">
          <CardIcon>🎨</CardIcon>
          <CardTitle>NFT Minting Demo</CardTitle>
          <CardDescription>
            Mint NFTs on Astar parachain with sponsored gas fees. 
            No need to hold ASTR tokens - just create and enjoy!
          </CardDescription>
        </DemoCard>

        <DemoCard to="/defi-liquidity">
          <CardIcon>💱</CardIcon>
          <CardTitle>DeFi Liquidity Demo</CardTitle>
          <CardDescription>
            Provide liquidity on Acala's DeFi protocols without ACA tokens. 
            Seamless cross-chain DeFi participation made simple.
          </CardDescription>
        </DemoCard>
      </DemoSection>

      <Features>
        <Feature>
          <FeatureIcon>⚡</FeatureIcon>
          <FeatureTitle>Instant Sponsorship</FeatureTitle>
          <FeatureText>
            Gas fees are sponsored instantly across supported parachains
          </FeatureText>
        </Feature>

        <Feature>
          <FeatureIcon>🔗</FeatureIcon>
          <FeatureTitle>Cross-Chain Native</FeatureTitle>
          <FeatureText>
            Built on XCM for true cross-chain interoperability
          </FeatureText>
        </Feature>

        <Feature>
          <FeatureIcon>🛡️</FeatureIcon>
          <FeatureTitle>Secure & Audited</FeatureTitle>
          <FeatureText>
            Smart authorization rules and spending limits protect funds
          </FeatureText>
        </Feature>

        <Feature>
          <FeatureIcon>📊</FeatureIcon>
          <FeatureTitle>Real-time Tracking</FeatureTitle>
          <FeatureText>
            Monitor gas savings and transaction history in real-time
          </FeatureText>
        </Feature>
      </Features>
    </HomeContainer>
  );
}

export default HomePage;