// This utility generates game sounds programmatically using Web Audio API
export function generateGameSounds() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  function createOscillator(frequency, type, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return { oscillator, gainNode };
  }

  // Generate pop sound
  function generatePopSound() {
    const duration = 0.1;
    const { oscillator, gainNode } = createOscillator(400, 'sine', duration);
    
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + duration);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    
    return audioContext.startRendering();
  }

  // Generate match sound
  function generateMatchSound() {
    const duration = 0.2;
    const { oscillator, gainNode } = createOscillator(600, 'sine', duration);
    
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + duration);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    
    return audioContext.startRendering();
  }

  // Generate combo sound
  function generateComboSound() {
    const duration = 0.3;
    const { oscillator, gainNode } = createOscillator(800, 'square', duration);
    
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + duration);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    
    return audioContext.startRendering();
  }

  // Generate hover sound
  function generateHoverSound() {
    const duration = 0.05;
    const { oscillator, gainNode } = createOscillator(300, 'sine', duration);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    
    return audioContext.startRendering();
  }

  // Generate game over sound
  function generateGameOverSound() {
    const duration = 0.5;
    const { oscillator, gainNode } = createOscillator(400, 'sawtooth', duration);
    
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + duration);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    
    return audioContext.startRendering();
  }

  // Generate background music
  function generateBackgroundMusic() {
    const duration = 4;
    const { oscillator, gainNode } = createOscillator(200, 'sine', duration);
    
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    const lfo = audioContext.createOscillator();
    lfo.frequency.setValueAtTime(2, audioContext.currentTime);
    const lfoGain = audioContext.createGain();
    lfoGain.gain.setValueAtTime(10, audioContext.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    oscillator.start();
    lfo.start();
    oscillator.stop(audioContext.currentTime + duration);
    lfo.stop(audioContext.currentTime + duration);
    
    return audioContext.startRendering();
  }

  return {
    generatePopSound,
    generateMatchSound,
    generateComboSound,
    generateHoverSound,
    generateGameOverSound,
    generateBackgroundMusic
  };
}
