import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import '@babylonjs/loaders';
import '@babylonjs/inspector';
import { playSound, initSounds, stopAllSounds, toggleMute, isMuted } from './utils/sounds';
import { CelebrationScreen } from './CelebrationScreen';
import { colors, GAME_CONFIG, GAME_STATES, BUBBLE_TYPES, LEVEL_REQUIREMENTS } from './config';

export class BubblePopGame {
    constructor(canvas, playerName) {
        this.canvas = canvas;
        this.playerName = playerName.charAt(0).toUpperCase() + playerName.slice(1).toLowerCase();
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
            playerName: playerName.charAt(0).toUpperCase() + playerName.slice(1).toLowerCase()
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

        // Create bubble grid
        this.createBubbleGrid();

        // Create background
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

        // Add a one-time click handler to start music after user interaction
        const startGameMusic = () => {
            if (!isMuted('music')) {
                const songName = this.playerName.toLowerCase() === 'madison' ? 'madi-song' : 'james-song';
                stopAllSounds();
                playSound(songName);
            }
            this.canvas.removeEventListener('click', startGameMusic);
            this.canvas.removeEventListener('touchstart', startGameMusic);
        };

        this.canvas.addEventListener('click', startGameMusic);
        this.canvas.addEventListener('touchstart', startGameMusic);
    }

    setupCamera() {
        // Create a perspective camera
        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI / 2,     // Alpha (horizontal rotation) - 90 degrees
            Math.PI / 2,     // Beta (vertical rotation) - 90 degrees
            30,             // Increased radius to see more of the scene
            new BABYLON.Vector3(0, 0, 0),
            this.scene
        );
        
        // Lock camera rotation
        this.camera.lowerBetaLimit = this.camera.upperBetaLimit = Math.PI / 2;
        this.camera.lowerAlphaLimit = this.camera.upperAlphaLimit = Math.PI / 2;
        
        // Disable camera controls
        this.camera.inputs.clear();
    }

    async setupBackground() {
        // Create a plane that fills the entire view
        const backgroundPlane = BABYLON.MeshBuilder.CreatePlane("backgroundPlane", {
            width: 60,    // Increased width further
            height: 35,   // Increased height further
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, this.scene);

        // Position the plane further back and slightly down
        backgroundPlane.position = new BABYLON.Vector3(0, -2, -15);

        // Create and setup the material
        const backgroundMaterial = new BABYLON.StandardMaterial("backgroundMaterial", this.scene);
        
        // Load the appropriate background texture with the correct path
        const imagePath = this.playerName.toLowerCase() === "madison" 
            ? "/images/princess.webp" 
            : "/images/marvel.webp";
            
        console.log("Loading background image from:", imagePath);
        
        const texture = new BABYLON.Texture(imagePath, this.scene);
        
        // Force texture to stretch and fill
        texture.onLoadObservable.add(() => {
            console.log("Background texture loaded successfully");
            texture.uScale = 1;
            texture.vScale = 1;
        });

        // Set texture properties to prevent any wrapping
        texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

        backgroundMaterial.diffuseTexture = texture;

        // Make sure the background is bright enough and fully visible
        backgroundMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        backgroundMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        backgroundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        backgroundMaterial.disableLighting = true;

        // Apply the material to the plane
        backgroundPlane.material = backgroundMaterial;
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

        // Add sound control buttons in the top-right corner
        const soundControlsContainer = new GUI.StackPanel("soundControls");
        soundControlsContainer.width = "200px";
        soundControlsContainer.height = "100px";
        soundControlsContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        soundControlsContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        soundControlsContainer.top = "120px"; // Below the moves counter
        soundControlsContainer.right = "20px";
        soundControlsContainer.spacing = 10;
        soundControlsContainer.zIndex = 1000;
        this.gui.addControl(soundControlsContainer);

        // Music mute button
        const musicButton = GUI.Button.CreateSimpleButton("musicToggle", "🎵 Music: " + (isMuted('music') ? 'OFF' : 'ON'));
        musicButton.width = "180px";
        musicButton.height = "40px";
        musicButton.color = "white";
        musicButton.cornerRadius = 10;
        musicButton.background = isMuted('music') ? "rgba(255, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.5)";
        musicButton.onPointerClickObservable.add(() => {
            const isMusicMuted = toggleMute('music');
            musicButton.children[0].text = `🎵 Music: ${isMusicMuted ? 'OFF' : 'ON'}`;
            musicButton.background = isMusicMuted ? "rgba(255, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.5)";
            
            // If unmuting and we're in game, play the appropriate character song
            if (!isMusicMuted) {
                const songName = this.playerName.toLowerCase() === 'madison' ? 'madi-song' : 'james-song';
                playSound(songName);
            }
        });
        soundControlsContainer.addControl(musicButton);

        // Sound effects mute button
        const effectsButton = GUI.Button.CreateSimpleButton("effectsToggle", "🔊 Effects: " + (isMuted('effects') ? 'OFF' : 'ON'));
        effectsButton.width = "180px";
        effectsButton.height = "40px";
        effectsButton.color = "white";
        effectsButton.cornerRadius = 10;
        effectsButton.background = isMuted('effects') ? "rgba(255, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.5)";
        effectsButton.onPointerClickObservable.add(() => {
            const isEffectsMuted = toggleMute('effects');
            effectsButton.children[0].text = `🔊 Effects: ${isEffectsMuted ? 'OFF' : 'ON'}`;
            effectsButton.background = isEffectsMuted ? "rgba(255, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.5)";
        });
        soundControlsContainer.addControl(effectsButton);

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
        this.movesText.fontSize = 50;
        this.movesText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.movesText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.movesText.top = "50px";
        this.movesText.right = "50px";
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
        const y = startY - row * (bubbleSize + spacing);
        
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

        // Assign material and store bubble data
        bubble.material = material;
        bubble.isPickable = true;

        // Store bubble data with explicit position reference
        this.gameState.grid[row][col] = {
            mesh: bubble,
            color: colorIndex,
            type: BUBBLE_TYPES.NORMAL,
            isPopped: false,
            gridPosition: { row, col },
            worldPosition: { x, y, z: 0 }
        };

        // Add click handler with position check
        bubble.actionManager = new BABYLON.ActionManager(this.scene);
        bubble.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => {
                    // Double check the position matches before handling click
                    const clickedBubble = this.gameState.grid[row][col];
                    if (clickedBubble && clickedBubble.mesh === bubble) {
                        this.handleBubbleClick(row, col);
                    }
                }
            )
        );

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
        // Ignore clicks if game is not in playing state or is processing a match
        if (this.gameState.state !== GAME_STATES.PLAYING || this.gameState.isProcessingMatch) {
            return;
        }

        // Get the clicked bubble
        const clickedBubble = this.gameState.grid[row][col];
        if (!clickedBubble || clickedBubble.isPopped) {
            return;
        }

        // Find matching bubbles
        const matches = this.findMatches(row, col);
        
        // Only process if we have enough matches
        if (matches.length >= 2) {
            this.gameState.isProcessingMatch = true;
            
            // Pop all matching bubbles with animation and sound
            matches.forEach(bubble => {
                if (bubble && !bubble.isPopped && bubble.mesh) {
                    this.popBubble(bubble);
                }
            });

            // Update score and moves
            this.updateScore(matches.length);
            this.gameState.movesLeft--;
            this.updateMovesText();

            // Apply gravity after a short delay to let pop animations complete
            setTimeout(() => {
                this.applyGravity();
                this.gameState.isProcessingMatch = false;

                // Check for game over after gravity is applied
                if (this.gameState.movesLeft <= 0) {
                    this.handleGameOver();
                }
            }, 300);
        }
    }

    findMatches(row, col) {
        const clickedBubble = this.gameState.grid[row][col];
        if (!clickedBubble || !clickedBubble.mesh || clickedBubble.isPopped) {
            console.log('Invalid bubble for matching');
            return [];
        }

        const matches = new Set(); // Use Set to avoid duplicates
        matches.add(clickedBubble);

        // Check horizontal matches
        const checkHorizontal = () => {
            // Check left
            let c = col - 1;
            while (c >= 0) {
                const bubble = this.gameState.grid[row][c];
                if (!bubble || bubble.isPopped || bubble.color !== clickedBubble.color) break;
                matches.add(bubble);
                c--;
            }
            // Check right
            c = col + 1;
            while (c < GAME_CONFIG.GRID.COLS) {
                const bubble = this.gameState.grid[row][c];
                if (!bubble || bubble.isPopped || bubble.color !== clickedBubble.color) break;
                matches.add(bubble);
                c++;
            }
        };

        // Check vertical matches
        const checkVertical = () => {
            // Check up
            let r = row - 1;
            while (r >= 0) {
                const bubble = this.gameState.grid[r][col];
                if (!bubble || bubble.isPopped || bubble.color !== clickedBubble.color) break;
                matches.add(bubble);
                r--;
            }
            // Check down
            r = row + 1;
            while (r < GAME_CONFIG.GRID.ROWS) {
                const bubble = this.gameState.grid[r][col];
                if (!bubble || bubble.isPopped || bubble.color !== clickedBubble.color) break;
                matches.add(bubble);
                r++;
            }
        };

        // Check diagonal matches (top-left to bottom-right)
        const checkDiagonal1 = () => {
            // Check up-left
            let r = row - 1, c = col - 1;
            while (r >= 0 && c >= 0) {
                const bubble = this.gameState.grid[r][c];
                if (!bubble || bubble.isPopped || bubble.color !== clickedBubble.color) break;
                matches.add(bubble);
                r--; c--;
            }
            // Check down-right
            r = row + 1; c = col + 1;
            while (r < GAME_CONFIG.GRID.ROWS && c < GAME_CONFIG.GRID.COLS) {
                const bubble = this.gameState.grid[r][c];
                if (!bubble || bubble.isPopped || bubble.color !== clickedBubble.color) break;
                matches.add(bubble);
                r++; c++;
            }
        };

        // Check diagonal matches (top-right to bottom-left)
        const checkDiagonal2 = () => {
            // Check up-right
            let r = row - 1, c = col + 1;
            while (r >= 0 && c < GAME_CONFIG.GRID.COLS) {
                const bubble = this.gameState.grid[r][c];
                if (!bubble || bubble.isPopped || bubble.color !== clickedBubble.color) break;
                matches.add(bubble);
                r--; c++;
            }
            // Check down-left
            r = row + 1; c = col - 1;
            while (r < GAME_CONFIG.GRID.ROWS && c >= 0) {
                const bubble = this.gameState.grid[r][c];
                if (!bubble || bubble.isPopped || bubble.color !== clickedBubble.color) break;
                matches.add(bubble);
                r++; c--;
            }
        };

        // Check all directions
        checkHorizontal();
        checkVertical();
        checkDiagonal1();
        checkDiagonal2();

        const matchArray = Array.from(matches);
        console.log(`Found ${matchArray.length} matches for bubble at (${row},${col})`);
        return matchArray;
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
        let hasBubblesFallen = false;

        // Start from the second-to-last row and move up
        for (let row = GAME_CONFIG.GRID.ROWS - 2; row >= 0; row--) {
            for (let col = 0; col < GAME_CONFIG.GRID.COLS; col++) {
                const bubble = this.gameState.grid[row][col];
                if (bubble && !bubble.isPopped) {
                    // Check if there's an empty space below
                    let targetRow = row;
                    while (targetRow + 1 < GAME_CONFIG.GRID.ROWS && !this.gameState.grid[targetRow + 1][col]) {
                        targetRow++;
                    }

                    // If bubble needs to fall
                    if (targetRow !== row) {
                        hasBubblesFallen = true;
                        // Update grid
                        this.gameState.grid[targetRow][col] = bubble;
                        this.gameState.grid[row][col] = null;
                        
                        // Update bubble position
                        const bubbleSize = GAME_CONFIG.GRID.BUBBLE_SIZE;
                        const spacing = GAME_CONFIG.GRID.SPACING;
                        const totalHeight = GAME_CONFIG.GRID.ROWS * (bubbleSize + spacing);
                        const startY = totalHeight / 2 - bubbleSize / 2;
                        const newY = startY - targetRow * (bubbleSize + spacing);
                        
                        // Create animation for falling
                        const animation = new BABYLON.Animation(
                            "fallAnimation",
                            "position.y",
                            60,
                            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                        );

                        const keys = [];
                        keys.push({ frame: 0, value: bubble.mesh.position.y });
                        keys.push({ frame: 30, value: newY });

                        animation.setKeys(keys);

                        // Add easing function
                        const easingFunction = new BABYLON.BackEase();
                        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
                        animation.setEasingFunction(easingFunction);

                        bubble.mesh.animations = [animation];
                        this.scene.beginAnimation(bubble.mesh, 0, 30, false);
                        
                        // Update bubble's grid position and click handler
                        bubble.gridPosition.row = targetRow;
                        bubble.gridPosition.col = col;

                        // Update click handler
                        if (bubble.mesh.actionManager) {
                            bubble.mesh.actionManager.dispose();
                        }
                        bubble.mesh.actionManager = new BABYLON.ActionManager(this.scene);
                        bubble.mesh.actionManager.registerAction(
                            new BABYLON.ExecuteCodeAction(
                                BABYLON.ActionManager.OnPickTrigger,
                                () => this.handleBubbleClick(targetRow, col)
                            )
                        );
                    }
                }
            }
        }

        // Fill empty spaces at the top with new bubbles
        if (hasBubblesFallen) {
            for (let col = 0; col < GAME_CONFIG.GRID.COLS; col++) {
                let row = 0;
                while (row < GAME_CONFIG.GRID.ROWS && !this.gameState.grid[row][col]) {
                    const newBubble = this.createBubble(row, col, true);
                    // Ensure the new bubble has the correct grid position
                    if (newBubble) {
                        newBubble.gridPosition = { row, col };
                        // Update click handler for new bubble
                        if (newBubble.mesh.actionManager) {
                            newBubble.mesh.actionManager.dispose();
                        }
                        newBubble.mesh.actionManager = new BABYLON.ActionManager(this.scene);
                        newBubble.mesh.actionManager.registerAction(
                            new BABYLON.ExecuteCodeAction(
                                BABYLON.ActionManager.OnPickTrigger,
                                () => this.handleBubbleClick(row, col)
                            )
                        );
                    }
                    row++;
                }
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
            this.handleGameOver();
        }
    }

    dispose() {
        // Stop any playing music
        stopAllSounds();
        
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
        if (this.gameState.state === GAME_STATES.GAME_OVER) return; // Prevent multiple calls
        
        this.gameState.state = GAME_STATES.GAME_OVER;
        
        // Stop current music and play end-game music
        stopAllSounds();
        playSound('end-song');

        // Create celebration UI
        const guiTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("celebrationUI");

        // Add semi-transparent overlay
        const overlay = new GUI.Rectangle("overlay");
        overlay.width = 1;
        overlay.height = 1;
        overlay.thickness = 0;
        overlay.background = "black";
        overlay.alpha = 0.5;
        guiTexture.addControl(overlay);

        // Create a main container for vertical layout
        const mainContainer = new GUI.Rectangle("mainContainer");
        mainContainer.width = "800px";
        mainContainer.height = "600px";
        mainContainer.thickness = 0;
        mainContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        guiTexture.addControl(mainContainer);

        // Create a stack panel for text elements
        const textContainer = new GUI.StackPanel("textContainer");
        textContainer.width = "100%";
        textContainer.height = "100%";
        textContainer.spacing = 40;
        textContainer.paddingTop = "50px";
        mainContainer.addControl(textContainer);

        // Add congratulations text
        const congratsText = new GUI.TextBlock();
        congratsText.text = "🎉 AMAZING JOB! 🎉";
        congratsText.color = "white";
        congratsText.fontSize = 72;
        congratsText.height = "100px";
        congratsText.fontFamily = "Comic Sans MS";
        congratsText.shadowColor = "black";
        congratsText.shadowBlur = 10;
        congratsText.outlineWidth = 4;
        congratsText.outlineColor = "purple";
        textContainer.addControl(congratsText);

        // Add player name
        const playerText = new GUI.TextBlock();
        playerText.text = `Way to go, ${this.playerName}!`;
        playerText.color = "#FFD700";
        playerText.fontSize = 80;
        playerText.height = "125px";
        playerText.fontFamily = "Comic Sans MS";
        playerText.shadowColor = "black";
        playerText.shadowBlur = 5;
        playerText.outlineWidth = 2;
        playerText.outlineColor = "#FF69B4";
        textContainer.addControl(playerText);

        // Add score with stars
        const scoreText = new GUI.TextBlock();
        scoreText.text = `⭐ Score: ${this.gameState.score} ⭐`;
        scoreText.color = "white";
        scoreText.fontSize = 54;
        scoreText.height = "80px";
        scoreText.fontFamily = "Comic Sans MS";
        scoreText.shadowColor = "black";
        scoreText.shadowBlur = 5;
        textContainer.addControl(scoreText);

        // Add fun emojis
        const emojiText = new GUI.TextBlock();
        emojiText.text = "🦄 🌟 👑 ✨ 🎈 🎨";
        emojiText.fontSize = 70;
        emojiText.height = "120px";
        textContainer.addControl(emojiText);

        // Create button container
        const buttonContainer = new GUI.Rectangle();
        buttonContainer.width = 1;
        buttonContainer.height = "150px";
        buttonContainer.thickness = 0;
        buttonContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        buttonContainer.top = "-200px";
        guiTexture.addControl(buttonContainer);

        // Add "Play Again" button
        const playAgainBtn = GUI.Button.CreateSimpleButton("playAgain", "Play Again! 🎮");
        playAgainBtn.width = "300px";
        playAgainBtn.height = "80px";
        playAgainBtn.color = "white";
        playAgainBtn.cornerRadius = 20;
        playAgainBtn.background = "#4CAF50";
        playAgainBtn.thickness = 4;
        playAgainBtn.fontSize = 36;
        playAgainBtn.fontFamily = "Comic Sans MS";
        buttonContainer.addControl(playAgainBtn);

        // Add hover effect
        playAgainBtn.onPointerEnterObservable.add(() => {
            playAgainBtn.background = "#45a049";
        });
        playAgainBtn.onPointerOutObservable.add(() => {
            playAgainBtn.background = "#4CAF50";
        });

        // Handle play again click
        playAgainBtn.onPointerClickObservable.add(() => {
            if (this.onGameOver) {
                // Stop end-game music before transitioning
                stopAllSounds();
                // Return to player select screen
                this.onGameOver(this.gameState.score);
            }
        });

        // Create celebration particles
        this.createCelebrationParticles();

        // Animate the congratulations text
        let time = 0;
        this.scene.registerBeforeRender(() => {
            time += 0.05;
            congratsText.scaling = new BABYLON.Vector2(
                1 + Math.sin(time) * 0.05,
                1 + Math.sin(time) * 0.05
            );
        });
    }

    createCelebrationParticles() {
        // Create multiple particle systems for different effects
        this.createConfetti(-4, 2);
        this.createConfetti(4, 2);
        this.createStars(0, -2);
        this.createStars(-3, -1);
        this.createStars(3, -1);
    }

    createConfetti(x, y) {
        const confetti = new BABYLON.ParticleSystem("confetti", 100, this.scene);
        confetti.particleTexture = new BABYLON.Texture("textures/sparkle.svg", this.scene);
        confetti.emitter = new BABYLON.Vector3(x, y, 0);
        confetti.minSize = 0.1;
        confetti.maxSize = 0.3;
        confetti.minLifeTime = 2;
        confetti.maxLifeTime = 4;
        confetti.emitRate = 20;
        confetti.gravity = new BABYLON.Vector3(0, -0.1, 0);
        confetti.direction1 = new BABYLON.Vector3(-1, 1, 0);
        confetti.direction2 = new BABYLON.Vector3(1, 1, 0);
        confetti.minEmitPower = 1;
        confetti.maxEmitPower = 2;
        confetti.addColorGradient(0, new BABYLON.Color4(1, 0, 0, 1));
        confetti.addColorGradient(0.25, new BABYLON.Color4(0, 1, 0, 1));
        confetti.addColorGradient(0.5, new BABYLON.Color4(0, 0, 1, 1));
        confetti.addColorGradient(0.75, new BABYLON.Color4(1, 1, 0, 1));
        confetti.addColorGradient(1, new BABYLON.Color4(1, 0, 1, 1));
        confetti.start();
    }

    createStars(x, y) {
        const stars = new BABYLON.ParticleSystem("stars", 50, this.scene);
        stars.particleTexture = new BABYLON.Texture("textures/star.svg", this.scene);
        stars.emitter = new BABYLON.Vector3(x, y, 0);
        stars.minSize = 0.2;
        stars.maxSize = 0.4;
        stars.minLifeTime = 2;
        stars.maxLifeTime = 3;
        stars.emitRate = 10;
        stars.gravity = new BABYLON.Vector3(0, 0.1, 0);
        stars.direction1 = new BABYLON.Vector3(-0.5, 1, 0);
        stars.direction2 = new BABYLON.Vector3(0.5, 1, 0);
        stars.color1 = new BABYLON.Color4(1, 1, 0, 1);
        stars.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
        stars.start();
    }

    updateScore(matchCount) {
        // Calculate points based on match count
        const points = matchCount * 10;  // 10 points per bubble
        this.gameState.score += points;
        
        // Update score display
        if (this.scoreText) {
            this.scoreText.text = `Score: ${this.gameState.score}`;
        }
    }

    updateMovesText() {
        if (this.movesText) {
            this.movesText.text = `Moves: ${this.gameState.movesLeft}`;
        }
    }
} 