class Gameover extends Phaser.Scene {
    constructor() {
      super("Gameover");
    }
  
    preload() {
      this.load.path = "./assets/";
      // 若想给Game Over也用地图背景
      this.load.tilemapTiledJSON("gameoverMap", "MainMenu.json");
      this.load.image("tilesetImage", "tileset.png");
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
  
      let restartBtn = this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 + 50,
        "Restart",
        { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x:10, y:5 } }
      ).setOrigin(0.5)
       .setInteractive();
  
      restartBtn.on("pointerdown", () => {
        this.scene.start("MainMenu");
      });
    }
  }
  
  window.Gameover = Gameover;
  