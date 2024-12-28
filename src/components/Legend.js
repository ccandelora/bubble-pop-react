import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const LegendWrapper = styled.div`
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100;
`;

const LegendContainer = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border-radius: 15px;
  padding: 15px;
  color: white;
  font-size: 0.9em;
  max-width: 200px;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transform-origin: bottom right;
  transition: all 0.3s ease-in-out;
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  opacity: ${props => props.isOpen ? 1 : 0};
  transform: scale(${props => props.isOpen ? 1 : 0.8});
  height: ${props => props.isOpen ? 'auto' : '0'};
  margin-bottom: 10px;
  overflow: hidden;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  border: none;
  border-radius: 10px;
  color: white;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9em;
  backdrop-filter: blur(5px);
  transition: all 0.2s ease;
  z-index: 101;

  &:hover {
    transform: scale(1.05);
    background: rgba(0, 0, 0, 0.9);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 16px;
    height: 16px;
    transition: transform 0.3s ease;
    transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
  }
`;

const Title = styled.h3`
  margin: 0 0 10px 0;
  font-size: 1.1em;
  color: #FFD700;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
`;

const PowerUpItem = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0;
  gap: 10px;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: translateX(${props => props.isVisible ? 0 : '20px'});
  transition: all 0.3s ease-in-out;
  transition-delay: ${props => props.delay}ms;
`;

const PowerUpEmoji = styled.span`
  font-size: 1.5em;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
`;

const PowerUpDescription = styled.span`
  font-size: 0.9em;
  color: #f0f0f0;
`;

const powerUps = [
  {
    emoji: '🦄',
    name: 'Unicorn Magic',
    description: 'Turns nearby bubbles into rainbow colors'
  },
  {
    emoji: '🦋',
    name: 'Butterfly Swirl',
    description: 'Creates a swirling effect that pops bubbles'
  },
  {
    emoji: '⭐',
    name: 'Shooting Star',
    description: 'Clears a row of bubbles with sparkles'
  },
  {
    emoji: '🌈',
    name: 'Rainbow Burst',
    description: 'Creates a colorful explosion'
  }
];

const Legend = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleItems, setVisibleItems] = useState(Array(powerUps.length).fill(false));

  useEffect(() => {
    if (isOpen) {
      // Animate items in sequence when opening
      powerUps.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems(prev => {
            const newItems = [...prev];
            newItems[index] = true;
            return newItems;
          });
        }, index * 100);
      });
    } else {
      // Reset visibility when closing
      setVisibleItems(Array(powerUps.length).fill(false));
    }
  }, [isOpen]);

  return (
    <LegendWrapper>
      <ToggleButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        <span>❓</span>
        <span>Power-Ups</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </ToggleButton>
      <LegendContainer isOpen={isOpen}>
        <Title>
          <span>✨</span>
          Power-Ups Guide
        </Title>
        {powerUps.map((powerUp, index) => (
          <PowerUpItem 
            key={powerUp.name}
            isVisible={visibleItems[index]}
            delay={index * 100}
          >
            <PowerUpEmoji>{powerUp.emoji}</PowerUpEmoji>
            <PowerUpDescription>
              <strong>{powerUp.name}:</strong> {powerUp.description}
            </PowerUpDescription>
          </PowerUpItem>
        ))}
      </LegendContainer>
    </LegendWrapper>
  );
};

export default Legend;
