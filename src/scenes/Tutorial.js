class Tutorial extends Phaser.Scene {
  constructor() {
    super("Tutorial");
  }

  preload() {
    this.load.path = "./assets/";
    // Use the same map JSON as MainMenu to load the background (to maintain consistent style)
    this.load.tilemapTiledJSON("tutorialMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");
    // Load sound effects: confirm, selection, and main menu background music (MainMenu.wav)
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
    this.load.audio("mainMenuBGM", "MainMenu.wav");
    // Load bitmap font Unnamed (composed of Unnamed.png and Unnamed.xml)
    this.load.bitmapFont("Unnamed", "Unnamed.png", "Unnamed.xml");
  }

  create() {
    // Keep MainMenuBGM playing continuously, do not call sound.stopAll() to avoid interruption.
    // If mainMenuBGM does not exist yet, create and play it; otherwise, reuse it.
    let bgm = this.sound.get("mainMenuBGM");
    if (!bgm) {
      this.bgm = this.sound.add("mainMenuBGM", { volume: 0.5, loop: true });
      this.bgm.play();
    } else {
      this.bgm = bgm;
    }
    
    // Create confirm and selection sound objects, volume 70%
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
    
    // Create background
    const map = this.make.tilemap({ key: "tutorialMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    // Create multiple layers to ensure complete background display
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);
    
    // Display title "Tutorial" using the Unnamed bitmap font
    this.add.bitmapText(
      map.widthInPixels / 2,
      50,
      "Unnamed",
      "Tutorial",
      48
    ).setOrigin(0.5, 0);
    
    // Instruction text remains unchanged (plain text)
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2,
      "You will play as Felix the repairman tasked with fixing the windows of a building.\n\n" +
      "However, a mischievous gorilla named Ralph will come and cause trouble by secretly throwing stones while you are repairing the windows.\n\n " +
      "Your job is to use the arrow keys (up, down, left, right) to dodge the stones and complete each task within the countdown timer while maintaining more than 1 life.\n\n " +
      "Each loop consists of 5 stages, with the windows in each stage being randomized.\n\n " +
      "Additionally, there are buff items available, such as watermelon, strawberry, and coins.\n\n " +
      "Watermelon increases your window repair speed, strawberry grants temporary invincibility, and coins add an extra life for the current loop.\n\n " +
      "Every repaired window awards 100 points. If you want to achieve a high score, play for as long as you can! Have fun!\n\n",
      { fontSize: "13px", color: "#FF0000", align: "center" }
    ).setOrigin(0.5);
    
    // Create a "Start Playing" button using the Unnamed bitmap font, positioned slightly upward
    let playButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels - 110,
      "Unnamed",
      "Start Playing",
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
      // Stop all sounds (thus stopping mainMenuBGM) before entering Gameplay
      this.sound.stopAll();
      this.time.delayedCall(200, () => {
        this.scene.start("Gameplay");
      });
    });
    
    // Add a new "Main Menu" button using the Unnamed bitmap font, placed below the "Start Playing" button
    let mainMenuButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels - 50,
      "Unnamed",
      "Main Menu",
      36
    ).setOrigin(0.5).setInteractive();
    
    mainMenuButton.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) {
        this.selectionSnd.stop();
      }
      this.selectionSnd.play();
    });
    
    mainMenuButton.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) {
        this.confirmSnd.stop();
      }
      this.confirmSnd.play();
      // Stop all sounds and return to the main menu
      this.sound.stopAll();
      this.time.delayedCall(200, () => {
        this.scene.start("MainMenu");
      });
    });
  }
}

window.Tutorial = Tutorial;
