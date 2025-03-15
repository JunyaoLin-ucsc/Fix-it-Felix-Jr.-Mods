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
    // loop：当前 Loop 数（从 Gameplay 传入）
    // score：玩家最终得分
    // canNextLoop：是否可以进行下一 Loop（若为 true，则显示 Next Loop 和 Challenge Him 两个按钮）
    const map = this.make.tilemap({ key: "gameoverMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    map.createLayer("Background", tileset, 0, 0);

    // 根据 canNextLoop 选择不同标题文本
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

    // 如果允许进入下一 Loop，则显示 “Next Loop” 和 “Challenge Him” 两个按钮
    if (data.canNextLoop) {
      // Next Loop 按钮（进入下一个 Loop，Gameplay 中难度按下一个 Loop 计算）
      const nextLoopBtn = this.add.text(
        map.widthInPixels / 2 - 150,
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
          this.scene.start("Gameplay", {
            loop: data.loop + 1,
            score: data.score,
            canNextLoop: false
          });
        });
      });

      // Challenge Him 按钮（进入 BossBattle 场景）
      const challengeBtn = this.add.text(
        map.widthInPixels / 2 + 150,
        map.heightInPixels / 2 + 20,
        "Challenge Him",
        {
          fontSize: "36px",
          backgroundColor: "#000",
          color: "#fff",
          padding: { x: 10, y: 5 }
        }
      ).setOrigin(0.5).setInteractive();

      challengeBtn.on("pointerover", () => {
        if (this.selectionSnd.isPlaying) {
          this.selectionSnd.stop();
        }
        this.selectionSnd.play();
      });

      challengeBtn.on("pointerdown", () => {
        if (this.confirmSnd.isPlaying) {
          this.confirmSnd.stop();
        }
        this.confirmSnd.play();
        this.time.delayedCall(200, () => {
          // 进入 BossBattle 场景，传递 loop 加 1 和当前 score
          this.scene.start("BossBattle", {
            loop: data.loop + 1,
            score: data.score
          });
        });
      });
    }

    // 始终显示 “Restart” 按钮（重置游戏：回到 Loop 1，分数归零）
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
        // 重置游戏：始终回到 Loop 1 且分数归零
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
