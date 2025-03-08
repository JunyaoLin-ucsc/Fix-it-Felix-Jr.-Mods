class Tutorial extends Phaser.Scene {
    constructor() {
      super("Tutorial");
    }
  
    preload() {
      this.load.path = "./assets/";
      // 同样可用另一张地图，这里演示重用 MainMenu.json 做背景
      this.load.tilemapTiledJSON("tutorialMap", "MainMenu.json");
      this.load.image("tilesetImage", "tileset.png");
    }
  
    create() {
      const map = this.make.tilemap({ key: "tutorialMap" });
      const tileset = map.addTilesetImage("tileset", "tilesetImage");
      map.createLayer("Background", tileset, 0, 0);
      map.createLayer("Grass", tileset, 0, 0);
      // ...
  
      this.add.text(
        map.widthInPixels / 2,
        50,
        "Tutorial",
        { fontSize: "48px", color: "#fff", fontFamily: "Arial" }
      ).setOrigin(0.5, 0);
  
      // 简单教程文字
      this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2,
        "Use arrow keys to move Felix.\nAvoid falling objects!\n(Example instructions...)",
        { fontSize: "24px", color: "#fff", align: "center" }
      ).setOrigin(0.5);
  
      let playButton = this.add.text(
        map.widthInPixels / 2, 
        map.heightInPixels - 80,
        "Start Game",
        { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x:10, y:5 } }
      ).setOrigin(0.5)
       .setInteractive();
  
      playButton.on("pointerdown", () => {
        this.scene.start("Gameplay");
      });
    }
  }
  
  window.Tutorial = Tutorial;
  