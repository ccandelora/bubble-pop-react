const sounds = {
  pop: new Audio('/sounds/pop.mp3'),
  combo: new Audio('/sounds/combo.mp3'),
  powerup: new Audio('/sounds/powerup.mp3'),
  gameOver: new Audio('/sounds/gameover.mp3')
};

// Pre-load sounds and set volume
Object.values(sounds).forEach(sound => {
  sound.load();
  sound.volume = 0.3;
});

export const playSound = (soundName, isMuted = false) => {
  if (isMuted) return;
  
  const sound = sounds[soundName];
  if (sound) {
    // Reset the audio to start
    sound.currentTime = 0;
    // Create a promise to handle autoplay restrictions
    const playPromise = sound.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Auto-play was prevented, we'll need user interaction first
        console.log('Audio playback requires user interaction first');
      });
    }
  }
};

export default sounds;
