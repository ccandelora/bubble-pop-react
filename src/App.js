import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { playSound } from './utils/sounds';
import PlayerSelect from './components/PlayerSelect';
import Game from './components/Game';

// Styled components
const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1a1a1a;
  overflow: hidden;
`;

const StartButton = styled.button`
  padding: 15px 30px;
  font-size: 24px;
  background: linear-gradient(45deg, #ff6b6b, #ff8787);
  border: none;
  border-radius: 25px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(255, 107, 107, 0.3);
  }
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;

  .loader {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #ff6b6b;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);

  // Prevent scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.removeEventListener('touchmove', (e) => e.preventDefault());
    };
  }, []);

  const handleStartClick = async () => {
    setIsLoading(true);
    playSound('pop');
    
    // Small delay to show loading animation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setShowPlayerSelect(true);
    setIsLoading(false);
  };

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    playSound('powerup');
    setGameStarted(true);
  };

  const handleGameOver = () => {
    playSound('gameOver');
    setGameStarted(false);
    setSelectedPlayer(null);
    setShowPlayerSelect(false);
  };

  return (
    <AppContainer>
      {!gameStarted ? (
        isLoading ? (
          <LoadingScreen>
            <div className="loader" />
            <div>Loading...</div>
          </LoadingScreen>
        ) : showPlayerSelect ? (
          <PlayerSelect onSelectPlayer={handleSelectPlayer} />
        ) : (
          <StartButton onClick={handleStartClick}>
            Start Game
          </StartButton>
        )
      ) : (
        <Game 
          onGameOver={handleGameOver} 
          player={selectedPlayer}
        />
      )}
    </AppContainer>
  );
}

export default App;
