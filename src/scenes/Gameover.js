class Gameover extends Phaser.Scene {
  constructor() {
    super("Gameover");
  }

  preload() {
    this.load.path = "./assets/";
    this.load.tilemapTiledJSON("gameoverMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");
    // Load sound effects and background music
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
    this.load.audio("gameplayBGM", "Gameplay.wav");
  }

  create(data) {
    // Stop all sounds from the previous scene to avoid overlapping BGM
    this.sound.stopAll();

    // data contains: { loop, score }
    // Create confirm and selection sound objects (70% volume)
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
    // Create and play Gameplay background music (50% volume, looped)
    this.gameplayBGM = this.sound.add("gameplayBGM", { volume: 0.5, loop: true });
    this.gameplayBGM.play();

    const map = this.make.tilemap({ key: "gameoverMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    // Load the same background layers as MainMenu
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);

    // Display title "Game Over"
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 120,
      "Game Over",
      { fontSize: "48px", color: "#ff0000", fontFamily: "Arial", align: "center" }
    ).setOrigin(0.5);

    // Display final score
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 60,
      `Score: ${data.score}`,
      { fontSize: "32px", color: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);

    // Display current Loop number
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 20,
      `Loop: ${data.loop}`,
      { fontSize: "28px", color: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);

    // Create "Restart" button using Unnamed bitmap font (position unchanged)
    const restartBtn = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 40,
      "Unnamed",
      "Restart",
      36
    ).setOrigin(0.5).setInteractive();

    restartBtn.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) { this.selectionSnd.stop(); }
      this.selectionSnd.play();
    });

    restartBtn.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) { this.confirmSnd.stop(); }
      this.confirmSnd.play();
      this.time.delayedCall(200, () => {
        // Reset game: return to Loop 1, reset score to zero
        this.scene.start("Gameplay", {
          loop: 1,
          score: 0,
          canNextLoop: false
        });
      });
    });

    // Create "Main Menu" button using Unnamed bitmap font (placed below Restart)
    const mainMenuBtn = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 100,
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
        // Return to the main menu
        this.scene.start("MainMenu");
      });
    });
  }
}

window.Gameover = Gameover;
