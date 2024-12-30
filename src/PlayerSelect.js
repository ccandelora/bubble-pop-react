import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export class PlayerSelect {
    constructor(canvas, onPlayerSelected) {
        this.canvas = canvas;
        this.onPlayerSelected = onPlayerSelected;
        this.engine = null;
        this.scene = null;
        this.initialize();
    }

    initialize() {
        // Create engine with antialiasing
        this.engine = new BABYLON.Engine(this.canvas, true, { 
            preserveDrawingBuffer: true,
            stencil: true,
            antialias: true
        });
        
        // Create scene
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.16, 0.1, 0.29, 1);

        // Create background preview layer
        this.setupBackgroundPreview();

        // Create camera
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            0,
            Math.PI / 2,
            10,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        camera.setPosition(new BABYLON.Vector3(0, 0, -10));

        // Create light
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        light.intensity = 0.7;

        // Create GUI
        this.createGUI();

        // Start render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    setupBackgroundPreview() {
        // Create a background layer
        this.backgroundTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("backgroundUI", true);
        
        // Create a container for the background
        this.backgroundContainer = new GUI.Rectangle("backgroundContainer");
        this.backgroundContainer.width = "100%";
        this.backgroundContainer.height = "100%";
        this.backgroundContainer.thickness = 0;
        this.backgroundContainer.zIndex = 0;
        this.backgroundContainer.isPointerBlocker = false;
        this.backgroundContainer.background = "rgb(41, 26, 74)"; // Dark purple background
        this.backgroundTexture.addControl(this.backgroundContainer);
        
        // Create background image on top
        this.backgroundImage = new GUI.Image("backgroundPreview", "");
        this.backgroundImage.width = 1;
        this.backgroundImage.height = 1;
        this.backgroundImage.stretch = GUI.Image.STRETCH_FILL;
        this.backgroundImage.alpha = 0;
        this.backgroundImage.isPointerBlocker = false;
        
        // Add the image to the container
        this.backgroundContainer.addControl(this.backgroundImage);
        
        // Create color overlay for tinting on top of the image
        this.backgroundOverlay = new GUI.Rectangle();
        this.backgroundOverlay.width = 1;
        this.backgroundOverlay.height = 1;
        this.backgroundOverlay.thickness = 0;
        this.backgroundOverlay.alpha = 0;
        this.backgroundOverlay.isPointerBlocker = false;
        
        // Add the overlay to the container
        this.backgroundContainer.addControl(this.backgroundOverlay);

        // Log the background setup
        console.log('Background preview setup complete');
    }

    createGUI() {
        const guiTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);

        // Create title text
        const titleText = new GUI.TextBlock("titleText");
        titleText.text = "James' and Madison's Bubble Adventure Game!";
        titleText.color = "white";
        titleText.fontSize = 48;
        titleText.fontFamily = "Comic Sans MS";
        titleText.top = "-200px";
        titleText.zIndex = 1;
        guiTexture.addControl(titleText);

        // Create container for player buttons
        const container = new GUI.Rectangle("container");
        container.width = "800px";
        container.height = "400px";
        container.thickness = 0;
        container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        container.zIndex = 2;
        container.isPointerBlocker = false;
        guiTexture.addControl(container);

        // Create grid for player buttons
        const grid = new GUI.Grid("grid");
        grid.addColumnDefinition(0.5);
        grid.addColumnDefinition(0.5);
        grid.zIndex = 2;
        grid.isPointerBlocker = false;
        container.addControl(grid);

        // Create Madison's button
        const madisonButton = this.createPlayerButton(
            "Madison",
            "👸",
            "#FFB6C1", // Light pink
            "#FF69B4"  // Hot pink
        );
        grid.addControl(madisonButton, 0, 0);

        // Create James's button
        const jamesButton = this.createPlayerButton(
            "James",
            "🦸‍♂️",
            "#87CEEB", // Sky blue
            "#4169E1"  // Royal blue
        );
        grid.addControl(jamesButton, 0, 1);

        // Add sparkle animations with lower zIndex
        this.addSparkleEffects(guiTexture);
    }

    createPlayerButton(name, emoji, color, hoverColor) {
        const button = new GUI.Button(name + "Button");
        button.width = "300px";
        button.height = "300px";
        button.cornerRadius = 20;
        button.thickness = 3;
        button.background = color;
        button.alpha = 0.9;
        button.zIndex = 3;
        button.isPointerBlocker = true;

        const stackPanel = new GUI.StackPanel();
        stackPanel.isPointerBlocker = true;
        button.addControl(stackPanel);

        const emojiText = new GUI.TextBlock();
        emojiText.text = emoji;
        emojiText.fontSize = 100;
        emojiText.height = "150px";
        emojiText.isPointerBlocker = false;
        stackPanel.addControl(emojiText);

        const nameText = new GUI.TextBlock();
        nameText.text = name;
        nameText.color = "white";
        nameText.fontSize = 40;
        nameText.fontFamily = "Comic Sans MS";
        nameText.height = "50px";
        nameText.isPointerBlocker = false;
        stackPanel.addControl(nameText);

        // Add hover effects with background preview
        button.onPointerEnterObservable.add(() => {
            console.log(`Hovering over ${name}'s button`);
            button.background = hoverColor;
            button.scaleX = 1.1;
            button.scaleY = 1.1;

            // Show background preview
            const imagePath = name.toLowerCase() === "madison" ? "/images/princess.webp" : "/images/marvel.webp";
            console.log(`Setting background image to: ${imagePath}`);
            this.backgroundImage.source = imagePath;
            
            // Set overlay color
            const overlayColor = name.toLowerCase() === "madison" 
                ? "rgba(255, 192, 203, 0.2)"  // Light pink
                : "rgba(0, 0, 139, 0.2)";     // Light blue
            console.log(`Setting overlay color to: ${overlayColor}`);
            this.backgroundOverlay.background = overlayColor;
            
            // Fade in background with higher opacity
            this.backgroundImage.alpha = 0.6;  // Make image more visible
            this.backgroundOverlay.alpha = 0.2;  // Subtle tint
        });

        button.onPointerOutObservable.add(() => {
            console.log(`Pointer left ${name}'s button`);
            button.background = color;
            button.scaleX = 1;
            button.scaleY = 1;

            // Fade out background
            this.backgroundImage.alpha = 0;
            this.backgroundOverlay.alpha = 0;
        });

        button.onPointerClickObservable.add(() => {
            console.log(`${name}'s button clicked!`);
            if (this.onPlayerSelected) {
                console.log(`Calling onPlayerSelected with ${name.toLowerCase()}`);
                this.onPlayerSelected(name.toLowerCase());
            } else {
                console.error('onPlayerSelected callback is not defined!');
            }
        });

        return button;
    }

    addSparkleEffects(guiTexture) {
        const sparkleEmojis = ["✨", "⭐", "🌟"];
        const numSparkles = 10;

        for (let i = 0; i < numSparkles; i++) {
            const sparkle = new GUI.TextBlock("sparkle" + i);
            sparkle.text = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
            sparkle.fontSize = 20 + Math.random() * 20;
            sparkle.color = "white";
            sparkle.zIndex = 0;
            sparkle.isPointerBlocker = false;
            
            sparkle.left = (-400 + Math.random() * 800) + "px";
            sparkle.top = (-300 + Math.random() * 600) + "px";
            
            guiTexture.addControl(sparkle);
            this.animateSparkle(sparkle);
        }
    }

    animateSparkle(sparkle) {
        let time = 0;
        const speed = 0.001 + Math.random() * 0.002;
        const amplitude = 50 + Math.random() * 50;
        const baseLeft = parseFloat(sparkle.left);
        const baseTop = parseFloat(sparkle.top);

        this.scene.registerBeforeRender(() => {
            time += this.engine.getDeltaTime();
            sparkle.left = (baseLeft + Math.sin(time * speed) * amplitude) + "px";
            sparkle.top = (baseTop + Math.cos(time * speed) * amplitude) + "px";
            sparkle.rotation = Math.sin(time * speed) * 0.2;
        });
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