// Create audio context lazily
let audioContext = null;

// Sound cache
const soundCache = new Map();

// Sound URLs - using verified working files
const SOUND_URLS = {
  pop: '/sounds/pop.mp3',
  powerup: '/sounds/combo.mp3', // Using combo sound for powerup
  explosion: '/sounds/explosion.mp3',
  magic: '/sounds/magic.mp3',
  chain: '/sounds/chain.mp3',
  gameOver: '/sounds/gameover.mp3'
};

// Initialize audio context on first user interaction
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Resume audio context if it's suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }
  return audioContext;
};

// Load and cache a sound with better error handling
const loadSound = async (soundName) => {
  if (!audioContext) {
    console.warn('Audio context not initialized yet');
    return null;
  }

  if (!soundCache.has(soundName)) {
    try {
      const response = await fetch(SOUND_URLS[soundName]);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Sound file is empty');
      }
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      soundCache.set(soundName, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound: ${soundName}`, error);
      // Try to load a fallback sound if the primary one fails
      if (soundName === 'pop') {
        console.log('Attempting to load fallback pop sound...');
        return loadSound('chain');
      }
      return null;
    }
  }
  return soundCache.get(soundName);
};

// Initialize sounds after user interaction with better error handling
export const initSounds = async () => {
  try {
    initAudioContext();
    // Preload all sounds
    await Promise.all(Object.keys(SOUND_URLS).map(loadSound));
    console.log('All sounds initialized successfully');
  } catch (error) {
    console.error('Error initializing sounds:', error);
  }
};

export const playSound = async (soundName) => {
  if (!audioContext) {
    initAudioContext();
  }

  try {
    const buffer = await loadSound(soundName);
    if (buffer && audioContext) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.7; // 70% volume
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start(0);
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

export default SOUND_URLS;
