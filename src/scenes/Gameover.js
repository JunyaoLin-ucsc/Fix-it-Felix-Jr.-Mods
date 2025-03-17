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
    this.load.audio("gameplayBGM", "Gameplay.wav");
  }

  create(data) {
    // data 对象包含：{ loop, score }
    // 此场景专用于游戏真正结束，标题直接“Game Over”
    // 即：玩家生命值为0或时间耗尽
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
    this.gameplayBGM = this.sound.add("gameplayBGM", { volume: 0.5, loop: true });
    this.gameplayBGM.play();

    const map = this.make.tilemap({ key: "gameoverMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    map.createLayer("Background", tileset, 0, 0);

    // 标题：Game Over
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 120,
      "Game Over",
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

    // Restart 按钮（重置游戏：回到 Loop 1，分数归零）
    const restartBtn = this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 40,
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

window.Gameover = Gameover;
