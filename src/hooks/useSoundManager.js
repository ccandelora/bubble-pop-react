import { useEffect, useCallback, useRef, useState } from 'react';

class SoundEffect {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  createSound(type) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    switch (type) {
      case 'pop':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        break;
        
      case 'match':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        break;
        
      case 'combo':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        break;
        
      case 'hover':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        break;
        
      case 'gameOver':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        break;
        
      default:
        break;
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    return { oscillator, gainNode };
  }

  play(type, volume = 1) {
    // Resume audio context if it's suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const { oscillator, gainNode } = this.createSound(type);
    gainNode.gain.value *= volume;
    
    oscillator.start();
    
    const duration = type === 'gameOver' ? 0.5 : 
                    type === 'combo' ? 0.3 :
                    type === 'match' ? 0.2 :
                    type === 'hover' ? 0.05 : 0.1;
                    
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}

export function useSoundManager() {
  const soundEffect = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    soundEffect.current = new SoundEffect();
    
    // Cleanup
    return () => {
      if (soundEffect.current && soundEffect.current.audioContext) {
        soundEffect.current.audioContext.close();
      }
    };
  }, []);

  const playSound = useCallback((type, volume = 1) => {
    if (!isMuted && soundEffect.current) {
      try {
        soundEffect.current.play(type, volume);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    playSound,
    isMuted,
    toggleMute
  };
}
