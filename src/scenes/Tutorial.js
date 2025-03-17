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
    
    let playButton = this.add.text(
      map.widthInPixels / 2, 
      map.heightInPixels - 80,
      "Start Game",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x:10, y:5 } }
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
  }
}

window.Tutorial = Tutorial;
