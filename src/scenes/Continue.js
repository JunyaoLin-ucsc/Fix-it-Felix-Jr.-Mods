class Continue extends Phaser.Scene {
    constructor() {
      super("Continue");
    }
  
    preload() {
      this.load.path = "./assets/";
      this.load.tilemapTiledJSON("gameoverMap", "MainMenu.json");
      this.load.image("tilesetImage", "tileset.png");
      // 加载音效
      this.load.audio("confirm", "confirm.wav");
      this.load.audio("selection", "selection.wav");
    }
  
    create(data) {
      // data 对象包含：{ loop, score }
      // 这里不再需要 canNextLoop，因为在这个场景就是要让玩家继续挑战
  
      const map = this.make.tilemap({ key: "gameoverMap" });
      const tileset = map.addTilesetImage("tileset", "tilesetImage");
      map.createLayer("Background", tileset, 0, 0);
  
      // 标题：Ralph has escaped and will return.
      this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 - 120,
        "Ralph has escaped and will return.",
        {
          fontSize: "48px",
          color: "#ff0000",
          fontFamily: "Arial",
          align: "center"
        }
      ).setOrigin(0.5);
  
      // 显示最终得分
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
  
      // 显示当前 Loop 数
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
  
      // 创建音效对象
      this.confirmSnd = this.sound.add("confirm");
      this.selectionSnd = this.sound.add("selection");
  
      // Next Loop 按钮
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
          // 进入Gameplay，Loop + 1
          this.scene.start("Gameplay", {
            loop: data.loop + 1,
            score: data.score,
            canNextLoop: false
          });
        });
      });
  
      // Restart 按钮（重置游戏：回到 Loop 1，分数归零）
      const restartBtn = this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 + 80,
        "Restart",
        {
          fontSize: "36px",
          backgroundColor: "#000",
          color: "#fff",
          padding: { x: 10, y: 5 }
        }
      ).setOrigin(0.5).setInteractive();
  
      restartBtn.on("pointerover", () => {
        if (this.selectionSnd.isPlaying) {
          this.selectionSnd.stop();
        }
        this.selectionSnd.play();
      });
  
      restartBtn.on("pointerdown", () => {
        if (this.confirmSnd.isPlaying) {
          this.confirmSnd.stop();
        }
        this.confirmSnd.play();
        this.time.delayedCall(200, () => {
          // 重置游戏：回到 Loop 1，分数归零
          this.scene.start("Gameplay", {
            loop: 1,
            score: 0,
            canNextLoop: false
          });
        });
      });
    }
  }
  
  window.Continue = Continue;
  