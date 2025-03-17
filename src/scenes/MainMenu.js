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

    // 加载位图字体（使用 Unnamed.png 与 Unnamed.xml）
    this.load.bitmapFont("pixelFont", "Unnamed.png", "Unnamed.xml");
  }

  create() {
    // 停止之前可能残留的声音
    this.sound.stopAll();

    const map = this.make.tilemap({ key: "mainMenuMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    // 加载所有背景 tile layer（确保风格一致）
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);

    // 使用位图字体显示标题
    this.add.bitmapText(
      map.widthInPixels / 2,
      50,
      "pixelFont",
      "Fix It Felix Jr.",
      60
    ).setOrigin(0.5, 0);

    // 将“Play”按钮放置在屏幕正中
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
      // 延时200ms后进入 Tutorial（保持主菜单BGM播放）
      this.time.delayedCall(200, () => {
        this.scene.start("Tutorial");
      });
    });

    // 在 Play 按钮下方添加 Credit 按钮（同样大小）
    let creditButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 60,
      "pixelFont",
      "Credit",
      36
    ).setOrigin(0.5).setInteractive();

    creditButton.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) {
        this.selectionSnd.stop();
      }
      this.selectionSnd.play();
    });
    creditButton.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) {
        this.confirmSnd.stop();
      }
      this.confirmSnd.play();
      this.time.delayedCall(200, () => {
        this.scene.start("Credit");
      });
    });

    // 创建确认和选择音效对象，音量设置为70%
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });

    // 播放主菜单背景音乐，音量50%，循环播放
    this.bgm = this.sound.add("mainMenuBGM", { volume: 0.5, loop: true });
    this.bgm.play();
  }
}

window.MainMenu = MainMenu;
