class MainMenu extends Phaser.Scene {
    constructor() {
      super("MainMenu");
    }
  
    preload() {
      this.load.path = "./assets/";
      // 加载主菜单地图 & tileset
      this.load.tilemapTiledJSON("mainMenuMap", "MainMenu.json");
      this.load.image("tilesetImage", "tileset.png");
    }
  
    create() {
      // 创建主菜单地图
      const map = this.make.tilemap({ key: "mainMenuMap" });
      const tileset = map.addTilesetImage("tileset", "tilesetImage");
      // 依层名称加载
      map.createLayer("Background", tileset, 0, 0);
      map.createLayer("Grass", tileset, 0, 0);
      // ... 其他图层
  
      this.add.text(
        map.widthInPixels / 2, 
        50,
        "Fix It Felix Jr.",
        { fontSize: "48px", color: "#ffffff", fontFamily: "Arial" }
      ).setOrigin(0.5, 0);
  
      let playButton = this.add.text(
        map.widthInPixels / 2, 
        map.heightInPixels - 80,
        "Play",
        { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x:10, y:5 } }
      ).setOrigin(0.5)
       .setInteractive();
  
      playButton.on("pointerdown", () => {
        this.scene.start("Tutorial");
      });
    }
  }
  
  window.MainMenu = MainMenu;
  