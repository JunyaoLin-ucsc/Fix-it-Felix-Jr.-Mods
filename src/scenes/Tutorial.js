class Tutorial extends Phaser.Scene {
  constructor() {
    super("Tutorial");
  }

  preload() {
    this.load.path = "./assets/";
    this.load.tilemapTiledJSON("tutorialMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");
    // 加载音效：确认、选择，以及主菜单背景音乐（MainMenu.wav）
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
    this.load.audio("mainMenuBGM", "MainMenu.wav");
  }

  create() {
    // 不调用 sound.stopAll()，保持 MainMenuBGM 连续播放
    // 如果 mainMenuBGM 尚未播放，则创建并播放之
    if (!this.sound.get("mainMenuBGM")) {
      this.bgm = this.sound.add("mainMenuBGM", { volume: 0.5, loop: true });
      this.bgm.play();
    }
    
    // 创建确认和选择音效对象，音量70%
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
    
    // 以下为 Tutorial 场景其他代码（例如地图、文字等）...
    const map = this.make.tilemap({ key: "tutorialMap" });
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
      // 在进入 Gameplay 前停止所有声音（从而停止主菜单BGM）
      this.sound.stopAll();
      this.time.delayedCall(200, () => {
        this.scene.start("Gameplay");
      });
    });
  }
}

window.Tutorial = Tutorial;
