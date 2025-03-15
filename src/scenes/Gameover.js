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
    // loop: 当前 Loop 数（从 Gameplay 传入）
    // score: 玩家最终分数
    // canNextLoop: 是否可以进行下一 Loop

    const map = this.make.tilemap({ key: "gameoverMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    map.createLayer("Background", tileset, 0, 0);

    // 根据 canNextLoop 选择不同标题
    let titleText;
    if (data.canNextLoop) {
      titleText = "Ralph has escaped and will return.\nAre you going to challenge him?";
    } else {
      titleText = "Game Over";
    }

    // 显示标题
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 120,
      titleText,
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

    // 显示当前 Loop 数（直接使用 data.loop）
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

    // 如果可以进入下一 Loop，则显示 "Next Loop" 按钮
    if (data.canNextLoop) {
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

        // 延时以播放音效
        this.time.delayedCall(200, () => {
          // 进入下一 Loop，loop 数加 1，分数保持
          this.scene.start("Gameplay", {
            loop: data.loop + 1,
            score: data.score,
            canNextLoop: false // 进到下一个 loop 时可以根据情况再判断
          });
        });
      });
    }

    // “Restart” 按钮（强制回到 Loop 1 难度，分数清零）
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

      // 延时以播放音效
      this.time.delayedCall(200, () => {
        // 无论如何，都回到 loop=1, score=0
        this.scene.start("Gameplay", {
          loop: this.loop,
          score: this.score,
          canNextLoop: false
        });
      });
    });
  }
}

window.Gameover = Gameover;
