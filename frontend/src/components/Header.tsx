import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useGasLeapContext } from '../contexts/GasLeapContext';
import GasSavingsCounter from './GasSavingsCounter';

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

const ConnectButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const AccountInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
`;

function Header() {
  const location = useLocation();
  const { isConnected, account, connect, disconnect, isLoading } = useGasLeapContext();

  return (
    <HeaderContainer>
      <Logo>
        ⚡ GasLeap
      </Logo>
      
      <Nav>
        <NavLink to="/" $active={location.pathname === '/'}>
          Home
        </NavLink>
        <NavLink to="/nft-mint" $active={location.pathname === '/nft-mint'}>
          NFT Mint Demo
        </NavLink>
        <NavLink to="/defi-liquidity" $active={location.pathname === '/defi-liquidity'}>
          DeFi Demo
        </NavLink>
      </Nav>

      <Nav>
        <GasSavingsCounter />
        
        {isConnected ? (
          <AccountInfo>
            <span>
              {account?.meta?.name || 'Connected'}
            </span>
            <ConnectButton onClick={disconnect}>
              Disconnect
            </ConnectButton>
          </AccountInfo>
        ) : (
          <ConnectButton onClick={connect} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </ConnectButton>
        )}
      </Nav>
    </HeaderContainer>
  );
}

export default Header;