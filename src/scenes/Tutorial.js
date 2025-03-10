class Tutorial extends Phaser.Scene {
  constructor() {
    super("Tutorial");
  }

  preload() {
    this.load.path = "./assets/";
    this.load.tilemapTiledJSON("tutorialMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");
    // 加载音效
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
  }

  create() {
    const map = this.make.tilemap({ key: "tutorialMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);

    this.add.text(
      map.widthInPixels / 2,
      50,
      "Tutorial",
      { fontSize: "48px", color: "#fff", fontFamily: "Arial" }
    ).setOrigin(0.5, 0);

    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2,
      "Use arrow keys to move Felix.\nAvoid falling objects!\n(Example instructions...)",
      { fontSize: "24px", color: "#fff", align: "center" }
    ).setOrigin(0.5);

    // 创建音效对象
    this.confirmSnd = this.sound.add("confirm");
    this.selectionSnd = this.sound.add("selection");

    let playButton = this.add.text(
      map.widthInPixels / 2, 
      map.heightInPixels - 80,
      "Start Game",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x:10, y:5 } }
    ).setOrigin(0.5)
     .setInteractive();

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
      this.time.delayedCall(200, () => {
        this.scene.start("Gameplay");
      });
    });
  }
}

window.Tutorial = Tutorial;
