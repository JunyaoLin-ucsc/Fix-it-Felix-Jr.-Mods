class Continue extends Phaser.Scene {
    constructor() {
      super("Continue");
    }
    
    preload() {
      this.load.path = "./assets/";
      // 使用与 Gameover / MainMenu 同一个 JSON
      this.load.tilemapTiledJSON("gameoverMap", "MainMenu.json");
      this.load.image("tilesetImage", "tileset.png");
  
      // 加载音效：确认、选择，以及 Gameplay 背景音乐
      this.load.audio("confirm", "confirm.wav");
      this.load.audio("selection", "selection.wav");
      this.load.audio("gameplayBGM", "Gameplay.wav");
    }
    
    create(data) {
      // data 对象包含：{ loop, score }
      // 创建音效对象，音量70%
      this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
      this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
      // 创建并播放 Gameplay 背景音乐，音量50%，循环播放
      this.gameplayBGM = this.sound.add("gameplayBGM", { volume: 0.5, loop: true });
      this.gameplayBGM.play();
      
      // === 加载并创建所有需要的图层 ===
      const map = this.make.tilemap({ key: "gameoverMap" });
      const tileset = map.addTilesetImage("tileset", "tilesetImage");
  
      // 注意：以下 createLayer 的名字要和 Tiled 文件里的图层名称保持一致
      map.createLayer("Background", tileset, 0, 0);
      map.createLayer("Grass", tileset, 0, 0);
      map.createLayer("Trees", tileset, 0, 0);
      map.createLayer("Street Lamp", tileset, 0, 0);
      map.createLayer("Moon", tileset, 0, 0);
      map.createLayer("Stars", tileset, 0, 0);
      // 如果你只想要一层“Background”，就保留一行即可，但要确认 Tiled 中确实存在该图层且有Tile
  
      // 显示标题、得分、Loop 信息
      this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 - 120,
        "Ralph has escaped and will return.\nYou finished Stage 5!",
        {
          fontSize: "48px",
          color: "#ff0000",
          fontFamily: "Arial",
          align: "center"
        }
      ).setOrigin(0.5);
      
      this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 - 60,
        `Score: ${data.score}`,
        {
          fontSize: "32px",
          color: "#ffffff",
          fontFamily: "Arial"
        }
      ).setOrigin(0.5);
      
      this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 - 20,
        `Loop: ${data.loop}`,
        {
          fontSize: "28px",
          color: "#ffffff",
          fontFamily: "Arial"
        }
      ).setOrigin(0.5);
      
      // 按钮1: Next Loop
      const nextLoopBtn = this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 + 20,
        "Next Loop",
        {
          fontSize: "36px",
          backgroundColor: "#000",
          color: "#fff",
          padding: { x: 10, y: 5 }
        }
      ).setOrigin(0.5).setInteractive();
      
      nextLoopBtn.on("pointerover", () => {
        if (this.selectionSnd.isPlaying) {
          this.selectionSnd.stop();
        }
        this.selectionSnd.play();
      });
      
      nextLoopBtn.on("pointerdown", () => {
        if (this.confirmSnd.isPlaying) {
          this.confirmSnd.stop();
        }
        this.confirmSnd.play();
        this.time.delayedCall(200, () => {
          // 停止 Gameplay BGM 后进入下一 Loop 的 Gameplay
          this.sound.stopAll();
          this.scene.start("Gameplay", {
            loop: data.loop + 1,
            score: data.score
          });
        });
      });
      
      // 按钮2: Main Menu
      const mainMenuBtn = this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 + 80,
        "Main Menu",
        {
          fontSize: "36px",
          backgroundColor: "#000",
          color: "#fff",
          padding: { x: 10, y: 5 }
        }
      ).setOrigin(0.5).setInteractive();
      
      mainMenuBtn.on("pointerover", () => {
        if (this.selectionSnd.isPlaying) {
          this.selectionSnd.stop();
        }
        this.selectionSnd.play();
      });
      
      mainMenuBtn.on("pointerdown", () => {
        if (this.confirmSnd.isPlaying) {
          this.confirmSnd.stop();
        }
        this.confirmSnd.play();
        this.time.delayedCall(200, () => {
          // 停止 Gameplay BGM 后回到主菜单
          this.sound.stopAll();
          this.scene.start("MainMenu");
        });
      });
    }
  }
  
  window.Continue = Continue;
  