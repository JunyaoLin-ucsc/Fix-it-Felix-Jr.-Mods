class Continue extends Phaser.Scene {
  constructor() {
    super("Continue");
  }
  
  preload() {
    this.load.path = "./assets/";
    // Use MainMenu.json to load the background to keep it consistent with MainMenu
    this.load.tilemapTiledJSON("gameoverMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");
  
    // Load sound effects: confirm, selection, and Gameplay background music
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
    this.load.audio("gameplayBGM", "Gameplay.wav");
  }
  
  create(data) {
    // data contains { loop, score }
    // Stop all previous scene sounds first to avoid overlapping BGM
    this.sound.stopAll();

    // Create sound effect objects (70% volume)
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
    // Create and play Gameplay background music (50% volume, looped)
    this.gameplayBGM = this.sound.add("gameplayBGM", { volume: 0.5, loop: true });
    this.gameplayBGM.play();
    
    // Create background map and layers
    const map = this.make.tilemap({ key: "gameoverMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    // Create multiple background layers to keep it consistent with MainMenu
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);
    
    // Display title, score, and loop information
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 120,
      "Ralph has escaped and will return.\nYou finished Stage 5!",
      { fontSize: "48px", color: "#ff0000", fontFamily: "Arial", align: "center" }
    ).setOrigin(0.5);
    
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 60,
      `Score: ${data.score}`,
      { fontSize: "32px", color: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);
    
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 20,
      `Loop: ${data.loop}`,
      { fontSize: "28px", color: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);
    
    // Create "Next Loop" button using the Unnamed bitmap font
    const nextLoopBtn = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 20,
      "Unnamed",
      "Next Loop",
      36
    ).setOrigin(0.5).setInteractive();
    
    nextLoopBtn.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) { this.selectionSnd.stop(); }
      this.selectionSnd.play();
    });
    
    nextLoopBtn.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) { this.confirmSnd.stop(); }
      this.confirmSnd.play();
      this.time.delayedCall(200, () => {
        // Stop all sounds before entering the next loop's Gameplay
        this.sound.stopAll();
        this.scene.start("Gameplay", { loop: data.loop + 1, score: data.score });
      });
    });
    
    // Create "Main Menu" button using the Unnamed bitmap font
    const mainMenuBtn = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 80,
      "Unnamed",
      "Main Menu",
      36
    ).setOrigin(0.5).setInteractive();
    
    mainMenuBtn.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) { this.selectionSnd.stop(); }
      this.selectionSnd.play();
    });
    
    mainMenuBtn.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) { this.confirmSnd.stop(); }
      this.confirmSnd.play();
      this.time.delayedCall(200, () => {
        // Stop all sounds before returning to the main menu
        this.sound.stopAll();
        this.scene.start("MainMenu");
      });
    });
  }
}

window.Continue = Continue;
