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
        this.backgroundContainer.zIndex = -1;
        this.backgroundContainer.isPointerBlocker = false;
        this.backgroundContainer.background = "rgb(48, 25, 82)"; // Darker purple background
        this.backgroundTexture.addControl(this.backgroundContainer);
        
        // Create background image on top
        this.backgroundImage = new GUI.Image("backgroundPreview", "");
        this.backgroundImage.width = 1;
        this.backgroundImage.height = 1;
        this.backgroundImage.stretch = GUI.Image.STRETCH_FILL;
        this.backgroundImage.alpha = 0;
        this.backgroundImage.isPointerBlocker = false;
        this.backgroundImage.zIndex = -1;
        
        // Add the image to the container
        this.backgroundContainer.addControl(this.backgroundImage);
        
        // Create color overlay for tinting on top of the image
        this.backgroundOverlay = new GUI.Rectangle();
        this.backgroundOverlay.width = 1;
        this.backgroundOverlay.height = 1;
        this.backgroundOverlay.thickness = 0;
        this.backgroundOverlay.alpha = 0;
        this.backgroundOverlay.zIndex = -1;
        this.backgroundOverlay.isPointerBlocker = false;
        
        // Add the overlay to the container
        this.backgroundContainer.addControl(this.backgroundOverlay);

        // Log the background setup
        console.log('Background preview setup complete');
    }

    createGUI() {
        const guiTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);

        // Create main container for everything
        const mainContainer = new GUI.Rectangle("mainContainer");
        mainContainer.width = "1000px";
        mainContainer.height = "800px";
        mainContainer.thickness = 2;
        mainContainer.color = "yellow";
        mainContainer.cornerRadius = 30;
        mainContainer.background = "rgba(255, 255, 255, 0.1)";
        mainContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        mainContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        mainContainer.zIndex = 1;
        guiTexture.addControl(mainContainer);

        // Create title container at the top
        const titleContainer = new GUI.Rectangle("titleContainer");
        titleContainer.height = "300px";
        titleContainer.thickness = 0;
        titleContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        titleContainer.background = "transparent";
        mainContainer.addControl(titleContainer);

        // Create title text with better styling
        const titleText = new GUI.TextBlock("titleText");
        titleText.text = "James' and Madison's";
        titleText.color = "white";
        titleText.fontSize = 50;
        titleText.fontFamily = "Comic Sans MS";
        titleText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        titleText.top = "10px";
        titleContainer.addControl(titleText);

        // Create subtitle text
        const subtitleText = new GUI.TextBlock("subtitleText");
        subtitleText.text = "Bubble Game!";
        subtitleText.color = "white";
        subtitleText.fontSize = 40;
        subtitleText.fontFamily = "Comic Sans MS";
        subtitleText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        subtitleText.top = "50px";
        titleContainer.addControl(subtitleText);

        // Create container for player buttons
        const playerContainer = new GUI.Rectangle("playerContainer");
        playerContainer.width = "900px";
        playerContainer.height = "500px";
        playerContainer.thickness = 0;
        playerContainer.background = "transparent";
        playerContainer.top = "50px";
        mainContainer.addControl(playerContainer);

        // Create grid for player buttons
        const grid = new GUI.Grid("grid");
        grid.addColumnDefinition(0.48);
        grid.addColumnDefinition(0.04); // Space between buttons
        grid.addColumnDefinition(0.48);
        playerContainer.addControl(grid);

        // Create Madison's button
        const madisonButton = this.createPlayerButton(
            "Madison",
            "#FFB6C1",  // Light pink
            "#FF69B4"   // Hot pink
        );
        grid.addControl(madisonButton, 0, 0);

        // Create James's button
        const jamesButton = this.createPlayerButton(
            "James",
            "#87CEEB",  // Sky blue
            "#4169E1"   // Royal blue
        );
        grid.addControl(jamesButton, 0, 2);

        // Add floating bubbles animation
        this.addFloatingBubbles(guiTexture);

        // Add sparkle animations
        this.addEnhancedSparkleEffects(guiTexture);
    }

    createPlayerButton(name, color, hoverColor) {
        const button = new GUI.Button(name + "Button");
        button.width = "320px";
        button.height = "420px";  // Slightly taller to give more space
        button.cornerRadius = 20;
        button.thickness = 4;
        button.background = color;
        button.alpha = 0.95;
        button.zIndex = 3;
        button.isPointerBlocker = true;

        // Add shadow effect to button
        button.shadowColor = "black";
        button.shadowBlur = 10;
        button.shadowOffsetX = 5;
        button.shadowOffsetY = 5;

        const stackPanel = new GUI.StackPanel();
        stackPanel.isPointerBlocker = true;
        stackPanel.paddingTop = "15px";
        button.addControl(stackPanel);

        // Create photo container for border effect
        const photoContainer = new GUI.Rectangle("photoContainer");
        photoContainer.width = "280px";
        photoContainer.height = "320px";
        photoContainer.thickness = 3;
        photoContainer.color = "white";
        photoContainer.cornerRadius = 15;
        photoContainer.background = "white";
        stackPanel.addControl(photoContainer);

        // Add player photo
        const photo = new GUI.Image(name + "Photo", `/images/${name.toLowerCase()}.webp`);
        photo.width = "270px";
        photo.height = "310px";
        photo.cornerRadius = 12;
        photo.stretch = GUI.Image.STRETCH_UNIFORM;
        photo.isPointerBlocker = false;
        photoContainer.addControl(photo);

        // Add name with enhanced styling
        const nameText = new GUI.TextBlock();
        nameText.text = name;
        nameText.color = "white";
        nameText.fontSize = 44;
        nameText.fontFamily = "Comic Sans MS";
        nameText.height = "60px";
        nameText.paddingTop = "10px";
        nameText.isPointerBlocker = false;
        nameText.shadowColor = "black";
        nameText.shadowBlur = 2;
        nameText.shadowOffsetX = 2;
        nameText.shadowOffsetY = 2;
        stackPanel.addControl(nameText);

        // Add hover effects with background preview
        button.onPointerEnterObservable.add(() => {
            console.log(`Hovering over ${name}'s button`);
            button.background = hoverColor;
            button.scaleX = 1.05;
            button.scaleY = 1.05;
            photoContainer.thickness = 5;
            nameText.fontSize = 48;

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
            photoContainer.thickness = 3;
            nameText.fontSize = 44;

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

    addEnhancedSparkleEffects(guiTexture) {
        const sparkleEmojis = ["✨", "⭐", "🌟", "💫"];
        const numSparkles = 15;  // Increased number of sparkles

        for (let i = 0; i < numSparkles; i++) {
            const sparkle = new GUI.TextBlock("sparkle" + i);
            sparkle.text = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
            sparkle.fontSize = 15 + Math.random() * 25;  // More size variation
            sparkle.color = "white";
            sparkle.zIndex = 0;
            sparkle.isPointerBlocker = false;
            
            sparkle.left = (-400 + Math.random() * 800) + "px";
            sparkle.top = (-300 + Math.random() * 600) + "px";
            
            guiTexture.addControl(sparkle);
            this.animateSparkle(sparkle, 0.0005 + Math.random() * 0.002);  // Varied speeds
        }
    }

    addFloatingBubbles(guiTexture) {
        const numBubbles = 8;
        for (let i = 0; i < numBubbles; i++) {
            const bubble = new GUI.Ellipse("bubble" + i);
            bubble.width = "40px";
            bubble.height = "40px";
            bubble.thickness = 2;
            bubble.color = "white";
            bubble.background = "rgba(255, 255, 255, 0.1)";
            bubble.zIndex = 0;
            bubble.isPointerBlocker = false;

            // Random starting positions
            bubble.left = (-400 + Math.random() * 800) + "px";
            bubble.top = (300 + Math.random() * 300) + "px";  // Start from bottom

            guiTexture.addControl(bubble);

            // Animate bubble floating up
            let time = Math.random() * Math.PI * 2;
            this.scene.registerBeforeRender(() => {
                time += this.engine.getDeltaTime() / 1000;
                
                // Move up with sine wave motion
                const currentTop = parseFloat(bubble.top);
                bubble.top = (currentTop - 0.5) + "px";  // Constant upward motion
                bubble.left = (parseFloat(bubble.left) + Math.sin(time) * 0.5) + "px";

                // Reset position when bubble goes off screen
                if (currentTop < -400) {
                    bubble.top = "600px";
                    bubble.left = (-400 + Math.random() * 800) + "px";
                }
            });
        }
    }

    animateSparkle(sparkle, speed) {
        let time = Math.random() * Math.PI * 2;  // Random start time
        const amplitude = 30 + Math.random() * 40;  // Varied movement range
        const baseLeft = parseFloat(sparkle.left);
        const baseTop = parseFloat(sparkle.top);

        this.scene.registerBeforeRender(() => {
            time += this.engine.getDeltaTime() * speed;
            sparkle.left = (baseLeft + Math.sin(time) * amplitude) + "px";
            sparkle.top = (baseTop + Math.cos(time) * amplitude) + "px";
            sparkle.rotation = Math.sin(time) * 0.3;  // Added rotation
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