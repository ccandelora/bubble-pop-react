import { BubblePopGame } from './Game';
import { PlayerSelect } from './PlayerSelect';
import './styles.css';

let currentGame = null;
let playerSelect = null;

function startGame(playerName) {
    console.log(`Starting game for player: ${playerName}`);
    
    // Clean up player select if it exists
    if (playerSelect) {
        console.log('Disposing player select screen');
        playerSelect.dispose();
        playerSelect = null;
    }

    // Clean up existing game if it exists
    if (currentGame) {
        console.log('Disposing existing game');
        currentGame.dispose();
    }

    try {
        // Create new game instance
        console.log('Creating new game instance');
        const canvas = document.getElementById('renderCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found!');
        }
        currentGame = new BubblePopGame(canvas, playerName);

        // Handle game over
        currentGame.onGameOver = (score) => {
            console.log(`Game over! Score: ${score}`);
            setTimeout(() => {
                // Return to player select
                showPlayerSelect();
            }, 2000);
        };
    } catch (error) {
        console.error('Error starting game:', error);
    }
}

function showPlayerSelect() {
    console.log('Showing player select screen');
    
    // Clean up existing game if it exists
    if (currentGame) {
        console.log('Disposing existing game');
        currentGame.dispose();
        currentGame = null;
    }

    try {
        const canvas = document.getElementById('renderCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found!');
        }
        console.log('Creating player select screen');
        playerSelect = new PlayerSelect(canvas, (selectedPlayer) => {
            console.log(`Player selected: ${selectedPlayer}`);
            startGame(selectedPlayer);
        });
    } catch (error) {
        console.error('Error showing player select:', error);
    }
}

// Start with player select screen
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game');
    showPlayerSelect();
});
