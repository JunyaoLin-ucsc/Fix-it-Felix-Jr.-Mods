class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.path = "./assets/";
    // 加载主菜单地图 & tileset
    this.load.tilemapTiledJSON("mainMenuMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");

    // 加载音效（确认和选择），以及主菜单背景音乐
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
    this.load.audio("mainMenuBGM", "MainMenu.wav");

    // ====== 加载位图字体 ======
    this.load.bitmapFont("pixelFont", "Unnamed.png", "Unnamed.xml");
  }

  create() {
    // 停止之前可能残留的声音
    this.sound.stopAll();

    const map = this.make.tilemap({ key: "mainMenuMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);
    // ...

    // 播放主菜单BGM
    this.bgm = this.sound.add("mainMenuBGM", { volume: 0.5, loop: true });
    this.bgm.play();

    // 确认和选择音效
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });

    // ====== 使用 bitmapText 替换普通文本 ======
    // 原先: this.add.text(...)
    // 现在: this.add.bitmapText(x, y, "pixelFont", "文本", 大小)

    // 标题
    this.add.bitmapText(
      map.widthInPixels / 2,
      50,
      "pixelFont",
      "Fix It Felix Jr.",
      36
    ).setOrigin(0.5, 0);

    // “Play” 按钮
    let playButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2,
      "pixelFont",
      "Play",
      36
    ).setOrigin(0.5).setInteractive();

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
      // 切换场景
      this.time.delayedCall(200, () => {
        this.scene.start("Tutorial");
      });
    });
  }
}
