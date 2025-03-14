class Gameover extends Phaser.Scene {
  constructor() {
    super("Gameover");
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
    // data 对象包含：{ loop, score, canNextLoop }
    const map = this.make.tilemap({ key: "gameoverMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    map.createLayer("Background", tileset, 0, 0);
  
    // 根据是否允许进入下一 Loop，选择不同的标题文本
    let titleText;
    if (data.canNextLoop) {
      titleText = "Ralph has escaped and will return.\nAre you going to challenge him?";
    } else {
      titleText = "Game Over";
    }
    
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 120,
      titleText,
      { fontSize: "48px", color: "#ff0000", fontFamily: "Arial", align: "center" }
    ).setOrigin(0.5);
  
    // 显示最终得分
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 60,
      `Score: ${data.score}`,
      { fontSize: "32px", color: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);
  
    // 显示当前 Loop 数
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 20,
      `Loop: ${data.loop}`,
      { fontSize: "28px", color: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);
  
    // 创建音效对象
    this.confirmSnd = this.sound.add("confirm");
    this.selectionSnd = this.sound.add("selection");
  
    // 如果允许进入下一 Loop，则显示 "Next Loop" 按钮
    if (data.canNextLoop) {
      let nextLoopBtn = this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels / 2 + 20,
        "Next Loop",
        { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x: 10, y: 5 } }
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
          // 进入下一个 Loop：将 loop 数加 1，并传递当前得分
          this.scene.start("Gameplay", { loop: data.loop + 1, score: data.score });
        });
      });
    }
  
    // 始终显示 "Restart" 按钮（重置游戏，难度回到 Loop 1，分数归零）
    let restartBtn = this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 80,
      "Restart",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x: 10, y: 5 } }
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
        // 重置游戏：始终以 Loop 1 难度重新开始
        this.scene.start("Gameplay", { loop: 1, score: 0, canNextLoop: false });
      });
    });
  }
}

window.Gameover = Gameover;
