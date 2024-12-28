#!/bin/bash

# Create sounds directory if it doesn't exist
mkdir -p public/sounds

# Download sound files
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/pop.mp3" -o public/sounds/pop.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/combo.mp3" -o public/sounds/combo.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/powerup.mp3" -o public/sounds/powerup.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/gameover.mp3" -o public/sounds/gameover.mp3
