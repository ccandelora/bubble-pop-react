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

export const playSound = (soundName, isMuted, delay = 0) => {
  if (isMuted) return;
  
  const sound = sounds[soundName];
  if (!sound) return;

  // Reset the audio to start
  sound.currentTime = 0;
  
  // Play the sound after the specified delay
  setTimeout(() => {
    sound.play().catch(err => console.error('Error playing sound:', err));
  }, delay);
};

export default sounds;
