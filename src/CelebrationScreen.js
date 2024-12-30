import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { playSound } from './utils/sounds';

export class CelebrationScreen {
    constructor(canvas, score, playerName) {
        this.canvas = canvas;
        this.score = score;
        this.playerName = playerName;
        this.engine = null;
        this.scene = null;
        this.initialize();
    }

    initialize() {
        // Create engine
        this.engine = new BABYLON.Engine(this.canvas, true);
        
        // Create scene
        this.scene = new BABYLON.Scene(this.engine);
        
        // Create camera
        const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -10), this.scene);
        
        // Create celebration background
        this.setupBackground();
        
        // Create celebration GUI
        this.setupGUI();
        
        // Create particle effects
        this.createParticleEffects();
        
        // Start animation loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Play celebration sound
        playSound('victory');
    }

    setupBackground() {
        const backgroundTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("celebrationUI");
        
        // Create background image based on player
        const backgroundImage = new GUI.Image("background", 
            this.playerName.toLowerCase() === "madison" 
                ? "/images/princess.webp" 
                : "/images/marvel.webp"
        );
        
        // Set to CONTAIN to ensure the entire image is visible
        backgroundImage.stretch = GUI.Image.STRETCH_NONE;
        backgroundImage.alpha = 0.5;
        
        // Center the image and make it cover most of the screen
        backgroundImage.width = "90%";
        backgroundImage.height = "90%";
        backgroundImage.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        backgroundImage.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        
        backgroundTexture.addControl(backgroundImage);

        // Add a color overlay for the entire screen
        const overlay = new GUI.Rectangle();
        overlay.width = "100%";
        overlay.height = "100%";
        overlay.thickness = 0;
        overlay.background = this.playerName.toLowerCase() === "madison"
            ? "rgba(255, 192, 203, 0.3)"  // Pink for Madison
            : "rgba(0, 0, 139, 0.3)";     // Blue for James
        overlay.alpha = 0.3;
        overlay.zIndex = -1;  // Ensure overlay is behind other elements
        backgroundTexture.addControl(overlay);
    }

    setupGUI() {
        const guiTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // Create a container for all elements
        const container = new GUI.StackPanel();
        container.width = "100%";
        container.spacing = 20;
        guiTexture.addControl(container);

        // Add bouncing congratulations text
        const congratsText = new GUI.TextBlock();
        congratsText.text = "🎉 AMAZING JOB! 🎉";
        congratsText.color = "white";
        congratsText.fontSize = 60;
        congratsText.fontFamily = "Comic Sans MS";
        congratsText.shadowColor = "black";
        congratsText.shadowBlur = 10;
        congratsText.outlineWidth = 3;
        congratsText.outlineColor = "purple";
        container.addControl(congratsText);

        // Add player name
        const playerText = new GUI.TextBlock();
        playerText.text = `Way to go, ${this.playerName}!`;
        playerText.color = "yellow";
        playerText.fontSize = 40;
        playerText.fontFamily = "Comic Sans MS";
        playerText.shadowColor = "black";
        playerText.shadowBlur = 5;
        container.addControl(playerText);

        // Add score with stars
        const scoreText = new GUI.TextBlock();
        scoreText.text = `⭐ Score: ${this.score} ⭐`;
        scoreText.color = "white";
        scoreText.fontSize = 48;
        scoreText.fontFamily = "Comic Sans MS";
        container.addControl(scoreText);

        // Add fun emojis
        const emojiText = new GUI.TextBlock();
        emojiText.text = "🦄 🌟 👑 ✨ 🎈 🎨";
        emojiText.fontSize = 40;
        container.addControl(emojiText);

        // Add "Play Again" button
        const playAgainBtn = new GUI.Button.CreateSimpleButton("playAgain", "Play Again! 🎮");
        playAgainBtn.width = "200px";
        playAgainBtn.height = "60px";
        playAgainBtn.color = "white";
        playAgainBtn.background = "green";
        playAgainBtn.cornerRadius = 20;
        playAgainBtn.fontSize = 24;
        playAgainBtn.fontFamily = "Comic Sans MS";
        playAgainBtn.shadowColor = "black";
        playAgainBtn.shadowBlur = 5;
        playAgainBtn.onPointerUpObservable.add(() => {
            window.location.reload();
        });
        container.addControl(playAgainBtn);

        // Animate congratulations text
        this.animateText(congratsText);
    }

    animateText(text) {
        let time = 0;
        this.scene.registerBeforeRender(() => {
            time += 0.1;
            text.scaling = new BABYLON.Vector2(
                1 + Math.sin(time) * 0.1,
                1 + Math.sin(time) * 0.1
            );
            text.rotation = Math.sin(time * 0.5) * 0.1;
        });
    }

    createParticleEffects() {
        // Create multiple particle systems for different effects
        this.createConfetti(-4, 2);
        this.createConfetti(4, 2);
        this.createStars(0, -2);
        this.createStars(-3, -1);
        this.createStars(3, -1);
    }

    createConfetti(x, y) {
        const confetti = new BABYLON.ParticleSystem("confetti", 100, this.scene);
        confetti.particleTexture = new BABYLON.Texture("/textures/sparkle.svg", this.scene);
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
        stars.particleTexture = new BABYLON.Texture("/textures/star.svg", this.scene);
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

    createBalloons(x, y) {
        const balloons = new BABYLON.ParticleSystem("balloons", 20, this.scene);
        balloons.particleTexture = new BABYLON.Texture("textures/balloon.png", this.scene);
        balloons.emitter = new BABYLON.Vector3(x, y, 0);
        balloons.minSize = 0.3;
        balloons.maxSize = 0.5;
        balloons.minLifeTime = 3;
        balloons.maxLifeTime = 5;
        balloons.emitRate = 5;
        balloons.gravity = new BABYLON.Vector3(0, 0.05, 0);
        balloons.direction1 = new BABYLON.Vector3(-0.2, 1, 0);
        balloons.direction2 = new BABYLON.Vector3(0.2, 1, 0);
        balloons.addColorGradient(0, new BABYLON.Color4(1, 0, 0, 1));
        balloons.addColorGradient(0.33, new BABYLON.Color4(0, 1, 0, 1));
        balloons.addColorGradient(0.66, new BABYLON.Color4(0, 0, 1, 1));
        balloons.addColorGradient(1, new BABYLON.Color4(1, 0, 1, 1));
        balloons.start();
    }

    dispose() {
        if (this.scene) {
            this.scene.dispose();
        }
        if (this.engine) {
            this.engine.dispose();
        }
    }
} 