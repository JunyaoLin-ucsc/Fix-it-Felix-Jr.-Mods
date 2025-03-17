class Tutorial extends Phaser.Scene {
  constructor() {
    super("Tutorial");
  }

  preload() {
    this.load.path = "./assets/";
    // 使用与 MainMenu 相同的地图 JSON 来加载背景（保持风格一致）
    this.load.tilemapTiledJSON("tutorialMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");
    // 加载音效：确认、选择，以及主菜单背景音乐（MainMenu.wav）
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
    this.load.audio("mainMenuBGM", "MainMenu.wav");
    // 加载位图字体 Unnamed（由 Unnamed.png 和 Unnamed.xml 构成）
    this.load.bitmapFont("Unnamed", "Unnamed.png", "Unnamed.xml");
  }

  create() {
    // 保持 MainMenuBGM 连续播放，不调用 sound.stopAll() 以免中断
    // 如果 mainMenuBGM 尚未存在，则创建并播放；否则直接复用
    let bgm = this.sound.get("mainMenuBGM");
    if (!bgm) {
      this.bgm = this.sound.add("mainMenuBGM", { volume: 0.5, loop: true });
      this.bgm.play();
    } else {
      this.bgm = bgm;
    }
    
    // 创建确认和选择音效对象，音量70%
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
    
    // 创建背景
    const map = this.make.tilemap({ key: "tutorialMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    // 创建多个图层以保证背景完整显示
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);
    
    // 使用 Unnamed 位图字体显示标题 "Tutorial"
    this.add.bitmapText(
      map.widthInPixels / 2,
      50,
      "Unnamed",
      "Tutorial",
      48
    ).setOrigin(0.5, 0);
    
    // 说明文字保持不变（普通文本）
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2,
      "Use arrow keys to move Felix.\nAvoid falling objects!\n(Example instructions...)",
      { fontSize: "24px", color: "#fff", align: "center" }
    ).setOrigin(0.5);
    
    // 使用 Unnamed 位图字体创建 "Start Playing" 按钮，向上移动一些
    let playButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels - 110,
      "Unnamed",
      "Start Playing",
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
      // 在进入 Gameplay 前，停止所有声音（从而停止 mainMenuBGM）
      this.sound.stopAll();
      this.time.delayedCall(200, () => {
        this.scene.start("Gameplay");
      });
    });
    
    // 新增 "Main Menu" 按钮，使用 Unnamed 位图字体，放在 "Start Playing" 按钮下面
    let mainMenuButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels - 50,
      "Unnamed",
      "Main Menu",
      36
    ).setOrigin(0.5).setInteractive();
    
    mainMenuButton.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) {
        this.selectionSnd.stop();
      }
      this.selectionSnd.play();
    });
    
    mainMenuButton.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) {
        this.confirmSnd.stop();
      }
      this.confirmSnd.play();
      // 停止所有声音后返回主菜单
      this.sound.stopAll();
      this.time.delayedCall(200, () => {
        this.scene.start("MainMenu");
      });
    });
  }
}

window.Tutorial = Tutorial;
