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
    // 创建各层
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

    // 添加音效对象
    this.confirmSnd = this.sound.add("confirm");
    this.selectionSnd = this.sound.add("selection");

    let playButton = this.add.text(
      map.widthInPixels / 2, 
      map.heightInPixels - 80,
      "Play",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x:10, y:5 } }
    ).setOrigin(0.5)
     .setInteractive();

    // 鼠标指针悬停时播放 selection 音效（不重叠）
    playButton.on("pointerover", () => {
      if (!this.selectionSnd.isPlaying) {
        this.selectionSnd.play();
      }
    });

    // 按下时播放 confirm 音效，然后切换场景
    playButton.on("pointerdown", () => {
      if (!this.confirmSnd.isPlaying) {
        this.confirmSnd.play();
      }
      // 延时一点以便让音效播放（可根据需要调整延时）
      this.time.delayedCall(200, () => {
        this.scene.start("Tutorial");
      });
    });
  }
}

window.MainMenu = MainMenu;
