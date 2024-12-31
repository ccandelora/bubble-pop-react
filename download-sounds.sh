
#!/bin/bash

# Create sounds directory if it doesn't exist
mkdir -p public/sounds

# Download all required sound files
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/pop.mp3" -o public/sounds/pop.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/combo.mp3" -o public/sounds/combo.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/powerup.mp3" -o public/sounds/powerup.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/gameover.mp3" -o public/sounds/gameover.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/intro-song.mp3" -o public/sounds/intro-song.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/james-song.mp3" -o public/sounds/james-song.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/madi-song.mp3" -o public/sounds/madi-song.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/end-song.mp3" -o public/sounds/end-song.mp3
curl -L "https://github.com/codeium/cascade-assets/raw/main/sounds/victory.mp3" -o public/sounds/victory.mp3
