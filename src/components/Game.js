import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Bubble from './Bubble';
import Legend from './Legend';
import { playSound } from '../utils/sounds';

const colors = [
  '#FF3366',   // Bright Pink
  '#33CC33',   // Vivid Green
  '#3366FF',   // Royal Blue
  '#FFD700',   // Golden Yellow
  '#9933FF',   // Purple
  '#FF6600',   // Orange
  '#00CCCC',   // Turquoise
  '#FF0000'    // Pure Red
];

const GameContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #1a1a1a;
  background-image: url(${props => props.backgroundImage});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    pointer-events: none;
  }
`;

const TopBar = styled.div`
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: white;
  padding: 0 10px;
  position: relative;
  z-index: 1;
  font-size: 0.9em;

  @media (orientation: portrait) {
    margin-bottom: 5px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (orientation: portrait) {
    gap: 5px;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  padding: 5px;
  color: white;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (orientation: portrait) {
    font-size: 1em;
    padding: 3px;
  }
`;

const QuitButton = styled(IconButton)`
  background: rgba(255, 0, 0, 0.2);
  border-radius: 8px;
  padding: 5px 8px;
  font-size: 1em;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: rgba(255, 0, 0, 0.3);
  }

  @media (orientation: portrait) {
    padding: 3px 6px;
    font-size: 0.9em;
    gap: 2px;
  }
`;

const ScoreBoard = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 1em;

  @media (orientation: portrait) {
    gap: 5px;
    font-size: 0.9em;
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;

  @media (orientation: portrait) {
    gap: 3px;
  }
`;

const PlayerEmoji = styled.span`
  font-size: 1.3em;

  @media (orientation: portrait) {
    font-size: 1.1em;
  }
`;

const PlayerName = styled.span`
  font-weight: bold;
  
  @media (orientation: portrait) {
    font-size: 0.9em;
  }
`;

const BubbleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 6px;
  width: 95%;
  max-width: 600px;
  aspect-ratio: 1;
  margin: 0 auto;
  padding: 5px;
  position: relative;
  z-index: 1;
  
  @media (orientation: portrait) {
    width: 98%;
    gap: 4px;
    padding: 2px;
  }
`;

const ComboText = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.8em;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  animation: fadeInOut 1s ease-in-out;
  pointer-events: none;
  z-index: 2;

  @media (orientation: portrait) {
    font-size: 1.5em;
  }
`;

const CelebrationText = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 64px;
  color: white;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
  z-index: 2;
`;

const Game = ({ onGameOver, player }) => {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [lastMatchTime, setLastMatchTime] = useState(0);
  const [powerUp, setPowerUp] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showComboText, setShowComboText] = useState(false);
  const [comboText, setComboText] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const isProcessing = useRef(false);

  // Helper function to get distance between two indices
  const getDistance = useCallback((index1, index2) => {
    const cols = 12;
    const row1 = Math.floor(index1 / cols);
    const col1 = index1 % cols;
    const row2 = Math.floor(index2 / cols);
    const col2 = index2 % cols;
    return Math.abs(row1 - row2) + Math.abs(col1 - col2);
  }, []);

  const generateNewBubble = () => ({
    color: colors[Math.floor(Math.random() * colors.length)],
    isPopping: false,
    id: Math.random(),
  });

  // Check for matching bubbles
  const checkMatches = useCallback((index, currentBubbles) => {
    // Check if bubble exists and is valid
    if (!currentBubbles[index]) {
      return new Set();
    }

    const matches = new Set([index]);
    const color = currentBubbles[index].color;
    const cols = 12;
    const toCheck = [index]; // Queue of indices to check
    
    while (toCheck.length > 0) {
      const currentIdx = toCheck.shift();
      const row = Math.floor(currentIdx / cols);
      const col = currentIdx % cols;
      
      // Check only directly adjacent positions (up, down, left, right)
      const positions = [
        [row - 1, col], // up
        [row + 1, col], // down
        [row, col - 1], // left
        [row, col + 1]  // right
      ];
      
      positions.forEach(([r, c]) => {
        // Check if position is within grid bounds
        if (r >= 0 && r < 12 && c >= 0 && c < cols) {
          const newIdx = r * cols + c;
          // Only match if bubble exists and has same color
          if (newIdx >= 0 && newIdx < currentBubbles.length && 
              currentBubbles[newIdx] && 
              currentBubbles[newIdx].color === color && 
              !matches.has(newIdx)) {
            matches.add(newIdx);
            toCheck.push(newIdx); // Add to queue to check its neighbors
          }
        }
      });
    }
    
    return matches;
  }, []);

  // Apply power-up effects
  const applyPowerUpEffect = useCallback((type, position) => {
    setBubbles(prev => {
      const newBubbles = [...prev];
      const cols = 12;
      
      switch(type) {
        case 'unicorn':
          // Turn nearby bubbles into rainbow colors (only within 2 spaces)
          for (let i = 0; i < newBubbles.length; i++) {
            if (getDistance(i, position) <= 2) {
              newBubbles[i] = {
                ...newBubbles[i],
                isRainbow: true,
                powerUpTriggered: true  // Mark as triggered by power-up
              };
            }
          }
          break;
          
        case 'butterfly':
          // Create a spiral effect (only affect unpopped bubbles)
          const spiral = [];
          let radius = 1;
          let angle = 0;
          while (radius <= 3) {
            const row = Math.floor(position / cols) + Math.floor(Math.sin(angle) * radius);
            const col = (position % cols) + Math.floor(Math.cos(angle) * radius);
            const index = row * cols + col;
            if (index >= 0 && index < newBubbles.length && !newBubbles[index].isPopping) {
              spiral.push(index);
            }
            angle += Math.PI / 4;
            if (angle >= Math.PI * 2) {
              radius++;
              angle = 0;
            }
          }
          spiral.forEach((index, i) => {
            setTimeout(() => {
              setBubbles(current => {
                const updated = [...current];
                if (!updated[index].isPopping) {  // Double check it hasn't been popped
                  updated[index] = {
                    ...updated[index],
                    isPopping: true,
                    powerUpTriggered: true
                  };
                }
                return updated;
              });
            }, i * 100);
          });
          break;
          
        case 'star':
          // Clear a row with sparkles
          const row = Math.floor(position / cols);
          const rowStart = row * cols;
          const rowEnd = rowStart + cols;
          for (let i = rowStart; i < rowEnd; i++) {
            setTimeout(() => {
              setBubbles(current => {
                const updated = [...current];
                updated[i] = {
                  ...updated[i],
                  isPopping: true,
                  hasSparkle: true
                };
                return updated;
              });
            }, (i - rowStart) * 50);
          }
          break;
          
        case 'rainbow':
          // Create a rainbow explosion
          for (let i = 0; i < newBubbles.length; i++) {
            const distance = getDistance(i, position);
            if (distance <= 3) {
              setTimeout(() => {
                setBubbles(current => {
                  const updated = [...current];
                  updated[i] = {
                    ...updated[i],
                    isRainbow: true,
                    isPopping: distance <= 1
                  };
                  return updated;
                });
              }, distance * 100);
            }
          }
          break;
      }
      return newBubbles;
    });
  }, [getDistance]);

  const getEncouragement = useCallback(() => {
    const encouragements = [
      "Amazing", "Fantastic", "Incredible", "Awesome", 
      "Super", "Wonderful", "Great", "Perfect"
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }, []);

  const getDifficultyMultiplier = useCallback(() => {
    if (player.age < 7) return 1.5;
    if (player.age < 10) return 1.2;
    return 1.0;
  }, [player.age]);

  const getBackgroundImage = useCallback(() => {
    if (player.name === "Madison") {
      return '/images/princess.jpg';
    } else if (player.name === "James") {
      return '/images/marvel.jpg';
    }
    return '';
  }, [player.name]);

  // Check if any moves are available
  const checkAvailableMoves = useCallback((currentBubbles) => {
    const cols = 12;
    
    for (let i = 0; i < currentBubbles.length; i++) {
      const matches = checkMatches(i, currentBubbles);
      if (matches.size >= 2) {
        return true;
      }
    }
    return false;
  }, [checkMatches]);

  // Check for game over condition
  const checkGameOver = useCallback((currentBubbles) => {
    if (!checkAvailableMoves(currentBubbles)) {
      setIsGameOver(true);
      onGameOver(score);
      playSound('gameover', isMuted);
    }
  }, [checkAvailableMoves, onGameOver, score, isMuted]);

  // Handle bubble click
  const handleBubbleClick = useCallback((index) => {
    if (!isProcessing.current && !isGameOver && bubbles[index]) {
      // Don't process clicks on bubbles that are popping or affected by power-ups
      if (bubbles[index].isPopping || bubbles[index].powerUpTriggered) {
        return;
      }

      isProcessing.current = true;
      playSound('pop', isMuted);
      
      setBubbles(currentBubbles => {
        // Ensure the bubble still exists in current state
        if (!currentBubbles[index]) {
          isProcessing.current = false;
          return currentBubbles;
        }

        const matches = checkMatches(index, currentBubbles);
        
        if (matches.size >= 2) {
          const now = Date.now();
          const timeDiff = now - lastMatchTime;
          let comboMultiplier = multiplier;
          const difficultyMultiplier = getDifficultyMultiplier();
          
          if (timeDiff < 1000) {
            setCombo(prev => {
              const newCombo = prev + 1;
              comboMultiplier = multiplier * (1 + (newCombo * 0.5 * difficultyMultiplier));
              return newCombo;
            });
            
            setTimeout(() => {
              setComboText(`${getEncouragement()} ${combo}x Combo!`);
              setShowComboText(true);
              setTimeout(() => setShowComboText(false), 1000);
              playSound('combo', isMuted);
            }, 50);
          } else {
            setCombo(0);
          }
          setLastMatchTime(now);

          const matchScore = Math.floor(matches.size * 10 * comboMultiplier * difficultyMultiplier);
          setScore(prev => prev + matchScore);

          // Mark matching bubbles as popping
          const newBubbles = [...currentBubbles];
          matches.forEach(matchIndex => {
            newBubbles[matchIndex] = {
              ...newBubbles[matchIndex],
              isPopping: true
            };
          });

          // Replace popped bubbles after animation
          setTimeout(() => {
            setBubbles(prev => {
              const updated = [...prev];
              matches.forEach(matchIndex => {
                updated[matchIndex] = generateNewBubble();
              });
              return updated;
            });
            
            // Check for game over after bubbles are replaced
            setTimeout(() => {
              setBubbles(current => {
                checkGameOver(current);
                return current;
              });
            }, 100);
            
            isProcessing.current = false;
          }, 300);

          // Trigger power-up
          const powerUpChance = 0.15 + (combo * 0.03) + (player.age < 7 ? 0.1 : 0);
          if (Math.random() < powerUpChance) {
            const powerUpTypes = ['unicorn', 'butterfly', 'star', 'rainbow'];
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            setPowerUp({ type: randomType, position: index });
            playSound('powerup', isMuted);
            
            // Apply power-up effect
            applyPowerUpEffect(randomType, index);
            
            setTimeout(() => {
              setPowerUp(null);
              setBubbles(current => {
                const updated = [...current];
                updated.forEach(bubble => {
                  if (bubble.powerUpTriggered) {
                    bubble.powerUpTriggered = false;
                    bubble.isRainbow = false;
                    bubble.hasSparkle = false;
                  }
                });
                return updated;
              });
            }, 2000);
          }

          return newBubbles;
        }
        
        isProcessing.current = false;
        return currentBubbles;
      });
    }
  }, [bubbles, checkMatches, lastMatchTime, combo, multiplier, isMuted, getDifficultyMultiplier, getEncouragement, applyPowerUpEffect, player.age, isGameOver, checkGameOver]);

  const handleQuit = useCallback(() => {
    playSound('gameover', isMuted);
    onGameOver(score);
  }, [onGameOver, score, isMuted]);

  // Initialize bubbles and check for initial game over condition
  useEffect(() => {
    const cols = 12;
    const rows = 12;
    const initialBubbles = Array(rows * cols).fill(null).map(() => ({
      color: colors[Math.floor(Math.random() * colors.length)],
      isPopping: false,
      id: Math.random()
    }));
    setBubbles(initialBubbles);
    // Check for game over after initialization
    setTimeout(() => checkGameOver(initialBubbles), 100);
  }, [checkGameOver]);

  return (
    <GameContainer backgroundImage={getBackgroundImage()}>
      <TopBar>
        <ScoreBoard>
          <PlayerInfo>
            <PlayerEmoji>{player.emoji}</PlayerEmoji>
            <PlayerName>{player.name}</PlayerName>
          </PlayerInfo>
          <div>Score: {score}</div>
          {combo > 0 && <div>Combo: {combo}x</div>}
          {multiplier > 1 && <div>Multiplier: {multiplier.toFixed(1)}x</div>}
        </ScoreBoard>
        <ButtonGroup>
          <IconButton onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? '🔇' : '🔊'}
          </IconButton>
          <QuitButton onClick={handleQuit}>
            <span>🚪</span>
            <span>Quit</span>
          </QuitButton>
        </ButtonGroup>
      </TopBar>

      <BubbleGrid>
        {bubbles.map((bubble, index) => (
          <Bubble
            key={bubble.id}
            color={bubble.color}
            isPopping={bubble.isPopping}
            isRainbow={bubble.isRainbow}
            hasSparkle={bubble.hasSparkle}
            hasPowerUp={powerUp && powerUp.position === index}
            powerUpType={powerUp?.type}
            onClick={() => handleBubbleClick(index)}
          />
        ))}
      </BubbleGrid>

      {showComboText && (
        <ComboText>{comboText}</ComboText>
      )}

      {isGameOver && (
        <CelebrationText show>
          Game Over!<br/>
          Final Score: {score}
        </CelebrationText>
      )}

      <Legend />
    </GameContainer>
  );
};

export default Game;
