import * as BABYLON from '@babylonjs/core';

export const GAME_CONFIG = {
    GRID: {
        ROWS: 8,
        COLS: 10,
        BUBBLE_SIZE: 1.5,
        SPACING: 0.3
    },
    VIEWPORT: {
        HEIGHT: 12,
        ASPECT_RATIO: 1.33
    },
    POWERUPS: {
        UNICORN: {
            CHANCE: 0.05,  // 5% chance for unicorn bubble
            TEXTURE: "textures/unicorn.png"
        },
        SUPERHERO: {
            CHANCE: 0.05,  // 5% chance for superhero bubble
            TEXTURE: "textures/superhero.png",
            RADIUS: 3      // Affects bubbles within 3 spaces
        },
        PRINCESS: {
            CHANCE: 0.05,  // 5% chance for princess bubble
            TEXTURE: "textures/princess.png",
            RADIUS: 4      // Heart-shaped blast radius
        },
        PRINCE: {
            CHANCE: 0.05,  // 5% chance for prince bubble
            TEXTURE: "textures/prince.png",
            RADIUS: 3      // Crown-shaped blast radius
        }
    },
    SCORING: {
        BASE_SCORE: 10,
        POWERUP_MULTIPLIER: 2,
        CLUSTER_MULTIPLIER: 1.5
    }
};

export const GAME_STATES = {
    INIT: 'init',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

export const BUBBLE_TYPES = {
    NORMAL: 'normal',
    UNICORN: 'unicorn',    // Rainbow magic that clears all bubbles of one color
    SUPERHERO: 'superhero', // Super blast that clears bubbles in a big area
    PRINCESS: 'princess',   // Creates a magical heart-shaped blast that clears bubbles
    PRINCE: 'prince'       // Creates a crown-shaped blast that turns nearby bubbles to gold
};

export const LEVEL_REQUIREMENTS = {
    1: { target: 100, moves: 20 },
    2: { target: 250, moves: 18 },
    3: { target: 500, moves: 15 }
};

export const colors = [
    new BABYLON.Color3(1, 0.4, 0.4),    // Soft Red
    new BABYLON.Color3(0.4, 0.6, 1),    // Sky Blue
    new BABYLON.Color3(0.5, 0.9, 0.4),  // Bright Green
    new BABYLON.Color3(1, 0.8, 0.2),    // Sunny Yellow
    new BABYLON.Color3(0.9, 0.5, 1),    // Soft Purple
    new BABYLON.Color3(0.4, 0.9, 0.9)   // Turquoise
]; 