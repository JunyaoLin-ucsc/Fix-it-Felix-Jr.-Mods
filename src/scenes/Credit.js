class Credit extends Phaser.Scene {
  constructor() {
    super("Credit");
  }

  preload() {
    this.load.path = "./assets/";
    // Use the same map JSON and tileset as MainMenu to ensure consistent style
    this.load.tilemapTiledJSON("mainMenuMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");

    // Load sound effects (confirm, selection)
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");

    // Load bitmap font
    this.load.bitmapFont("pixelFont", "Unnamed.png", "Unnamed.xml");
  }

  create() {
    // Do not stop the main menu BGM; continue playing (shared by MainMenu and Tutorial)
    const map = this.make.tilemap({ key: "mainMenuMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    // Load all background layers
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);

    // Create confirm and selection sound objects, volume 70%
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });

    // Display the Credit title using bitmap font
    this.add.bitmapText(
      map.widthInPixels / 2,
      50,
      "pixelFont",
      "Credits",
      60
    ).setOrigin(0.5, 0);

    // Credit content, thanks to the following websites
    let creditsContent =
      "Special thanks to:\n\n" +
      "Pixilart:\nhttps://www.pixilart.com/art/fix-it-felix-jr-sr2cdafb5b7dfdc\n\n" +
      "Spriters Resource:\nhttps://www.spriters-resource.com/pc_computer/fixitfelixjr/sheet/60053/\n\n" +
      "Pixel Digivolve Font:\nhttps://www.dafont.com/pixel-digivolve.font";

    // Display in the center of the screen, font size 24 (adjustable as needed)
    this.add.bitmapText(
      map.widthInPixels / 2,
      150,
      "pixelFont",
      creditsContent,
      24
    ).setOrigin(0.5, 0.01);

    // Add Back button to return to MainMenu
    let backButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels - 80,
      "pixelFont",
      "Back",
      36
    ).setOrigin(0.5).setInteractive();

    backButton.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) {
        this.selectionSnd.stop();
      }
      this.selectionSnd.play();
    });
    backButton.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) {
        this.confirmSnd.stop();
      }
      this.confirmSnd.play();
      this.time.delayedCall(200, () => {
        this.scene.start("MainMenu");
      });
    });
  }
}

window.Credit = Credit;
