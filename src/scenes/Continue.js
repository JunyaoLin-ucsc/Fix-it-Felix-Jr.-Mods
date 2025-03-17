class Continue extends Phaser.Scene {
    constructor() {
      super("Continue");
    }
    
    preload() {
      this.load.path = "./assets/";
      // 使用 MainMenu.json 来加载背景，与 MainMenu 保持一致
      this.load.tilemapTiledJSON("gameoverMap", "MainMenu.json");
      this.load.image("tilesetImage", "tileset.png");
    
      // 加载音效：确认、选择，以及 Gameplay 背景音乐
      this.load.audio("confirm", "confirm.wav");
      this.load.audio("selection", "selection.wav");
      this.load.audio("gameplayBGM", "Gameplay.wav");
    }
    
    create(data) {
      // data 包含 { loop, score }
      // 先停止前一场景所有声音，避免 bgm 重叠
      this.sound.stopAll();
  
      // 创建音效对象（音量70%）
      this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
      this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
      // 创建并播放 Gameplay 背景音乐（50%音量、循环播放）
      this.gameplayBGM = this.sound.add("gameplayBGM", { volume: 0.5, loop: true });
      this.gameplayBGM.play();
      
      // 创建背景地图与图层
      const map = this.make.tilemap({ key: "gameoverMap" });
      const tileset = map.addTilesetImage("tileset", "tileset.png");
      // 创建多个背景图层，与 MainMenu 保持一致
      map.createLayer("Background", tileset, 0, 0);
      map.createLayer("Grass", tileset, 0, 0);
      map.createLayer("Trees", tileset, 0, 0);
      map.createLayer("Street Lamp", tileset, 0, 0);
      map.createLayer("Moon", tileset, 0, 0);
      map.createLayer("Stars", tileset, 0, 0);
      
      // 显示标题、得分和 Loop 信息
      this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 - 120,
        "Ralph has escaped and will return.\nYou finished Stage 5!",
        { fontSize: "48px", color: "#ff0000", fontFamily: "Arial", align: "center" }
      ).setOrigin(0.5);
      
      this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 - 60,
        `Score: ${data.score}`,
        { fontSize: "32px", color: "#ffffff", fontFamily: "Arial" }
      ).setOrigin(0.5);
      
      this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 - 20,
        `Loop: ${data.loop}`,
        { fontSize: "28px", color: "#ffffff", fontFamily: "Arial" }
      ).setOrigin(0.5);
      
      // 使用 Unnamed 位图字体创建 Next Loop 按钮
      const nextLoopBtn = this.add.bitmapText(
        map.widthInPixels / 2,
        map.heightInPixels / 2 + 20,
        "Unnamed",
        "Next Loop",
        36
      ).setOrigin(0.5).setInteractive();
      
      nextLoopBtn.on("pointerover", () => {
        if (this.selectionSnd.isPlaying) { this.selectionSnd.stop(); }
        this.selectionSnd.play();
      });
      
      nextLoopBtn.on("pointerdown", () => {
        if (this.confirmSnd.isPlaying) { this.confirmSnd.stop(); }
        this.confirmSnd.play();
        this.time.delayedCall(200, () => {
          // 停止所有声音后进入下一 Loop 的 Gameplay
          this.sound.stopAll();
          this.scene.start("Gameplay", { loop: data.loop + 1, score: data.score });
        });
      });
      
      // 使用 Unnamed 位图字体创建 Main Menu 按钮
      const mainMenuBtn = this.add.bitmapText(
        map.widthInPixels / 2,
        map.heightInPixels / 2 + 80,
        "Unnamed",
        "Main Menu",
        36
      ).setOrigin(0.5).setInteractive();
      
      mainMenuBtn.on("pointerover", () => {
        if (this.selectionSnd.isPlaying) { this.selectionSnd.stop(); }
        this.selectionSnd.play();
      });
      
      mainMenuBtn.on("pointerdown", () => {
        if (this.confirmSnd.isPlaying) { this.confirmSnd.stop(); }
        this.confirmSnd.play();
        this.time.delayedCall(200, () => {
          // 停止所有声音后返回主菜单
          this.sound.stopAll();
          this.scene.start("MainMenu");
        });
      });
    }
  }
  
  window.Continue = Continue;
  