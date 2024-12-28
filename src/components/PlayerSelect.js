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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  color: white;
  text-align: center;
  background: linear-gradient(135deg, #1e0f30, #311b92);
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
      radial-gradient(circle at 20% 20%, rgba(255, 0, 102, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(0, 198, 255, 0.15) 0%, transparent 40%);
    pointer-events: none;
  }
`;

const TitleContainer = styled.div`
  margin-bottom: 60px;
  text-align: center;
  animation: ${float} 6s ease-in-out infinite;
  position: relative;
  z-index: 2;
`;

const MainTitle = styled.h1`
  font-size: 4.5em;
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

  &::after {
    content: '';
    position: absolute;
    top: -20px;
    left: -20px;
    right: -20px;
    bottom: -20px;
    background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%);
    z-index: -1;
    animation: ${float} 6s ease-in-out infinite reverse;
  }

  @media (max-width: 600px) {
    font-size: 3em;
  }
`;

const Subtitle = styled.h2`
  font-size: 2.2em;
  color: #fff;
  margin-top: 10px;
  text-shadow: 
    0 2px 4px rgba(0,0,0,0.3),
    0 4px 8px rgba(0,0,0,0.2);
  opacity: 0.95;
  font-weight: bold;
  letter-spacing: 2px;
  position: relative;

  &::before {
    content: '✨';
    position: absolute;
    left: -40px;
    animation: ${bounce} 3s ease-in-out infinite;
  }

  &::after {
    content: '✨';
    position: absolute;
    right: -40px;
    animation: ${bounce} 3s ease-in-out infinite 1.5s;
  }

  @media (max-width: 600px) {
    font-size: 1.6em;
  }
`;

const PlayerGrid = styled.div`
  display: flex;
  gap: 60px;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  margin-top: 20px;
`;

const PlayerCard = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 30px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  border-radius: 30px;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: scale(1.08) translateY(-10px) rotate(2deg);
    background: rgba(255, 255, 255, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, 
      ${props => props.borderColor}66, 
      transparent,
      ${props => props.borderColor}66
    );
    border-radius: 32px;
    z-index: -1;
    animation: ${shine} 6s linear infinite;
  }
`;

const PlayerImage = styled.div`
  width: 220px;
  height: 220px;
  border-radius: 30px;
  overflow: hidden;
  position: relative;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.3),
    0 15px 50px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  border: 5px solid ${props => props.borderColor};
  transition: all 0.4s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: ${shine} 3s infinite;
  }

  ${PlayerCard}:hover & {
    box-shadow: 
      0 15px 40px rgba(0, 0, 0, 0.4),
      0 20px 60px rgba(0, 0, 0, 0.3);
    border-width: 6px;
    
    img {
      transform: scale(1.15) rotate(2deg);
    }
  }
`;

const PlayerName = styled.div`
  font-size: 2.2em;
  color: white;
  text-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.3);
  margin-top: 20px;
  font-weight: bold;
  transition: all 0.4s ease;
  position: relative;

  &::before {
    content: '🌟';
    position: absolute;
    left: -35px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8em;
    opacity: 0;
    transition: all 0.3s ease;
  }

  &::after {
    content: '🌟';
    position: absolute;
    right: -35px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8em;
    opacity: 0;
    transition: all 0.3s ease;
  }

  ${PlayerCard}:hover & {
    transform: translateY(2px);
    text-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.6),
      0 6px 16px rgba(0, 0, 0, 0.4);

    &::before, &::after {
      opacity: 1;
    }
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
  animation: ${bubbleFloat} ${props => props.duration}s linear infinite;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  left: ${props => props.left}%;
  opacity: 0.4;
  backdrop-filter: blur(2px);
  box-shadow: inset 0 0 10px rgba(255,255,255,0.3);
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

const PlayerSelect = ({ onSelectPlayer }) => {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    const newBubbles = Array.from({ length: 30 }, (_, i) => ({
      size: Math.random() * 60 + 20,
      left: Math.random() * 100,
      duration: Math.random() * 15 + 8,
      delay: Math.random() * 10,
      key: i
    }));
    setBubbles(newBubbles);
  }, []);

  return (
    <Container>
      <FloatingBubbles>
        {bubbles.map(bubble => (
          <Bubble
            key={bubble.key}
            size={bubble.size}
            left={bubble.left}
            duration={bubble.duration}
            style={{ animationDelay: `${bubble.delay}s` }}
          />
        ))}
      </FloatingBubbles>
      <TitleContainer>
        <MainTitle>James' & Madison's</MainTitle>
        <Subtitle>Bubble Adventure</Subtitle>
      </TitleContainer>
      <PlayerGrid>
        {players.map(player => (
          <PlayerCard
            key={player.name}
            onClick={() => onSelectPlayer(player)}
            borderColor={player.color}
          >
            <PlayerImage borderColor={player.color}>
              <img src={player.image} alt={player.name} />
            </PlayerImage>
            <PlayerName>{player.emoji} {player.name}</PlayerName>
          </PlayerCard>
        ))}
      </PlayerGrid>
    </Container>
  );
};

export default PlayerSelect;
