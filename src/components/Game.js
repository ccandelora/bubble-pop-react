import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Bubble from './Bubble';
import { playSound } from '../utils/sounds';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
`;

const rainbow = keyframes`
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
`;

const twinkle = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`;

const colors = [
  '#FF69B4',   // Hot Pink
  '#7CFF7C',   // Bright Mint
  '#7B68EE',   // Medium Slate Blue
  '#FFD700',   // Gold
  '#FF69B4',   // Hot Pink
  '#FFA500',   // Orange
  '#00CED1',   // Dark Turquoise
  '#FF4500'    // Orange Red
];

const GameContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${props => props.$backgroundImage ? 
    `linear-gradient(rgba(42, 27, 74, 0.6), rgba(69, 33, 128, 0.6)), url(${props.$backgroundImage})` : 
    'linear-gradient(135deg, #2a1b4a, #452180)'};
  background-size: cover;
  background-position: center;
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
    background: 
      radial-gradient(circle at 20% 20%, rgba(255, 192, 203, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(135, 206, 235, 0.15) 0%, transparent 40%);
    pointer-events: none;
    animation: ${rainbow} 10s linear infinite;
  }
`;

const TopBar = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: white;
  padding: 15px 20px;
  position: relative;
  z-index: 2;
  font-size: 1.2em;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
`;

const ScoreBoard = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  font-size: 1.2em;
  background: rgba(255, 255, 255, 0.15);
  padding: 10px 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
`;

const ComboText = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 2.5em;
  font-weight: bold;
  text-shadow: 
    0 0 10px rgba(255, 255, 255, 0.5),
    0 0 20px rgba(255, 255, 255, 0.3),
    0 0 30px rgba(255, 255, 255, 0.2);
  animation: ${float} 1s ease-in-out, ${rainbow} 2s linear infinite;
  pointer-events: none;
  z-index: 2;
  font-family: 'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif;
  background: linear-gradient(45deg, #ff69b4, #7b68ee, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(5px);
`;

const CelebrationText = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4em;
  color: white;
  text-shadow: 
    0 0 10px rgba(255, 255, 255, 0.5),
    0 0 20px rgba(255, 255, 255, 0.3),
    0 0 30px ${props => props.$color || 'rgba(255, 255, 255, 0.2)'};
  opacity: ${props => props.$show ? 1 : 0};
  transition: all 0.3s ease-in-out;
  pointer-events: none;
  z-index: 2;
  text-align: center;
  font-family: 'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif;
  animation: ${float} 2s ease-in-out infinite;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  pointer-events: auto;

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
  pointer-events: auto;
  z-index: 3;
  
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
  pointer-events: auto;
  
  @media (orientation: portrait) {
    width: 98%;
    gap: 4px;
    padding: 2px;
  }

  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    filter: blur(8px);
    animation: ${twinkle} 3s ease-in-out infinite;
    pointer-events: none;
  }
`;

const OrientationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #2a1b4a, #452180);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  text-align: center;
  animation: ${rainbow} 10s linear infinite;
`;

const RotateMessage = styled.div`
  font-size: 2em;
  color: white;
  margin-bottom: 30px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  font-family: 'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif;
`;

const RotateIcon = styled.div`
  font-size: 4em;
  animation: ${float} 2s ease-in-out infinite;
  margin: 20px 0;
`;

const Subtitle = styled.div`
  font-size: min(2.5vw, 2em);
  color: #fff;
  margin-top: 10px;
  text-shadow: 
    0 2px 4px rgba(0,0,0,0.3),
    0 4px 8px rgba(0,0,0,0.2);
  opacity: 0.95;
  font-weight: bold;
  letter-spacing: 2px;
  position: relative;
  text-align: center;

  @media (orientation: portrait) {
    font-size: 1.6em;
  }
`;

const Game = ({ onGameOver, player }) => {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [multiplier] = useState(1);
  const [lastMatchTime, setLastMatchTime] = useState(0);
  const [powerUp, setPowerUp] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showComboText, setShowComboText] = useState(false);
  const [comboText, setComboText] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const isProcessing = useRef(false);
  const [isLandscape, setIsLandscape] = useState(window.matchMedia("(orientation: landscape)").matches);

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
    const gridCols = 12;
    const toCheck = [index]; // Queue of indices to check
    
    while (toCheck.length > 0) {
      const currentIdx = toCheck.shift();
      const row = Math.floor(currentIdx / gridCols);
      const col = currentIdx % gridCols;
      
      // Check only directly adjacent positions (up, down, left, right)
      const positions = [
        [row - 1, col], // up
        [row + 1, col], // down
        [row, col - 1], // left
        [row, col + 1]  // right
      ];
      
      positions.forEach(([r, c]) => {
        // Check if position is within grid bounds
        if (r >= 0 && r < 12 && c >= 0 && c < gridCols) {
          const newIdx = r * gridCols + c;
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
  const getEncouragement = useCallback(() => {
    const encouragements = [
      "✨ Magical! ✨",
      "🌟 Fantastic! 🌟",
      "🎉 Amazing! 🎉",
      "🌈 Wonderful! 🌈",
      "⭐ Super Star! ⭐",
      "🦄 Unicorn Power! 🦄",
      "🎈 Incredible! 🎈",
      "🌺 Beautiful! 🌺",
      "🌙 Enchanting! 🌙",
      "💫 Spectacular! 💫",
      "🎪 Marvelous! 🎪",
      "🌸 Delightful! 🌸"
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }, []);

  const applyPowerUpEffect = useCallback((type, position) => {
    const timeoutIds = [];

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
                powerUpTriggered: true
              };
            }
          }
          break;
          
        case 'butterfly':
          // Create a spiral effect
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
            const timeoutId = setTimeout(() => {
              setBubbles(current => {
                const updated = [...current];
                if (!updated[index].isPopping) {
                  updated[index] = {
                    ...updated[index],
                    isPopping: true,
                    powerUpTriggered: true
                  };
                }
                return updated;
              });
            }, i * 100);
            timeoutIds.push(timeoutId);
          });
          break;
          
        default:
          // No effect for unknown power-up types
          break;
      }
      return newBubbles;
    });

    return () => timeoutIds.forEach(id => clearTimeout(id));
  }, [getDistance]);

  const getDifficultyMultiplier = useCallback(() => {
    if (player.age < 7) return 1.5;
    if (player.age < 10) return 1.2;
    return 1.0;
  }, [player.age]);

  const getBackgroundImage = useCallback(() => {
    return player.name === "Madison" ? '/images/princess.jpg' :
           player.name === "James" ? '/images/marvel.jpg' : '';
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

  // Handle combo text display
  const hideComboText = useCallback(() => {
    setShowComboText(false);
  }, []);

  const showComboMessage = useCallback(() => {
    setComboText(`${getEncouragement()} ${combo}x Combo!`);
    setShowComboText(true);
    const timeoutId = setTimeout(hideComboText, 1000);
    return () => clearTimeout(timeoutId);
  }, [combo, getEncouragement, hideComboText]);

  // Handle power-up cleanup
  const cleanupPowerUp = useCallback(() => {
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
  }, []);

  // Handle bubble replacement
  const replaceBubbles = useCallback((matches) => {
    setBubbles(prev => {
      const updated = [...prev];
      matches.forEach(matchIndex => {
        updated[matchIndex] = generateNewBubble();
      });
      return updated;
    });
    
    // Check for game over after bubbles are replaced
    const timeoutId = setTimeout(() => {
      setBubbles(current => {
        checkGameOver(current);
        return current;
      });
    }, 100);

    isProcessing.current = false;
    return () => clearTimeout(timeoutId);
  }, [checkGameOver, showComboMessage]);

  // Handle bubble click
  const handleBubbleClick = useCallback((index, event) => {
    // If the click came from a UI element or button, ignore it completely
    if (event?.target?.closest && (
      event.target.closest('.ui-button') ||
      event.target.closest('.top-bar') ||
      event.target.closest('.score-board') ||
      event.target.closest('button')
    )) {
      return;
    }

    // Don't process if already processing or game is over
    if (isProcessing.current || isGameOver) {
      return;
    }

    // Don't process if bubble doesn't exist
    if (!bubbles[index]) {
      return;
    }

    // Don't process clicks on bubbles that are popping or affected by power-ups
    if (bubbles[index].isPopping || bubbles[index].powerUpTriggered) {
      return;
    }

    isProcessing.current = true;
    // Increase delay to 200ms to better match the animation timing
    playSound('pop', isMuted, 200);
    
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
          
          const messageTimeoutId = setTimeout(showComboMessage, 50);
          const replaceTimeoutId = setTimeout(() => replaceBubbles(matches), 300);

          // Trigger power-up
          const powerUpChance = 0.15 + (combo * 0.03) + (player.age < 7 ? 0.1 : 0);
          if (Math.random() < powerUpChance) {
            const powerUpTypes = ['unicorn', 'butterfly', 'star', 'rainbow'];
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            setPowerUp({ type: randomType, position: index });
            playSound('powerup', isMuted);
            
            // Apply power-up effect
            applyPowerUpEffect(randomType, index);
            
            const cleanupTimeoutId = setTimeout(cleanupPowerUp, 2000);
            return () => {
              clearTimeout(messageTimeoutId);
              clearTimeout(replaceTimeoutId);
              clearTimeout(cleanupTimeoutId);
            };
          }

          return () => {
            clearTimeout(messageTimeoutId);
            clearTimeout(replaceTimeoutId);
          };
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
        setTimeout(() => replaceBubbles(matches), 300);

        return newBubbles;
      }
      
      isProcessing.current = false;
      return currentBubbles;
    });
  }, [bubbles, checkMatches, lastMatchTime, combo, multiplier, isMuted, getDifficultyMultiplier, getEncouragement, applyPowerUpEffect, player.age, isGameOver, checkGameOver, replaceBubbles, cleanupPowerUp]);

  const handleQuit = useCallback(() => {
    playSound('gameover', isMuted);
    onGameOver(score);
  }, [onGameOver, score, isMuted]);

  // Initialize bubbles and check for initial game over condition
  useEffect(() => {
    const cols = 12;
    const rows = 12;
    const initialBubbles = Array.from({ length: rows * cols }, () => ({
      color: colors[Math.floor(Math.random() * colors.length)],
      isPopping: false,
      id: Math.random().toString(36).substr(2, 9)
    }));
    setBubbles(initialBubbles);

    // Check for game over after initialization
    const timeoutId = setTimeout(() => {
      checkGameOver(initialBubbles);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [checkGameOver]);

  // Update orientation detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: landscape)");
    
    const handleOrientationChange = (e) => {
      setIsLandscape(e.matches);
    };

    // Modern way to listen for changes
    mediaQuery.addEventListener("change", handleOrientationChange);

    // Initial check
    setIsLandscape(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener("change", handleOrientationChange);
    };
  }, []);

  return (
    <>
      {!isLandscape ? (
        <OrientationOverlay>
          <RotateMessage>Please rotate your device</RotateMessage>
          <RotateIcon>📱</RotateIcon>
          <RotateMessage>to landscape mode</RotateMessage>
          <Subtitle style={{ marginTop: '20px' }}>✨ For the best experience ✨</Subtitle>
        </OrientationOverlay>
      ) : (
        <GameContainer $backgroundImage={getBackgroundImage()}>
          <TopBar 
            className="top-bar"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ScoreBoard className="score-board">
              <PlayerInfo>
                <PlayerEmoji>{player.emoji}</PlayerEmoji>
                <PlayerName>{player.name}</PlayerName>
              </PlayerInfo>
              <div>Score: {score}</div>
              {combo > 0 && <div>Combo: {combo}x</div>}
              {multiplier > 1 && <div>Multiplier: {multiplier.toFixed(1)}x</div>}
            </ScoreBoard>
            <ButtonGroup>
              <IconButton 
                className="ui-button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  setIsMuted(!isMuted);
                }}
              >
                {isMuted ? '🔇' : '🔊'}
              </IconButton>
              <QuitButton 
                className="ui-button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  handleQuit();
                }}
              >
                <span>🚪</span>
                <span>Quit</span>
              </QuitButton>
            </ButtonGroup>
          </TopBar>

          <BubbleGrid 
            onClick={e => {
              if (e.target.closest('.ui-button') || 
                  e.target.closest('.top-bar') || 
                  e.target.closest('.score-board') ||
                  e.target.closest('button')) {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }
            }}
          >
            {bubbles.map((bubble, index) => (
              <Bubble
                key={bubble.id}
                color={bubble.color}
                isPopping={bubble.isPopping}
                isRainbow={bubble.isRainbow}
                hasSparkle={bubble.hasSparkle}
                hasPowerUp={powerUp && powerUp.position === index}
                powerUpType={powerUp?.type}
                onClick={(event) => handleBubbleClick(index, event)}
              />
            ))}
          </BubbleGrid>

          {showComboText && (
            <ComboText>{comboText}</ComboText>
          )}

          {isGameOver && (
            <CelebrationText $show>
              Game Over!<br/>
              Final Score: {score}
            </CelebrationText>
          )}
        </GameContainer>
      )}
    </>
  );
};

export default Game;
