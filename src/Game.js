import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import '@babylonjs/loaders';
import '@babylonjs/inspector';
import { playSound, initSounds } from './utils/sounds';
import { CelebrationScreen } from './CelebrationScreen';

// Game constants
const GAME_CONFIG = {
    GRID: {
        ROWS: 8,
        COLS: 10,
        BUBBLE_SIZE: 0.8,
        SPACING: 0.2
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

const GAME_STATES = {
    INIT: 'init',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

const BUBBLE_TYPES = {
    NORMAL: 'normal',
    UNICORN: 'unicorn',    // Rainbow magic that clears all bubbles of one color
    SUPERHERO: 'superhero', // Super blast that clears bubbles in a big area
    PRINCESS: 'princess',   // Creates a magical heart-shaped blast that clears bubbles
    PRINCE: 'prince'       // Creates a crown-shaped blast that turns nearby bubbles to gold
};

const LEVEL_REQUIREMENTS = {
    1: { target: 100, moves: 20 },
    2: { target: 250, moves: 18 },
    3: { target: 500, moves: 15 }
};

const colors = [
    new BABYLON.Color3(1, 0.4, 0.4),    // Soft Red
    new BABYLON.Color3(0.4, 0.6, 1),    // Sky Blue
    new BABYLON.Color3(0.5, 0.9, 0.4),  // Bright Green
    new BABYLON.Color3(1, 0.8, 0.2),    // Sunny Yellow
    new BABYLON.Color3(0.9, 0.5, 1),    // Soft Purple
    new BABYLON.Color3(0.4, 0.9, 0.9)   // Turquoise
];

export class BubblePopGame {
    constructor(canvas, playerName) {
        this.canvas = canvas;
        this.playerName = playerName;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.gameState = {
            state: GAME_STATES.INIT,
            score: 0,
            level: 1,
            movesLeft: LEVEL_REQUIREMENTS[1].moves,
            grid: this.createEmptyGrid(),
            isMuted: false,
            isProcessingMatch: false,
            playerName: playerName
        };
        this.gui = null;
        this.scoreText = null;
        this.levelText = null;
        this.movesText = null;
        this.playerText = null;
        this.onGameOver = null;
        this.disposedMeshes = new Set();

        // Initialize the game
        this.initialize();
    }

    createEmptyGrid() {
        return Array(GAME_CONFIG.GRID.ROWS).fill().map(() => Array(GAME_CONFIG.GRID.COLS).fill(null));
    }

    async initialize() {
        // Create engine
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true,
            adaptToDeviceRatio: true,
            powerPreference: "high-performance"
        });

        // Create scene
        this.scene = new BABYLON.Scene(this.engine);
        
        // Setup camera first
        this.setupCamera();

        // Setup lighting
        this.setupLighting();

        // Initialize GUI (renderingGroupId = 1)
        await this.setupGUI();

        // Initialize sounds
        await initSounds();

        // Create bubble grid first
        this.createBubbleGrid();

        // Create background last (so it's behind everything)
        await this.setupBackground();

        // Start game loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.update();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        // Set game state to playing
        this.gameState.state = GAME_STATES.PLAYING;
    }

    async setupBackground() {
        // Create a background plane that fills the view
        const backgroundPlane = BABYLON.MeshBuilder.CreatePlane("backgroundPlane", {
            width: 20,
            height: 12
        }, this.scene);

        // Position it behind everything
        backgroundPlane.position.z = -5;

        // Create material for the background
        const backgroundMaterial = new BABYLON.StandardMaterial("backgroundMaterial", this.scene);
        
        // Load the appropriate background texture
        const backgroundTexture = new BABYLON.Texture(
            this.playerName.toLowerCase() === "madison" 
                ? "/images/princess.webp" 
                : "/images/marvel.webp",
            this.scene
        );
        
        // Configure the material
        backgroundMaterial.diffuseTexture = backgroundTexture;
        backgroundMaterial.specularColor = BABYLON.Color3.Black();
        backgroundMaterial.backFaceCulling = false;
        
        // Apply the material to the plane
        backgroundPlane.material = backgroundMaterial;
    }

    setupCamera() {
        // Create a perspective camera
        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI / 2,     // Alpha (horizontal rotation) - 90 degrees
            Math.PI / 2,     // Beta (vertical rotation) - 90 degrees
            20,             // Radius (distance)
            new BABYLON.Vector3(0, 0, 0),
            this.scene
        );
        
        // Lock camera rotation
        this.camera.lowerBetaLimit = this.camera.upperBetaLimit = Math.PI / 2;
        this.camera.lowerAlphaLimit = this.camera.upperAlphaLimit = Math.PI / 2;
        
        // Disable camera controls
        this.camera.inputs.clear();
    }

    setupLighting() {
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, -1),
            this.scene
        );
        light.intensity = 0.7;
    }

    async setupGUI() {
        this.gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.gui.renderingGroupId = 1;  // Set GUI to render behind bubbles

        // Create player name text
        this.playerText = new GUI.TextBlock();
        this.playerText.text = `Player: ${this.playerName}`;
        this.playerText.color = "white";
        this.playerText.fontSize = 50;
        this.playerText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.playerText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.playerText.top = "50px";
        this.playerText.zIndex = -1;  // Put text behind bubbles
        this.gui.addControl(this.playerText);

        // Create score text
        this.scoreText = new GUI.TextBlock();
        this.scoreText.text = `Score: ${this.gameState.score}`;
        this.scoreText.color = "white";
        this.scoreText.fontSize = 50;
        this.scoreText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.scoreText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.scoreText.top = "50px";
        this.scoreText.left = "50px";
        this.scoreText.zIndex = -1;  // Put text behind bubbles
        this.gui.addControl(this.scoreText);

        // Create moves text
        this.movesText = new GUI.TextBlock();
        this.movesText.text = `Moves: ${this.gameState.movesLeft}`;
        this.movesText.color = "white";
        this.movesText.fontSize = 24;
        this.movesText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.movesText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.movesText.top = "20px";
        this.movesText.right = "20px";
        this.movesText.zIndex = -1;  // Put text behind bubbles
        this.gui.addControl(this.movesText);
    }

    createBubbleGrid() {
        for (let row = 0; row < GAME_CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.GRID.COLS; col++) {
                this.createBubble(row, col);
            }
        }
    }

    createBubble(row, col, isNew = false) {
        const bubbleSize = GAME_CONFIG.GRID.BUBBLE_SIZE;
        const spacing = GAME_CONFIG.GRID.SPACING;
        
        const totalWidth = GAME_CONFIG.GRID.COLS * (bubbleSize + spacing);
        const totalHeight = GAME_CONFIG.GRID.ROWS * (bubbleSize + spacing);
        const startX = -totalWidth / 2 + bubbleSize / 2;
        const startY = totalHeight / 2 - bubbleSize / 2;
        
        const x = startX + col * (bubbleSize + spacing);
        const y = isNew ? startY + bubbleSize * 2 : startY - row * (bubbleSize + spacing);
        
        // Create bubble mesh with more segments for smoother look
        const bubble = BABYLON.MeshBuilder.CreateSphere(
            `bubble-${row}-${col}`,
            { diameter: bubbleSize, segments: 32 },
            this.scene
        );

        // Position bubble in the grid
        bubble.position = new BABYLON.Vector3(x, y, 0);
        
        // Create material with simpler properties
        const material = new BABYLON.StandardMaterial(`bubble-mat-${row}-${col}`, this.scene);
        const colorIndex = Math.floor(Math.random() * colors.length);
        
        // Material settings for better visibility
        material.diffuseColor = colors[colorIndex];
        material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material.specularPower = 32;
        material.emissiveColor = colors[colorIndex].scale(0.5);
        material.alpha = 1.0;
        material.backFaceCulling = false;

        // Add click handler
        bubble.actionManager = new BABYLON.ActionManager(this.scene);
        bubble.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => this.handleBubbleClick(row, col)
            )
        );

        // Assign material and store bubble data
        bubble.material = material;
        bubble.isPickable = true;

        // Store bubble data
        this.gameState.grid[row][col] = {
            mesh: bubble,
            color: colorIndex,
            type: BUBBLE_TYPES.NORMAL,
            isPopped: false,
            gridPosition: { row, col }
        };

        return this.gameState.grid[row][col];
    }

    addPowerupEffects(bubble, bubbleType) {
        const bubbleSize = GAME_CONFIG.GRID.BUBBLE_SIZE;
        
        // Create a dynamic texture for the emoji
        const textureSize = 512; // Keep good quality but reduce overall size
        const dynamicTexture = new BABYLON.DynamicTexture("emojiTexture", textureSize, this.scene, true);
        const ctx = dynamicTexture.getContext();
        
        // Clear the canvas with full transparency
        ctx.clearRect(0, 0, textureSize, textureSize);
        
        // Choose emoji based on powerup type
        let emoji;
        switch (bubbleType) {
            case BUBBLE_TYPES.UNICORN:
                emoji = "🦄";
                break;
            case BUBBLE_TYPES.SUPERHERO:
                emoji = "⭐";
                break;
            case BUBBLE_TYPES.PRINCESS:
                emoji = "👑";
                break;
            case BUBBLE_TYPES.PRINCE:
                emoji = "🤴";
                break;
            default:
                emoji = "✨";
                break;
        }
        
        // Draw the emoji with multiple layers for better visibility
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 400px Arial"; // Smaller font size
        
        // Draw multiple outlines for better visibility
        const outlineColors = ["black", "white", "black"];
        const outlineSizes = [32, 24, 16]; // Thinner outlines
        
        outlineColors.forEach((color, index) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = outlineSizes[index];
            ctx.strokeText(emoji, textureSize/2, textureSize/2);
        });
        
        // Draw the emoji in bright white
        ctx.fillStyle = "white";
        ctx.fillText(emoji, textureSize/2, textureSize/2);
        
        // Update the dynamic texture
        dynamicTexture.hasAlpha = true;
        dynamicTexture.update();
        
        // Create a plane for the emoji that's smaller
        const plane = BABYLON.MeshBuilder.CreatePlane("powerupIcon", { size: bubbleSize * 0.8 }, this.scene);
        const material = new BABYLON.StandardMaterial("powerupMat", this.scene);
        
        // Set up material for transparency and full brightness
        material.diffuseTexture = dynamicTexture;
        material.emissiveTexture = dynamicTexture;
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        material.useAlphaFromDiffuseTexture = true;
        material.hasAlpha = true;
        material.backFaceCulling = false;
        material.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
        material.disableLighting = true;
        material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        
        plane.material = material;
        plane.parent = bubble;
        // Position the emoji just slightly in front of the bubble
        plane.position.z = bubbleSize * 0.6;
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        // Add a subtle floating animation
        const floatAnimation = new BABYLON.Animation(
            "floatAnimation",
            "position.z",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const keys = [];
        keys.push({ frame: 0, value: bubbleSize * 0.6 });
        keys.push({ frame: 30, value: bubbleSize * 0.7 });
        keys.push({ frame: 60, value: bubbleSize * 0.6 });
        
        floatAnimation.setKeys(keys);
        plane.animations = [floatAnimation];
        this.scene.beginAnimation(plane, 0, 60, true);

        // Add a subtle glow effect
        const emojiGlow = new BABYLON.GlowLayer("emojiGlow", this.scene, {
            mainTextureFixedSize: 512,
            blurKernelSize: 32
        });
        emojiGlow.intensity = 0.5;
        emojiGlow.addIncludedOnlyMesh(plane);

        // Ensure the plane renders on top but doesn't interfere with clicking
        plane.renderingGroupId = 1;
        bubble.renderingGroupId = 0;
        plane.isPickable = false;
    }

    handleBubbleClick(row, col) {
        console.log(`Clicked bubble at row: ${row}, col: ${col}`);
        
        // Prevent processing clicks while handling a match
        if (this.gameState.isProcessingMatch) {
            console.log('Already processing a match, ignoring click');
            return;
        }

        if (this.gameState.state !== GAME_STATES.PLAYING) {
            console.log('Game not in playing state');
            return;
        }
        
        if (this.gameState.movesLeft <= 0) {
            console.log('No moves left');
            return;
        }

        const clickedBubble = this.gameState.grid[row][col];
        if (!clickedBubble || clickedBubble.isPopped || this.disposedMeshes.has(clickedBubble.mesh)) {
            console.log('Invalid bubble or already popped');
            return;
        }

        let matchingBubbles = [];
        
        if (clickedBubble.type === BUBBLE_TYPES.UNICORN) {
            // Unicorn power: Pop all bubbles of a random color
            const randomColor = Math.floor(Math.random() * colors.length);
            matchingBubbles = this.findAllBubblesOfColor(randomColor);
            this.showUnicornEffect(clickedBubble);
        } else if (clickedBubble.type === BUBBLE_TYPES.SUPERHERO) {
            // Superhero power: Pop bubbles in a large radius
            matchingBubbles = this.findBubblesInRadius(row, col, GAME_CONFIG.POWERUPS.SUPERHERO.RADIUS);
            this.showSuperheroEffect(clickedBubble);
        } else if (clickedBubble.type === BUBBLE_TYPES.PRINCESS) {
            // Princess effect: Heart-shaped blast
            matchingBubbles = this.findBubblesInHeartShape(row, col, GAME_CONFIG.POWERUPS.PRINCESS.RADIUS);
            this.showPrincessEffect(clickedBubble);
        } else if (clickedBubble.type === BUBBLE_TYPES.PRINCE) {
            // Prince effect: Crown-shaped blast that turns bubbles golden
            matchingBubbles = this.findBubblesInCrownShape(row, col, GAME_CONFIG.POWERUPS.PRINCE.RADIUS);
            this.showPrinceEffect(clickedBubble);
        } else {
            // Normal bubble matching
            matchingBubbles = this.findMatchingBubbles(row, col);
        }

        if (matchingBubbles.length >= 3 || clickedBubble.type !== BUBBLE_TYPES.NORMAL) {
            this.gameState.isProcessingMatch = true; // Set processing flag

            // Create a map of bubbles to pop for quick lookup
            const bubblePositions = new Set(
                matchingBubbles.map(b => `${b.gridPosition.row},${b.gridPosition.col}`)
            );
            
            // Immediately disable all matching bubbles
            matchingBubbles.forEach(bubble => {
                if (bubble && bubble.mesh && !this.disposedMeshes.has(bubble.mesh)) {
                    bubble.isPopped = true;
                    bubble.mesh.isPickable = false;
                    // Add a visual indicator that this bubble is part of a match
                    bubble.mesh.material.emissiveColor = bubble.mesh.material.diffuseColor.scale(0.7);
                }
            });

            // Calculate score
            const points = matchingBubbles.length * GAME_CONFIG.SCORING.BASE_SCORE;
            this.gameState.score += points;
            this.gameState.movesLeft--;
            
            // Update UI immediately
            this.updateUI();
            
            // Pop all matching bubbles with a slight delay between each
            let popDelay = 0;
            const popPromises = matchingBubbles.map((bubble) => {
                return new Promise((resolve) => {
                    if (bubble && bubble.mesh && !this.disposedMeshes.has(bubble.mesh)) {
                        setTimeout(() => {
                            if (bubble && 
                                bubble.mesh && 
                                !this.disposedMeshes.has(bubble.mesh) && 
                                bubblePositions.has(`${bubble.gridPosition.row},${bubble.gridPosition.col}`)) {
                                this.popBubble(bubble);
                            }
                            resolve();
                        }, popDelay);
                        popDelay += 50;
                    } else {
                        resolve();
                    }
                });
            });

            // Wait for all pops to complete before applying gravity
            Promise.all(popPromises).then(() => {
                setTimeout(() => {
                    if (this.scene && !this.scene.isDisposed) {
                        this.applyGravity();
                    }
                    this.gameState.isProcessingMatch = false; // Clear processing flag
                }, 300);
            });
        } else {
            // If no match, provide visual feedback
            if (clickedBubble && clickedBubble.mesh && !this.disposedMeshes.has(clickedBubble.mesh)) {
                // Create a quick scale animation to show the bubble was clicked
                const quickPulse = new BABYLON.Animation(
                    "quickPulse",
                    "scaling",
                    60,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                );

                const pulseKeys = [];
                pulseKeys.push({
                    frame: 0,
                    value: clickedBubble.mesh.scaling.clone()
                });
                pulseKeys.push({
                    frame: 6,
                    value: clickedBubble.mesh.scaling.clone().scaleInPlace(1.2)
                });
                pulseKeys.push({
                    frame: 12,
                    value: clickedBubble.mesh.scaling.clone()
                });

                quickPulse.setKeys(pulseKeys);
                clickedBubble.mesh.animations = [quickPulse];
                this.scene.beginAnimation(clickedBubble.mesh, 0, 12, false);
            }
        }
    }

    findMatchingBubbles(row, col) {
        const clickedBubble = this.gameState.grid[row][col];
        if (!clickedBubble || !clickedBubble.mesh || clickedBubble.mesh._isDisposed || clickedBubble.isPopped) {
            console.log('Invalid bubble for matching');
            return [];
        }

        const matchingBubbles = [];
        const visited = Array(GAME_CONFIG.GRID.ROWS).fill().map(() => 
            Array(GAME_CONFIG.GRID.COLS).fill(false)
        );

        const checkBubble = (r, c) => {
            // Check bounds and visited state
            if (r < 0 || r >= GAME_CONFIG.GRID.ROWS || 
                c < 0 || c >= GAME_CONFIG.GRID.COLS || 
                visited[r][c]) {
                return;
            }

            visited[r][c] = true;
            const bubble = this.gameState.grid[r][c];
            
            // Validate bubble state and position
            if (!bubble || 
                !bubble.mesh || 
                bubble.mesh._isDisposed || 
                bubble.isPopped ||
                bubble.color !== clickedBubble.color ||
                bubble.gridPosition.row !== r ||
                bubble.gridPosition.col !== c) {
                return;
            }

            // Valid matching bubble found
            console.log(`Found matching bubble at row: ${r}, col: ${c}, color: ${bubble.color}`);
            matchingBubbles.push(bubble);

            // Only check orthogonal neighbors (no diagonals)
            checkBubble(r - 1, c); // Up
            checkBubble(r + 1, c); // Down
            checkBubble(r, c - 1); // Left
            checkBubble(r, c + 1); // Right
        };

        // Start the recursive check from the clicked bubble
        checkBubble(row, col);

        // Log the final matches for debugging
        if (matchingBubbles.length > 0) {
            console.log('Final matches:', matchingBubbles.map(b => 
                `(${b.gridPosition.row},${b.gridPosition.col})`).join(', '));
        }

        return matchingBubbles;
    }

    popBubble(bubble) {
        if (!bubble || !bubble.mesh || this.disposedMeshes.has(bubble.mesh)) {
            console.log('Invalid bubble for popping');
            return;
        }

        const { row, col } = bubble.gridPosition;
        console.log(`Popping bubble at row: ${row}, col: ${col}, color: ${bubble.color}`);
        
        // Disable picking immediately
        bubble.mesh.isPickable = false;
        
        // Clear grid position and mark mesh as disposed
        this.gameState.grid[row][col] = null;
        this.disposedMeshes.add(bubble.mesh);

        // Play pop sound
        if (!this.gameState.isMuted) {
            playSound('pop');
        }

        // Create sparkle particles
        const particleSystem = new BABYLON.ParticleSystem("bubblePop", 50, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("./textures/sparkle.png", this.scene);
        particleSystem.emitter = bubble.mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);

        // Particle colors based on bubble color
        const bubbleColor = bubble.mesh.material.diffuseColor;
        particleSystem.color1 = new BABYLON.Color4(1, 1, 1, 1); // Start white
        particleSystem.color2 = new BABYLON.Color4(
            bubbleColor.r,
            bubbleColor.g,
            bubbleColor.b,
            1
        );
        particleSystem.colorDead = new BABYLON.Color4(
            bubbleColor.r,
            bubbleColor.g,
            bubbleColor.b,
            0
        );

        // Particle behavior
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.0;
        particleSystem.emitRate = 100;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI * 2;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 2;
        particleSystem.updateSpeed = 0.02;

        // Create star burst effect
        const starBurst = BABYLON.MeshBuilder.CreatePlane("starBurst", { size: 1.5 }, this.scene);
        starBurst.position = bubble.mesh.position.clone();
        starBurst.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        const starMaterial = new BABYLON.StandardMaterial("starMaterial", this.scene);
        starMaterial.diffuseTexture = new BABYLON.Texture("textures/starburst.svg", this.scene);
        starMaterial.emissiveColor = bubbleColor;
        starMaterial.specularColor = BABYLON.Color3.Black();
        starMaterial.disableLighting = true;
        starMaterial.useAlphaFromDiffuseTexture = true;
        starBurst.material = starMaterial;
        starBurst.visibility = 0;

        // Fun pop animation sequence
        const popAnimation = new BABYLON.Animation(
            "popAnimation",
            "scaling",
            60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const alphaAnimation = new BABYLON.Animation(
            "alphaAnimation",
            "material.alpha",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        // Bubble pop animation keys - make it more bouncy and fun
        const popKeys = [];
        popKeys.push({
            frame: 0,
            value: bubble.mesh.scaling.clone()
        });
        popKeys.push({
            frame: 10,
            value: bubble.mesh.scaling.clone().scaleInPlace(1.3)
        });
        popKeys.push({
            frame: 20,
            value: bubble.mesh.scaling.clone().scaleInPlace(0.8)
        });
        popKeys.push({
            frame: 30,
            value: bubble.mesh.scaling.clone().scaleInPlace(1.2)
        });
        popKeys.push({
            frame: 40,
            value: new BABYLON.Vector3(0, 0, 0)
        });

        const alphaKeys = [];
        alphaKeys.push({
            frame: 0,
            value: 1
        });
        alphaKeys.push({
            frame: 30,
            value: 0.7
        });
        alphaKeys.push({
            frame: 40,
            value: 0
        });

        // Star burst animation
        const starAnimation = new BABYLON.Animation(
            "starAnimation",
            "visibility",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const starScaleAnimation = new BABYLON.Animation(
            "starScaleAnimation",
            "scaling",
            60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const starKeys = [];
        starKeys.push({ frame: 0, value: 0 });
        starKeys.push({ frame: 5, value: 1 });
        starKeys.push({ frame: 25, value: 1 });
        starKeys.push({ frame: 40, value: 0 });

        const starScaleKeys = [];
        starScaleKeys.push({ frame: 0, value: new BABYLON.Vector3(0.1, 0.1, 0.1) });
        starScaleKeys.push({ frame: 20, value: new BABYLON.Vector3(2, 2, 2) });
        starScaleKeys.push({ frame: 40, value: new BABYLON.Vector3(3, 3, 3) });

        starAnimation.setKeys(starKeys);
        starScaleAnimation.setKeys(starScaleKeys);
        starBurst.animations = [starAnimation, starScaleAnimation];

        popAnimation.setKeys(popKeys);
        alphaAnimation.setKeys(alphaKeys);
        bubble.mesh.animations = [popAnimation, alphaAnimation];

        // Start animations and effects
        particleSystem.start();
        this.scene.beginAnimation(starBurst, 0, 40, false, 1, () => {
            starBurst.dispose();
        });
        this.scene.beginAnimation(bubble.mesh, 0, 40, false, 1, () => {
            if (bubble.mesh && !bubble.mesh._isDisposed) {
                bubble.mesh.dispose();
            }
            setTimeout(() => {
                particleSystem.stop();
                setTimeout(() => {
                    particleSystem.dispose();
                }, 1000);
            }, 200);
        });
    }

    applyGravity() {
        console.log('Applying gravity');
        const rows = GAME_CONFIG.GRID.ROWS;
        const cols = GAME_CONFIG.GRID.COLS;
        let moved = false;

        // Create a new grid to track movements
        const newGrid = this.createEmptyGrid();
        const animationPromises = [];

        // Move bubbles down column by column
        for (let col = 0; col < cols; col++) {
            let emptyRow = rows - 1;
            for (let row = rows - 1; row >= 0; row--) {
                const bubble = this.gameState.grid[row][col];
                if (bubble && !bubble.isPopped && !this.disposedMeshes.has(bubble.mesh)) {
                    if (emptyRow !== row) {
                        console.log(`Moving bubble from (${row},${col}) to (${emptyRow},${col})`);
                        // Update bubble's grid position
                        bubble.gridPosition = { row: emptyRow, col };
                        // Place bubble in new grid at new position
                        newGrid[emptyRow][col] = bubble;
                        moved = true;

                        // Animate the bubble to its new position
                        const bubbleSize = GAME_CONFIG.GRID.BUBBLE_SIZE;
                        const spacing = GAME_CONFIG.GRID.SPACING;
                        const totalWidth = cols * (bubbleSize + spacing);
                        const totalHeight = rows * (bubbleSize + spacing);
                        const startX = -totalWidth / 2 + bubbleSize / 2;
                        const startY = totalHeight / 2 - bubbleSize / 2;
                        const targetY = startY - emptyRow * (bubbleSize + spacing);
                        const targetX = startX + col * (bubbleSize + spacing);

                        const fallAnimation = new BABYLON.Animation(
                            "fallAnimation",
                            "position",
                            60,
                            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                        );

                        const keys = [];
                        keys.push({
                            frame: 0,
                            value: bubble.mesh.position.clone()
                        });
                        keys.push({
                            frame: 30,
                            value: new BABYLON.Vector3(targetX, targetY, 0)
                        });

                        fallAnimation.setKeys(keys);
                        bubble.mesh.animations = [fallAnimation];
                        
                        // Create a promise for this animation
                        const animationPromise = new Promise((resolve) => {
                            this.scene.beginAnimation(bubble.mesh, 0, 30, false, 1, resolve);
                        });
                        animationPromises.push(animationPromise);
                    } else {
                        // Keep bubble in same position in new grid
                        newGrid[row][col] = bubble;
                    }
                    emptyRow--;
                }
            }
        }

        // Update the game state grid with the new grid
        this.gameState.grid = newGrid;

        // Wait for all animations to complete before filling empty spaces
        if (moved) {
            Promise.all(animationPromises).then(() => {
                console.log('All gravity animations complete, filling empty spaces');
                this.fillEmptySpaces();
            });
        } else {
            // If no bubbles moved, still check if we need to fill spaces
            const hasEmptySpaces = this.gameState.grid.some(row => 
                row.some(cell => cell === null)
            );
            if (hasEmptySpaces) {
                console.log('No movement but found empty spaces, filling them');
                this.fillEmptySpaces();
            }
        }
    }

    fillEmptySpaces() {
        const newBubbles = [];
        const fillPromises = [];

        // First, count empty spaces in each column
        const emptySpacesPerColumn = Array(GAME_CONFIG.GRID.COLS).fill(0);
        for (let col = 0; col < GAME_CONFIG.GRID.COLS; col++) {
            for (let row = 0; row < GAME_CONFIG.GRID.ROWS; row++) {
                if (!this.gameState.grid[row][col]) {
                    emptySpacesPerColumn[col]++;
                }
            }
        }

        // Fill empty spaces and collect new bubbles
        for (let col = 0; col < GAME_CONFIG.GRID.COLS; col++) {
            for (let row = 0; row < GAME_CONFIG.GRID.ROWS; row++) {
                if (!this.gameState.grid[row][col]) {
                    // Create bubble above the grid
                    const newBubble = this.createBubble(row, col, true);
                    
                    // Animate it falling into place
                    const fallPromise = this.animateNewBubble(newBubble, row, col);
                    fillPromises.push(fallPromise);
                    newBubbles.push(newBubble);
                }
            }
        }

        // After all new bubbles have fallen into place
        if (fillPromises.length > 0) {
            Promise.all(fillPromises).then(() => {
                console.log('All new bubbles in place, checking for matches');
                this.checkForPossibleMatches();
            });
        }
    }

    animateNewBubble(bubble, targetRow, targetCol) {
        const bubbleSize = GAME_CONFIG.GRID.BUBBLE_SIZE;
        const spacing = GAME_CONFIG.GRID.SPACING;
        const totalWidth = GAME_CONFIG.GRID.COLS * (bubbleSize + spacing);
        const totalHeight = GAME_CONFIG.GRID.ROWS * (bubbleSize + spacing);
        const startX = -totalWidth / 2 + bubbleSize / 2;
        const startY = totalHeight / 2 - bubbleSize / 2;
        const targetY = startY - targetRow * (bubbleSize + spacing);

        const fallAnimation = new BABYLON.Animation(
            "newBubbleFall",
            "position",
            60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [];
        keys.push({
            frame: 0,
            value: bubble.mesh.position.clone()
        });
        keys.push({
            frame: 30,
            value: new BABYLON.Vector3(bubble.mesh.position.x, targetY, 0)
        });

        fallAnimation.setKeys(keys);
        bubble.mesh.animations = [fallAnimation];

        return new Promise((resolve) => {
            this.scene.beginAnimation(bubble.mesh, 0, 30, false, 1, resolve);
        });
    }

    checkForPossibleMatches() {
        console.log('Checking for possible matches...');
        let hasMatches = false;
        
        // Check each bubble for potential matches
        for (let row = 0; row < GAME_CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.GRID.COLS; col++) {
                const bubble = this.gameState.grid[row][col];
                if (bubble && !bubble.isPopped) {
                    // Only check orthogonal directions for each bubble
                    const directions = [
                        [-1, 0], // Up
                        [1, 0],  // Down
                        [0, -1], // Left
                        [0, 1]   // Right
                    ];

                    // Check each direction for potential matches
                    for (const [dr, dc] of directions) {
                        const r1 = row + dr;
                        const c1 = col + dc;
                        const r2 = row + dr * 2;
                        const c2 = col + dc * 2;

                        // Check if both positions are within bounds
                        if (r1 >= 0 && r1 < GAME_CONFIG.GRID.ROWS && 
                            c1 >= 0 && c1 < GAME_CONFIG.GRID.COLS &&
                            r2 >= 0 && r2 < GAME_CONFIG.GRID.ROWS && 
                            c2 >= 0 && c2 < GAME_CONFIG.GRID.COLS) {
                            
                            const bubble1 = this.gameState.grid[r1][c1];
                            const bubble2 = this.gameState.grid[r2][c2];

                            if (bubble1 && bubble2 && 
                                !bubble1.isPopped && !bubble2.isPopped &&
                                bubble.color === bubble1.color && 
                                bubble.color === bubble2.color) {
                                hasMatches = true;
                                console.log(`Found potential match: (${row},${col}), (${r1},${c1}), (${r2},${c2})`);
                                return true;
                            }
                        }
                    }
                }
            }
        }

        // If no matches are found, regenerate the grid
        if (!hasMatches) {
            console.log('No matches found, regenerating grid...');
            this.regenerateGrid();
        }

        return hasMatches;
    }

    regenerateGrid() {
        // Dispose of all existing bubbles
        for (let row = 0; row < GAME_CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.GRID.COLS; col++) {
                const bubble = this.gameState.grid[row][col];
                if (bubble && bubble.mesh && !bubble.mesh._isDisposed) {
                    bubble.mesh.dispose();
                }
            }
        }

        // Reset grid
        this.gameState.grid = this.createEmptyGrid();

        // Create new bubbles ensuring at least one match exists
        let hasMatch = false;
        while (!hasMatch) {
            // Fill grid with new bubbles
            for (let row = 0; row < GAME_CONFIG.GRID.ROWS; row++) {
                for (let col = 0; col < GAME_CONFIG.GRID.COLS; col++) {
                    this.createBubble(row, col);
                }
            }
            // Check if at least one match exists
            hasMatch = this.checkForPossibleMatches();
        }
    }

    updateUI() {
        if (this.scoreText) {
            this.scoreText.text = `Score: ${this.gameState.score}`;
        }
        if (this.movesText) {
            this.movesText.text = `Moves: ${this.gameState.movesLeft}`;
        }
    }

    update() {
        if (this.gameState.state !== GAME_STATES.PLAYING) return;

        // Check for game over
        if (this.gameState.movesLeft <= 0) {
            this.gameState.state = GAME_STATES.GAME_OVER;
            if (this.onGameOver) {
                this.onGameOver(this.gameState.score);
            }
        }
    }

    dispose() {
        // Dispose of the global glow layer
        if (this.globalGlowLayer) {
            this.globalGlowLayer.dispose();
        }
        
        // Clear the disposed meshes set
        this.disposedMeshes.clear();
        
        if (this.scene) {
            this.scene.dispose();
        }
        if (this.engine) {
            this.engine.dispose();
        }
    }

    showUnicornEffect(bubble) {
        // Create rainbow trail effect
        const particleSystem = new BABYLON.ParticleSystem("unicornTrail", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("./textures/sparkle.png", this.scene);
        particleSystem.emitter = bubble.mesh;
        
        // Rainbow colors
        particleSystem.addColorGradient(0, new BABYLON.Color4(1, 0, 0, 1));
        particleSystem.addColorGradient(0.2, new BABYLON.Color4(1, 0.5, 0, 1));
        particleSystem.addColorGradient(0.4, new BABYLON.Color4(1, 1, 0, 1));
        particleSystem.addColorGradient(0.6, new BABYLON.Color4(0, 1, 0, 1));
        particleSystem.addColorGradient(0.8, new BABYLON.Color4(0, 0, 1, 1));
        particleSystem.addColorGradient(1, new BABYLON.Color4(0.5, 0, 1, 1));

        // Particle behavior
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 2;
        particleSystem.emitRate = 100;
        particleSystem.start();

        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => particleSystem.dispose(), 2000);
        }, 1000);
    }

    showSuperheroEffect(bubble) {
        // Create explosion effect
        const particleSystem = new BABYLON.ParticleSystem("superheroBlast", 300, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("textures/star.png", this.scene);
        particleSystem.emitter = bubble.mesh;

        // Superhero colors (gold and blue)
        particleSystem.color1 = new BABYLON.Color4(1, 0.8, 0, 1);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1, 1);

        // Particle behavior
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.4;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1;
        particleSystem.emitRate = 200;
        particleSystem.createSphereEmitter(2);
        particleSystem.start();

        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => particleSystem.dispose(), 2000);
        }, 1000);
    }

    handleGameOver() {
        this.gameState.state = GAME_STATES.GAME_OVER;
        
        // Dispose of the current game scene
        this.dispose();
        
        // Create the celebration screen
        new CelebrationScreen(this.canvas, this.gameState.score, this.playerName);
    }

    showCelebrationEffects() {
        // Create multiple particle systems for a grand celebration
        const colors = [
            new BABYLON.Color4(1, 0.2, 0.2, 1), // Red
            new BABYLON.Color4(0.2, 1, 0.2, 1), // Green
            new BABYLON.Color4(0.2, 0.2, 1, 1), // Blue
            new BABYLON.Color4(1, 1, 0.2, 1),   // Yellow
            new BABYLON.Color4(1, 0.2, 1, 1)    // Purple
        ];

        // Create confetti and fireworks at different positions
        for (let i = 0; i < 5; i++) {
            const position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5,
                0
            );

            // Create firework effect
            this.createFirework(position, colors[i]);
            
            // Create confetti effect
            this.createConfetti(position, colors[i]);
        }

        // Add celebratory text with animation
        const celebrationText = new GUI.TextBlock();
        celebrationText.text = "🎉 Amazing Job! 🎉";
        celebrationText.color = "white";
        celebrationText.fontSize = 48;
        celebrationText.shadowColor = "black";
        celebrationText.shadowBlur = 10;
        celebrationText.fontFamily = "Comic Sans MS";
        this.gui.addControl(celebrationText);

        // Animate the celebration text
        const scaleAnimation = new BABYLON.Animation(
            "textScale",
            "scaleX",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keys = [];
        keys.push({ frame: 0, value: 1 });
        keys.push({ frame: 30, value: 1.2 });
        keys.push({ frame: 60, value: 1 });

        scaleAnimation.setKeys(keys);
        celebrationText.animations = [scaleAnimation];
        this.scene.beginAnimation(celebrationText, 0, 60, true);
    }

    createFirework(position, color) {
        const particleSystem = new BABYLON.ParticleSystem("firework", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("./textures/sparkle.png", this.scene);
        particleSystem.emitter = position;
        particleSystem.color1 = color;
        particleSystem.color2 = color;
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 2;
        particleSystem.emitRate = 100;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0);
        particleSystem.createSphereEmitter(0.1);
        particleSystem.start();

        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => particleSystem.dispose(), 2000);
        }, 1000);
    }

    createConfetti(position, color) {
        const particleSystem = new BABYLON.ParticleSystem("confetti", 100, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("textures/confetti.png", this.scene);
        particleSystem.emitter = position;
        particleSystem.color1 = color;
        particleSystem.color2 = color;
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.2;
        particleSystem.minLifeTime = 2;
        particleSystem.maxLifeTime = 4;
        particleSystem.emitRate = 50;
        particleSystem.minEmitPower = 0.5;
        particleSystem.maxEmitPower = 1.5;
        particleSystem.gravity = new BABYLON.Vector3(0, -0.1, 0);
        particleSystem.start();

        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => particleSystem.dispose(), 4000);
        }, 2000);
    }

    findBubblesInHeartShape(centerRow, centerCol, radius) {
        const bubbles = [];
        const heartShape = [
            [-1,-1], [-1,0], [-1,1],
            [0,-2], [0,-1], [0,0], [0,1], [0,2],
            [1,-2], [1,-1], [1,0], [1,1], [1,2],
            [2,-1], [2,0], [2,1]
        ];

        for (const [rowOffset, colOffset] of heartShape) {
            const row = centerRow + rowOffset;
            const col = centerCol + colOffset;
            if (row >= 0 && row < GAME_CONFIG.GRID.ROWS &&
                col >= 0 && col < GAME_CONFIG.GRID.COLS) {
                const bubble = this.gameState.grid[row][col];
                if (bubble && !bubble.isPopped) {
                    bubbles.push(bubble);
                }
            }
        }
        return bubbles;
    }

    findBubblesInCrownShape(centerRow, centerCol, radius) {
        const bubbles = [];
        const crownShape = [
            [-2,0], [-2,1], [-2,2],
            [-1,-1], [-1,0], [-1,1], [-1,2], [-1,3],
            [0,-2], [0,-1], [0,0], [0,1], [0,2], [0,3], [0,4],
            [1,-1], [1,0], [1,1], [1,2], [1,3]
        ];

        for (const [rowOffset, colOffset] of crownShape) {
            const row = centerRow + rowOffset;
            const col = centerCol + colOffset;
            if (row >= 0 && row < GAME_CONFIG.GRID.ROWS &&
                col >= 0 && col < GAME_CONFIG.GRID.COLS) {
                const bubble = this.gameState.grid[row][col];
                if (bubble && !bubble.isPopped) {
                    bubbles.push(bubble);
                }
            }
        }
        return bubbles;
    }

    showPrincessEffect(bubble) {
        // Create heart-shaped particle effect
        const particleSystem = new BABYLON.ParticleSystem("princessMagic", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("textures/heart.png", this.scene);
        particleSystem.emitter = bubble.mesh;
        
        // Princess colors (pink and purple)
        particleSystem.addColorGradient(0, new BABYLON.Color4(1, 0.4, 0.8, 1));
        particleSystem.addColorGradient(0.5, new BABYLON.Color4(0.8, 0.3, 0.6, 1));
        particleSystem.addColorGradient(1, new BABYLON.Color4(1, 0.6, 0.9, 1));

        // Particle behavior
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 2;
        particleSystem.emitRate = 100;
        particleSystem.createHemisphericEmitter(2);
        
        // Add sparkle and twirl
        particleSystem.angularSpeedVariation = Math.PI;
        particleSystem.start();

        // Add floating hearts
        for (let i = 0; i < 8; i++) {
            const heart = BABYLON.MeshBuilder.CreatePlane("heart", { size: 0.3 }, this.scene);
            const heartMat = new BABYLON.StandardMaterial("heartMat", this.scene);
            heartMat.diffuseTexture = new BABYLON.Texture("textures/heart.png", this.scene);
            heartMat.emissiveColor = new BABYLON.Color3(1, 0.4, 0.8);
            heartMat.alpha = 0.8;
            heart.material = heartMat;
            heart.position = bubble.mesh.position.clone();
            heart.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

            const angle = (i / 8) * Math.PI * 2;
            const radius = 1;
            const floatAnimation = new BABYLON.Animation(
                "floatHeart",
                "position",
                30,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );

            const keys = [];
            keys.push({
                frame: 0,
                value: heart.position.clone()
            });
            keys.push({
                frame: 30,
                value: new BABYLON.Vector3(
                    heart.position.x + Math.cos(angle) * radius,
                    heart.position.y + Math.sin(angle) * radius + 0.5,
                    heart.position.z
                )
            });

            floatAnimation.setKeys(keys);
            heart.animations = [floatAnimation];
            this.scene.beginAnimation(heart, 0, 30, false, 1, () => {
                heart.dispose();
            });
        }

        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => particleSystem.dispose(), 2000);
        }, 1000);
    }

    showPrinceEffect(bubble) {
        // Create crown-shaped particle effect
        const particleSystem = new BABYLON.ParticleSystem("princeMagic", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("textures/crown.png", this.scene);
        particleSystem.emitter = bubble.mesh;
        
        // Royal colors (gold and blue)
        particleSystem.addColorGradient(0, new BABYLON.Color4(1, 0.84, 0, 1));
        particleSystem.addColorGradient(0.5, new BABYLON.Color4(0.1, 0.3, 0.8, 1));
        particleSystem.addColorGradient(1, new BABYLON.Color4(1, 0.94, 0.2, 1));

        // Particle behavior
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 2;
        particleSystem.emitRate = 100;
        
        // Create crown-shaped emission
        particleSystem.createBoxEmitter(
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(1, 1, 0),
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 1, 0)
        );
        
        // Add sparkle and rotation
        particleSystem.angularSpeedVariation = Math.PI / 2;
        particleSystem.start();

        // Add floating crowns
        for (let i = 0; i < 5; i++) {
            const crown = BABYLON.MeshBuilder.CreatePlane("crown", { size: 0.4 }, this.scene);
            const crownMat = new BABYLON.StandardMaterial("crownMat", this.scene);
            crownMat.diffuseTexture = new BABYLON.Texture("textures/crown.png", this.scene);
            crownMat.emissiveColor = new BABYLON.Color3(1, 0.84, 0);
            crownMat.alpha = 0.8;
            crown.material = crownMat;
            crown.position = bubble.mesh.position.clone();
            crown.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

            const angle = (i / 5) * Math.PI * 2;
            const radius = 0.8;
            const floatAnimation = new BABYLON.Animation(
                "floatCrown",
                "position",
                30,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );

            const keys = [];
            keys.push({
                frame: 0,
                value: crown.position.clone()
            });
            keys.push({
                frame: 30,
                value: new BABYLON.Vector3(
                    crown.position.x + Math.cos(angle) * radius,
                    crown.position.y + Math.sin(angle) * radius + 0.3,
                    crown.position.z
                )
            });

            floatAnimation.setKeys(keys);
            crown.animations = [floatAnimation];
            this.scene.beginAnimation(crown, 0, 30, false, 1, () => {
                crown.dispose();
            });
        }

        setTimeout(() => {
            particleSystem.stop();
            setTimeout(() => particleSystem.dispose(), 2000);
        }, 1000);
    }

    findBubblesInRadius(centerRow, centerCol, radius) {
        const bubbles = [];
        
        // Check all positions within the radius
        for (let row = Math.max(0, centerRow - radius); row <= Math.min(GAME_CONFIG.GRID.ROWS - 1, centerRow + radius); row++) {
            for (let col = Math.max(0, centerCol - radius); col <= Math.min(GAME_CONFIG.GRID.COLS - 1, centerCol + radius); col++) {
                // Calculate distance from center
                const distance = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
                
                // If within radius and bubble exists
                if (distance <= radius && this.gameState.grid[row][col] && !this.gameState.grid[row][col].isPopped) {
                    bubbles.push(this.gameState.grid[row][col]);
                }
            }
        }
        
        return bubbles;
    }

    findAllBubblesOfColor(targetColor) {
        const bubbles = [];
        
        // Check all positions in the grid
        for (let row = 0; row < GAME_CONFIG.GRID.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.GRID.COLS; col++) {
                const bubble = this.gameState.grid[row][col];
                if (bubble && 
                    !bubble.isPopped && 
                    !this.disposedMeshes.has(bubble.mesh) && 
                    bubble.color === targetColor) {
                    bubbles.push(bubble);
                }
            }
        }
        
        console.log(`Found ${bubbles.length} bubbles of color ${targetColor}`);
        return bubbles;
    }
} 