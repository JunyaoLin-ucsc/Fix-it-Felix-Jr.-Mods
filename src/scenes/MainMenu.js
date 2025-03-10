class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.path = "./assets/";
    // 加载主菜单地图 & tileset
    this.load.tilemapTiledJSON("mainMenuMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");
    // 加载音效
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
  }

  create() {
    const map = this.make.tilemap({ key: "mainMenuMap" });
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
      "Fix It Felix Jr.",
      { fontSize: "48px", color: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5, 0);

    // 创建音效对象
    this.confirmSnd = this.sound.add("confirm");
    this.selectionSnd = this.sound.add("selection");

    let playButton = this.add.text(
      map.widthInPixels / 2, 
      map.heightInPixels - 80,
      "Play",
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
      // 延时一点播放完音效
      this.time.delayedCall(200, () => {
        this.scene.start("Tutorial");
      });
    });
  }
}

window.MainMenu = MainMenu;
