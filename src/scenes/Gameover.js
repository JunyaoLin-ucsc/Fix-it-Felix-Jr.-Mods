class Gameover extends Phaser.Scene {
  constructor() {
    super("Gameover");
  }

  preload() {
    this.load.path = "./assets/";
    this.load.tilemapTiledJSON("gameoverMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");
    // 加载音效
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
  }

  create() {
    const map = this.make.tilemap({ key: "gameoverMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    map.createLayer("Background", tileset, 0, 0);
  
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 50,
      "Game Over",
      { fontSize: "48px", color: "#ff0000", fontFamily: "Arial" }
    ).setOrigin(0.5);
  
    // 创建音效对象
    this.confirmSnd = this.sound.add("confirm");
    this.selectionSnd = this.sound.add("selection");
  
    let restartBtn = this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 50,
      "Restart",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x:10, y:5 } }
    ).setOrigin(0.5)
     .setInteractive();
  
    restartBtn.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) {
        this.selectionSnd.stop();
      }
      this.selectionSnd.play();
    });
  
    restartBtn.on("pointerdown", () => {
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

window.Gameover = Gameover;
