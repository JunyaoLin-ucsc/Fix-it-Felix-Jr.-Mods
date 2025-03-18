class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.path = "./assets/";
    // Load main menu map & tileset
    this.load.tilemapTiledJSON("mainMenuMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");

    // Load sound effects (confirm and selection) and main menu background music
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
    this.load.audio("mainMenuBGM", "MainMenu.wav");

    // Load bitmap font (using Unnamed.png and Unnamed.xml)
    this.load.bitmapFont("pixelFont", "Unnamed.png", "Unnamed.xml");

    // New: Load RalphSpritesheet, each frame is 192*176
    this.load.spritesheet("Ralph", "RalphSpritesheet.png", {
      frameWidth: 192,
      frameHeight: 176
    });
  }

  create() {
    // Stop any sounds that may have been left over
    this.sound.stopAll();

    const map = this.make.tilemap({ key: "mainMenuMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    // Load all background tile layers (to ensure consistent style)
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);

    // Display title using bitmap font
    this.add.bitmapText(
      map.widthInPixels / 2,
      50,
      "pixelFont",
      "Fix It Felix Jr.",
      60
    ).setOrigin(0.5, 0);

    // Place the "Play" button at the center of the screen
    let playButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2,
      "pixelFont",
      "Play",
      36
    ).setOrigin(0.5).setInteractive();

    playButton.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) {
        this.selectionSnd.stop();
      }
      this.selectionSnd.play();
    });
    playButton.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) {
        this.confirmSnd.stop();
      }
      this.confirmSnd.play();
      // Enter Tutorial after a 200ms delay (while keeping the main menu BGM playing)
      this.time.delayedCall(200, () => {
        this.scene.start("Tutorial");
      });
    });

    // Add Credit button below the Play button (same size)
    let creditButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 60,
      "pixelFont",
      "Credit",
      36
    ).setOrigin(0.5).setInteractive();

    creditButton.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) {
        this.selectionSnd.stop();
      }
      this.selectionSnd.play();
    });
    creditButton.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) {
        this.confirmSnd.stop();
      }
      this.confirmSnd.play();
      this.time.delayedCall(200, () => {
        this.scene.start("Credit");
      });
    });

    // Create confirm and selection sound objects, volume set to 70%
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });

    // Play main menu background music, volume 50%, looped
    this.bgm = this.sound.add("mainMenuBGM", { volume: 0.5, loop: true });
    this.bgm.play();

    // ------- Below is the new Ralph logic -------

    // 1) Define Ralph's animations (idle / move_left / move_right)
    this.anims.create({
      key: "ralph_idle",
      frames: [{ key: "Ralph", frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: "ralph_move_right",
      frames: this.anims.generateFrameNumbers("Ralph", { start: 1, end: 2 }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "ralph_move_left",
      frames: this.anims.generateFrameNumbers("Ralph", { start: 9, end: 10 }),
      frameRate: 5,
      repeat: -1
    });

    // 2) Get spawn point from "RalphSpawns" object layer
    let ralphSpawn = map.findObject("RalphSpawns", obj => obj.name === "RalphSpawns");
    // If not found, set to a default position to avoid errors
    let ralphX = ralphSpawn ? ralphSpawn.x : 100;
    let ralphY = ralphSpawn ? ralphSpawn.y : 100;

    // Create Ralph sprite and set initial state to idle
    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph").setDepth(9999);
    this.ralph.play("ralph_idle");

    // 3) Get left and right boundaries from "RalphEdges"
    //    Assume you have set two objects in Tiled: name="LeftEdge" and name="RightEdge"
    let edgesLayer = map.getObjectLayer("RalphEdges");
    this.leftEdgeX = 0;
    this.rightEdgeX = map.widthInPixels; // Use the full map width as a default
    if (edgesLayer && edgesLayer.objects.length > 0) {
      edgesLayer.objects.forEach(obj => {
        if (obj.name === "LeftEdge") {
          this.leftEdgeX = obj.x;
        } else if (obj.name === "RightEdge") {
          this.rightEdgeX = obj.x;
        }
      });
    }

    // 4) Randomly determine initial direction and set movement speed
    this.ralphDirection = (Phaser.Math.Between(0, 1) === 0) ? "left" : "right";
    this.ralphSpeed = 40; // You can adjust the walking speed

    // Play animation based on direction
    if (this.ralphDirection === "left") {
      this.ralph.play("ralph_move_left");
    } else {
      this.ralph.play("ralph_move_right");
    }
    // ------- End of Ralph related logic -------
  }

  update(time, delta) {
    // ------- Below is new Ralph movement and boundary detection -------
    if (this.ralph) {
      if (this.ralphDirection === "left") {
        this.ralph.x -= this.ralphSpeed * (delta / 1000);
        // When hitting the left boundary, immediately switch to moving right
        if (this.ralph.x <= this.leftEdgeX) {
          this.ralphDirection = "right";
          this.ralph.play("ralph_move_right");
        }
      } else {
        this.ralph.x += this.ralphSpeed * (delta / 1000);
        // When hitting the right boundary, immediately switch to moving left
        if (this.ralph.x >= this.rightEdgeX) {
          this.ralphDirection = "left";
          this.ralph.play("ralph_move_left");
        }
      }
    }
    // ------- End of new Ralph logic -------
  }
}

window.MainMenu = MainMenu;
