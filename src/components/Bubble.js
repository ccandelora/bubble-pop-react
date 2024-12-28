import React from 'react';
import styled, { keyframes, css } from 'styled-components';

const pop = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
  100% { transform: scale(0); opacity: 0; }
`;

const sparkle = keyframes`
  0% { filter: brightness(1) saturate(1); }
  50% { filter: brightness(1.5) saturate(1.5); }
  100% { filter: brightness(1) saturate(1); }
`;

const rainbow = keyframes`
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
`;

const BubbleContainer = styled.div`
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  pointer-events: auto;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const BubbleContent = styled.div`
  position: absolute;
  top: 5%;
  left: 5%;
  right: 5%;
  bottom: 5%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const BubbleCircle = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${props => props.$color};
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 
    inset -4px -4px 8px rgba(0,0,0,0.3),
    inset 4px 4px 8px rgba(255,255,255,0.4),
    0 4px 8px rgba(0,0,0,0.2);
  animation: ${props => props.$isPopping ? css`${pop} 0.3s ease-out forwards` : 'none'},
           ${props => props.$isRainbow ? css`${rainbow} 2s linear infinite` : 'none'},
           ${props => props.$hasSparkle ? css`${sparkle} 0.5s ease-in-out infinite` : 'none'};

  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 15%;
    width: 25%;
    height: 25%;
    background: rgba(255,255,255,0.9);
    border-radius: 50%;
    filter: blur(2px);
  }

  ${props => props.$isRainbow && css`
    background: linear-gradient(
      45deg,
      #FF0000,
      #FF8000,
      #FFFF00,
      #00FF00,
      #00FFFF,
      #0000FF,
      #FF00FF
    );
    background-size: 200% 200%;
  `}

  ${props => props.$hasSparkle && css`
    &::after {
      content: '✨';
      position: absolute;
      font-size: 1.2em;
      animation: ${sparkle} 0.5s ease-in-out infinite;
    }
  `}
`;

const PowerUpIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5em;
  animation: ${sparkle} 1s ease-in-out infinite;
  z-index: 2;
  text-shadow: 0 0 5px white;
`;

const powerUpEmojis = {
  unicorn: '🦄',
  butterfly: '🦋',
  star: '⭐',
  rainbow: '🌈'
};

const Bubble = ({ color, onClick, isPopping, isRainbow, hasSparkle, hasPowerUp, powerUpType }) => {
  const handleClick = (event) => {
    event.stopPropagation();
    onClick(event);
  };

  return (
    <BubbleContainer onClick={handleClick}>
      <BubbleContent>
        <BubbleCircle
          $color={color}
          $isPopping={isPopping}
          $isRainbow={isRainbow}
          $hasSparkle={hasSparkle}
        />
        {hasPowerUp && (
          <PowerUpIndicator>
            {powerUpEmojis[powerUpType] || '✨'}
          </PowerUpIndicator>
        )}
      </BubbleContent>
    </BubbleContainer>
  );
};

export default Bubble;
