import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const bounce = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const shine = keyframes`
  0% { transform: translateX(-200%) rotate(45deg); }
  100% { transform: translateX(200%) rotate(45deg); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
`;

const rainbow = keyframes`
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-width: 100vw;
  padding: 40px;
  margin: 0;
  color: white;
  text-align: center;
  background: linear-gradient(135deg, #2a1b4a, #452180);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  box-sizing: border-box;

  @media (orientation: portrait) {
    padding: 20px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(255, 192, 203, 0.2) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(135, 206, 235, 0.2) 0%, transparent 40%);
    pointer-events: none;
    animation: ${rainbow} 10s linear infinite;
  }
`;

const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 40px;
  animation: ${float} 6s ease-in-out infinite;
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
`;

const MainTitle = styled.h1`
  font-size: min(5vw, 4em);
  margin-bottom: 15px;
  background: linear-gradient(45deg, #FF0066, #00C6FF, #FFD700, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${bounce} 6s ease-in-out infinite;
  text-shadow: 
    0 2px 10px rgba(255,255,255,0.1),
    0 4px 20px rgba(255,255,255,0.1);
  font-family: 'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif;
  letter-spacing: -1px;
  position: relative;
  text-align: center;
  white-space: nowrap;
  line-height: 1.2;

  @media (orientation: portrait) {
    font-size: 3em;
  }
`;

const Subtitle = styled.h2`
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

const PlayerGrid = styled.div`
  display: flex;
  gap: min(6vw, 60px);
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  padding: 0 20px;

  @media (orientation: portrait) {
    gap: 30px;
    flex-direction: column;
  }
`;

const PlayerCard = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: none;
  padding: min(2vw, 25px);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  border-radius: 25px;
  backdrop-filter: blur(10px);
  flex: 0 0 auto;
  z-index: 1;
  overflow: visible;
  
  &:hover {
    transform: scale(1.05) translateY(-10px);
    background: rgba(255, 255, 255, 0.2);
    z-index: 2;
  }

  &:active {
    transform: scale(0.95);
  }

  &::before {
    content: '';
    position: absolute;
    inset: -3px;
    background: linear-gradient(45deg, 
      ${props => props.$borderColor}66,
      transparent,
      ${props => props.$borderColor}66
    );
    border-radius: 28px;
    z-index: -1;
    animation: ${rainbow} 3s linear infinite;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const PlayerImage = styled.div`
  width: min(22vh, 220px);
  height: min(22vh, 220px);
  border-radius: 25px;
  overflow: hidden;
  position: relative;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.3),
    0 15px 50px rgba(0, 0, 0, 0.2);
  margin-bottom: 15px;
  border: 4px solid ${props => props.$borderColor};
  transition: all 0.4s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, 
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: ${shine} 3s infinite;
  }

  ${PlayerCard}:hover & {
    box-shadow: 
      0 15px 40px rgba(0, 0, 0, 0.4),
      0 20px 60px rgba(0, 0, 0, 0.3),
      0 0 20px ${props => props.$borderColor}33;
    border-width: 5px;
    
    img {
      transform: scale(1.1);
    }
  }
`;

const PlayerName = styled.div`
  font-size: min(2.5vh, 1.8em);
  color: white;
  text-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.3);
  margin-top: 15px;
  font-weight: bold;
  transition: all 0.4s ease;
  position: relative;

  @media (orientation: portrait) {
    font-size: 1.5em;
  }

  ${PlayerCard}:hover & {
    transform: translateY(2px);
    text-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.6),
      0 6px 16px rgba(0, 0, 0, 0.4);
  }
`;

const FloatingBubbles = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
`;

const bubbleFloat = keyframes`
  0% {
    transform: translateY(100vh) scale(1) rotate(0deg);
    opacity: 0.8;
  }
  100% {
    transform: translateY(-100px) scale(0.3) rotate(360deg);
    opacity: 0;
  }
`;

const Bubble = styled.div`
  position: absolute;
  background: radial-gradient(circle at 30% 30%, 
    rgba(255,255,255,0.4), 
    rgba(255,255,255,0.1)
  );
  border-radius: 50%;
  animation: ${bubbleFloat} ${props => props.$duration}s linear infinite;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  left: ${props => props.$left}%;
  opacity: 0.4;
  backdrop-filter: blur(2px);
  box-shadow: inset 0 0 10px rgba(255,255,255,0.3);
`;

const Sparkle = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  animation: ${sparkle} ${props => props.$duration || 2}s ease-in-out infinite;
  animation-delay: ${props => props.$delay || 0}s;
  opacity: 0;
`;

const FloatingBubble = styled.div`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  background: ${props => props.$color};
  border-radius: 50%;
  opacity: 0.6;
  animation: ${float} ${props => props.$duration}s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
  left: ${props => props.$left}%;
  top: ${props => props.$top}%;
  pointer-events: none;
`;

const LoadingOverlay = styled.div`
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
  opacity: ${props => props.$isLoading ? 1 : 0};
  visibility: ${props => props.$isLoading ? 'visible' : 'hidden'};
  transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
`;

const LoaderContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
`;

const LoaderRing = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-top-color: #ff69b4;
  border-radius: 50%;
  animation: ${spin} 1.5s linear infinite;

  &:nth-child(2) {
    width: 80%;
    height: 80%;
    top: 10%;
    left: 10%;
    border-top-color: #7b68ee;
    animation-duration: 1.8s;
    animation-direction: reverse;
  }

  &:nth-child(3) {
    width: 60%;
    height: 60%;
    top: 20%;
    left: 20%;
    border-top-color: #ffd700;
    animation-duration: 2.1s;
  }
`;

const LoadingText = styled.div`
  font-size: 1.8em;
  color: white;
  margin-top: 30px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  font-family: 'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const LoadingSparkle = styled.div`
  position: absolute;
  font-size: 1.5em;
  animation: ${float} 2s ease-in-out infinite;

  &:nth-child(1) { top: -20px; left: 50%; animation-delay: 0s; }
  &:nth-child(2) { top: 50%; right: -20px; animation-delay: 0.3s; }
  &:nth-child(3) { bottom: -20px; left: 50%; animation-delay: 0.6s; }
  &:nth-child(4) { top: 50%; left: -20px; animation-delay: 0.9s; }
`;

const players = [
  {
    name: "Madison",
    color: "#FF0066",
    image: "/images/madison.webp", 
    age: 3,
    emoji: "👸"
  },
  {
    name: "James",
    color: "#00C6FF",
    image: "/images/james.webp",
    age: 4,
    emoji: "🦸‍♂️"
  }
];

const GlobalStyle = styled.div`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
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

const PlayerSelect = ({ onSelectPlayer }) => {
  const [bubbles, setBubbles] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const newBubbles = Array.from({ length: 30 }, (_, i) => ({
      size: Math.random() * 60 + 20,
      left: Math.random() * 100,
      duration: Math.random() * 15 + 8,
      delay: Math.random() * 10,
      key: i
    }));
    setBubbles(newBubbles);

    const newSparkles = Array.from({ length: 20 }, (_, i) => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 2 + 1,
      delay: Math.random() * 2,
      key: i
    }));
    setSparkles(newSparkles);

    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    // Simulate loading time and ensure minimum display time
    const minLoadTime = 1500; // 1.5 seconds minimum loading time
    const startTime = Date.now();

    const loadAssets = async () => {
      // Add your actual asset loading logic here
      // For example, preloading images:
      const imagePromises = [
        '/images/madison.png',
        '/images/james.png',
        '/images/princess.jpg',
        '/images/marvel.jpg'
      ].map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      try {
        await Promise.all(imagePromises);
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsed);
        
        // Ensure minimum display time
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } catch (error) {
        console.error('Failed to load some assets:', error);
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player.name);
    onSelectPlayer(player);
  };

  return (
    <GlobalStyle>
      <LoadingOverlay $isLoading={isLoading}>
        <LoaderContainer>
          <LoadingSparkle>✨</LoadingSparkle>
          <LoadingSparkle>✨</LoadingSparkle>
          <LoadingSparkle>✨</LoadingSparkle>
          <LoadingSparkle>✨</LoadingSparkle>
          <LoaderRing />
          <LoaderRing />
          <LoaderRing />
        </LoaderContainer>
        <LoadingText>Loading Magic...</LoadingText>
      </LoadingOverlay>
      
      {!isLandscape ? (
        <OrientationOverlay>
          <RotateMessage>Please rotate your device</RotateMessage>
          <RotateIcon>📱</RotateIcon>
          <RotateMessage>to landscape mode</RotateMessage>
          <Subtitle style={{ marginTop: '20px' }}>✨ For the best experience ✨</Subtitle>
        </OrientationOverlay>
      ) : (
        <Container>
          <FloatingBubbles>
            {bubbles.map(bubble => (
              <Bubble
                key={bubble.key}
                $size={bubble.size}
                $left={bubble.left}
                $duration={bubble.duration}
                style={{ animationDelay: `${bubble.delay}s` }}
              />
            ))}
            {sparkles.map(sparkle => (
              <Sparkle
                key={sparkle.key}
                style={{
                  top: `${sparkle.top}%`,
                  left: `${sparkle.left}%`
                }}
                $duration={sparkle.duration}
                $delay={sparkle.delay}
              />
            ))}
          </FloatingBubbles>
          <TitleContainer>
            <MainTitle>✨ James' & Madison's ✨</MainTitle>
            <Subtitle>🌟 Bubble Adventure 🌟</Subtitle>
          </TitleContainer>
          <PlayerGrid>
            {players.map(player => (
              <PlayerCard
                key={player.name}
                onClick={() => handlePlayerClick(player)}
                $borderColor={player.color}
                style={{ 
                  zIndex: selectedPlayer === player.name ? 2 : 1
                }}
              >
                <PlayerImage $borderColor={player.color}>
                  <img src={player.image} alt={player.name} />
                </PlayerImage>
                <PlayerName>
                  {player.emoji} {player.name} {player.emoji}
                </PlayerName>
              </PlayerCard>
            ))}
          </PlayerGrid>
        </Container>
      )}
    </GlobalStyle>
  );
};

export default PlayerSelect;
