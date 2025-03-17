class Gameover extends Phaser.Scene {
  constructor() {
    super("Gameover");
  }

  preload() {
    this.load.path = "./assets/";
    this.load.tilemapTiledJSON("gameoverMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");
    // 加载音效与背景音乐
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
    this.load.audio("gameplayBGM", "Gameplay.wav");
  }

  create(data) {
    // 停止前一场景所有声音，避免 bgm 重叠
    this.sound.stopAll();

    // data 包含：{ loop, score }
    // 创建确认和选择音效对象（音量70%）
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
    // 创建并播放 Gameplay 背景音乐（50%音量、循环播放）
    this.gameplayBGM = this.sound.add("gameplayBGM", { volume: 0.5, loop: true });
    this.gameplayBGM.play();

    const map = this.make.tilemap({ key: "gameoverMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    // 加载与 MainMenu 相同的背景图层
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);

    // 显示标题 "Game Over"
    this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels / 2 - 120,
      "Game Over",
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

    // 使用 Unnamed 位图字体创建 Restart 按钮（位置不变）
    const restartBtn = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 40,
      "Unnamed",
      "Restart",
      36
    ).setOrigin(0.5).setInteractive();

    restartBtn.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) { this.selectionSnd.stop(); }
      this.selectionSnd.play();
    });

    restartBtn.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) { this.confirmSnd.stop(); }
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

    // 使用 Unnamed 位图字体创建 Main Menu 按钮（放在 Restart 下方）
    const mainMenuBtn = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 100,
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
        // 返回主菜单
        this.scene.start("MainMenu");
      });
    });
  }
}

window.Gameover = Gameover;
