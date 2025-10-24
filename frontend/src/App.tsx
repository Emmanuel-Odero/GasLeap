import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { GasLeapProvider } from './contexts/GasLeapContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import NFTMintPage from './pages/NFTMintPage';
import DeFiLiquidityPage from './pages/DeFiLiquidityPage';
import './App.css';

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

function App() {
  return (
    <GasLeapProvider>
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
    </GasLeapProvider>
  );
}

export default App;