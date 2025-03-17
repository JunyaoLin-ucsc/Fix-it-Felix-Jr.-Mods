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
    // 此场景专用于游戏真正结束（生命值为0或时间耗尽），显示 "Game Over"

    // 创建音效对象（音量70%）
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
    // 创建并播放 Gameplay 背景音乐，音量50%，循环播放
    this.gameplayBGM = this.sound.add("gameplayBGM", { volume: 0.5, loop: true });
    this.gameplayBGM.play();

    const map = this.make.tilemap({ key: "gameoverMap" });
    const tileset = map.addTilesetImage("tileset", "tileset.png");
    // 加载与 MainMenu 相同的背景图层（确保图层名称与 Tiled 文件中一致）
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);

    // 标题 "Game Over"
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

    // 添加 Main Menu 按钮，放在 Restart 按钮下方
    const mainMenuBtn = this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 100,
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
        // 返回主菜单
        this.scene.start("MainMenu");
      });
    });
  }
}

window.Gameover = Gameover;
