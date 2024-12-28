import React from 'react';
import styled from 'styled-components';

const MenuContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: env(safe-area-inset-top) 20px env(safe-area-inset-bottom);
  box-sizing: border-box;
  gap: 24px;
`;

const Title = styled.h1`
  color: white;
  font-size: min(10vw, 2.5rem);
  margin: 0;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
`;

const Score = styled.div`
  color: white;
  font-size: min(8vw, 2rem);
  margin: 0;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  span {
    color: #ffd700;
    font-weight: bold;
  }
`;

const Button = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50px;
  color: white;
  cursor: pointer;
  font-size: min(5vw, 1.2rem);
  padding: 16px 32px;
  min-width: 200px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Instructions = styled.div`
  color: white;
  text-align: center;
  max-width: 300px;
  font-size: min(4vw, 1rem);
  line-height: 1.5;
  opacity: 0.9;
  padding: 0 20px;
`;

const HighScore = styled.div`
  color: white;
  font-size: min(4vw, 0.9rem);
  opacity: 0.8;
  margin-top: auto;
  padding-top: 20px;
`;

function Menu({ onStartGame, gameState, finalScore }) {
  const highScore = localStorage.getItem('highScore') || 0;
  
  if (finalScore > highScore) {
    localStorage.setItem('highScore', finalScore);
  }

  return (
    <MenuContainer>
      <Title>Bubble Pop</Title>
      
      {gameState === 'gameOver' ? (
        <>
          <Score>
            Score: <span>{finalScore}</span>
          </Score>
          {finalScore > highScore && (
            <Instructions> New High Score! </Instructions>
          )}
          <Button onClick={onStartGame}>Play Again</Button>
        </>
      ) : (
        <>
          <Instructions>
            Pop matching bubbles in groups of three or more.
            Make combos for extra points!
          </Instructions>
          <Button onClick={onStartGame}>Start Game</Button>
          {highScore > 0 && (
            <HighScore>High Score: {highScore}</HighScore>
          )}
        </>
      )}
    </MenuContainer>
  );
}

export default Menu;
