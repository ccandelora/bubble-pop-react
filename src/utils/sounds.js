// Map to store all audio elements
const audioElements = new Map();

// Mute state for different audio categories
const muteState = {
    music: false,
    effects: false
};

// Sound categories
const SOUND_CATEGORIES = {
    music: ['intro-song', 'madi-song', 'james-song', 'end-song'],
    effects: ['powerup', 'pop']
};

// Track initialization state
let isInitialized = false;

// Initialize sounds
export function initSounds() {
    // Prevent multiple initializations
    if (isInitialized) {
        console.log('Sounds already initialized, skipping...');
        return;
    }

    console.log('Initializing sounds...');
    
    // Create and configure audio elements for each sound
    const sounds = [
        { name: 'intro-song', loop: true, category: 'music' },
        { name: 'madi-song', loop: false, category: 'music' },
        { name: 'james-song', loop: false, category: 'music' },
        { name: 'end-song', loop: false, category: 'music' },
        { name: 'powerup', loop: false, category: 'effects' },
        { name: 'pop', loop: false, category: 'effects' }
    ];

    sounds.forEach(sound => {
        const audio = new Audio(`/sounds/${sound.name}.mp3`);
        audio.loop = sound.loop;
        audio.volume = 1.0;
        console.log(`Loading sound: ${sound.name}.mp3`);
        
        audio.addEventListener('play', () => console.log(`${sound.name} started playing`));
        audio.addEventListener('error', (e) => console.error(`Error loading ${sound.name}:`, e));
        
        audioElements.set(sound.name, {
            audio,
            category: sound.category
        });
    });

    isInitialized = true;
    console.log('Sound initialization complete');
}

// Play a sound
export function playSound(soundName, shouldLoop = false) {
    console.log(`Attempting to play sound: ${soundName}, loop: ${shouldLoop}`);
    const audioInfo = audioElements.get(soundName);
    if (audioInfo) {
        const { audio, category } = audioInfo;
        
        // Check if the sound's category is muted
        if (muteState[category]) {
            console.log(`${category} is muted, not playing ${soundName}`);
            return;
        }

        // Stop any currently playing sounds in the same category
        stopSoundsInCategory(category);

        audio.loop = shouldLoop;
        audio.currentTime = 0;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => console.log(`Successfully playing ${soundName}`))
                .catch(error => {
                    console.error(`Failed to play ${soundName}:`, error);
                    if (error.name === 'NotAllowedError') {
                        console.log('Autoplay prevented. User interaction required.');
                    }
                });
        }
    } else {
        console.warn(`Sound ${soundName} not found`);
    }
}

// Stop all sounds in a specific category
function stopSoundsInCategory(category) {
    console.log(`Stopping all sounds in category: ${category}`);
    audioElements.forEach(({ audio, category: soundCategory }) => {
        if (soundCategory === category) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

// Stop all sounds
export function stopAllSounds() {
    console.log('Stopping all sounds');
    audioElements.forEach(({ audio }) => {
        audio.pause();
        audio.currentTime = 0;
    });
}

// Toggle mute for a specific category
export function toggleMute(category) {
    console.log(`Toggling mute for ${category}`);
    if (category in muteState) {
        muteState[category] = !muteState[category];
        
        // If muting, stop all sounds in that category
        if (muteState[category]) {
            stopSoundsInCategory(category);
        }
        
        return muteState[category];
    }
    return false;
}

// Get mute state for a category
export function isMuted(category) {
    return muteState[category] || false;
}

// Initialize sounds when the module loads
initSounds();
