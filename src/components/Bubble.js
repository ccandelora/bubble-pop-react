import React from 'react';
import styled, { keyframes } from 'styled-components';

const pop = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
    filter: blur(0px);
  }
  10% {
    transform: scale(1.1);
    opacity: 1;
    filter: blur(0px);
  }
  30% {
    transform: scale(1.15);
    opacity: 0.9;
    filter: blur(1px);
  }
  50% {
    transform: scale(0.9);
    opacity: 0.7;
    filter: blur(2px);
  }
  70% {
    transform: scale(0.7);
    opacity: 0.4;
    filter: blur(3px);
  }
  100% {
    transform: scale(0.1);
    opacity: 0;
    filter: blur(4px);
  }
`;

const burst = keyframes`
  0% {
    transform: scale(1);
    opacity: 0;
  }
  20% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
`;

const float = keyframes`
  0% { 
    transform: translateY(0) rotate(0deg) scale(1); 
  }
  25% { 
    transform: translateY(-3px) rotate(1deg) scale(1.02); 
  }
  50% { 
    transform: translateY(-5px) rotate(2deg) scale(1.03); 
  }
  75% { 
    transform: translateY(-3px) rotate(1deg) scale(1.02); 
  }
  100% { 
    transform: translateY(0) rotate(0deg) scale(1); 
  }
`;

const shine = keyframes`
  0% {
    opacity: 0.5;
    transform: scale(1) translateX(0);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1) translateX(2px);
  }
  100% {
    opacity: 0.5;
    transform: scale(1) translateX(0);
  }
`;

const BubbleContainer = styled.div`
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.92);
  }
`;

const BubbleContent = styled.div`
  position: absolute;
  top: 2%;
  left: 2%;
  right: 2%;
  bottom: 2%;
  border-radius: 50%;
  background: ${props => props.$color};
  opacity: ${props => props.isPopping ? 0 : 0.85};
  animation: ${props => props.isPopping ? pop : float} ${props => props.isPopping ? '0.45s' : '4s'} 
    ${props => props.isPopping ? 'cubic-bezier(0.36, 0, 0.66, -0.56)' : 'ease-in-out'} 
    ${props => props.isPopping ? 'forwards' : 'infinite'};
  box-shadow: 
    inset -4px -4px 8px rgba(0, 0, 0, 0.2),
    inset 4px 4px 12px rgba(255, 255, 255, 0.3),
    0 0 15px rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  transform-origin: center center;
  
  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 20%;
    width: 25%;
    height: 25%;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.6),
      rgba(255, 255, 255, 0.2)
    );
    border-radius: 50%;
    filter: blur(2px);
    animation: ${shine} 3s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 25%;
    left: 30%;
    width: 12%;
    height: 12%;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    filter: blur(1px);
    animation: ${shine} 3s ease-in-out infinite reverse;
  }
`;

const BurstEffect = styled.div`
  position: absolute;
  top: -5%;
  left: -5%;
  right: -5%;
  bottom: -5%;
  border-radius: 50%;
  border: 2px solid ${props => props.$color}aa;
  opacity: 0;
  animation: ${props => props.$isPopping ? burst : 'none'} 0.35s cubic-bezier(0.36, 0, 0.66, -0.56) forwards;
  animation-delay: 0.1s;
  pointer-events: none;
  filter: blur(0.5px);
`;

const Bubble = ({ color, isPopping, onClick }) => {
  return (
    <BubbleContainer onClick={onClick}>
      <BubbleContent $color={color} isPopping={isPopping} />
      <BurstEffect $color={color} $isPopping={isPopping} />
      <BurstEffect 
        $color={color} 
        $isPopping={isPopping} 
        style={{ 
          animationDelay: '0.15s',
          transform: 'scale(0.95) rotate(45deg)'
        }} 
      />
      <BurstEffect 
        $color={color} 
        $isPopping={isPopping} 
        style={{ 
          animationDelay: '0.2s',
          transform: 'scale(0.9) rotate(-45deg)'
        }} 
      />
    </BubbleContainer>
  );
};

export default Bubble;
