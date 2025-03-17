class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
    this.load.path = "./assets/";
    // 加载主菜单地图 & tileset
    this.load.tilemapTiledJSON("mainMenuMap", "MainMenu.json");
    this.load.image("tilesetImage", "tileset.png");

    // 加载音效（确认和选择），以及主菜单背景音乐
    this.load.audio("confirm", "confirm.wav");
    this.load.audio("selection", "selection.wav");
    this.load.audio("mainMenuBGM", "MainMenu.wav");

    // 加载位图字体（使用 Unnamed.png 与 Unnamed.xml）
    this.load.bitmapFont("pixelFont", "Unnamed.png", "Unnamed.xml");

    // 新增：加载 RalphSpritesheet，每帧 192*176
    this.load.spritesheet("Ralph", "RalphSpritesheet.png", {
      frameWidth: 192,
      frameHeight: 176
    });
  }

  create() {
    // 停止之前可能残留的声音
    this.sound.stopAll();

    const map = this.make.tilemap({ key: "mainMenuMap" });
    const tileset = map.addTilesetImage("tileset", "tilesetImage");
    // 加载所有背景 tile layer（确保风格一致）
    map.createLayer("Background", tileset, 0, 0);
    map.createLayer("Grass", tileset, 0, 0);
    map.createLayer("Trees", tileset, 0, 0);
    map.createLayer("Street Lamp", tileset, 0, 0);
    map.createLayer("Moon", tileset, 0, 0);
    map.createLayer("Stars", tileset, 0, 0);

    // 使用位图字体显示标题
    this.add.bitmapText(
      map.widthInPixels / 2,
      50,
      "pixelFont",
      "Fix It Felix Jr.",
      60
    ).setOrigin(0.5, 0);

    // 将“Play”按钮放置在屏幕正中
    let playButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2,
      "pixelFont",
      "Play",
      36
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
      // 延时200ms后进入 Tutorial（保持主菜单BGM播放）
      this.time.delayedCall(200, () => {
        this.scene.start("Tutorial");
      });
    });

    // 在 Play 按钮下方添加 Credit 按钮（同样大小）
    let creditButton = this.add.bitmapText(
      map.widthInPixels / 2,
      map.heightInPixels / 2 + 60,
      "pixelFont",
      "Credit",
      36
    ).setOrigin(0.5).setInteractive();

    creditButton.on("pointerover", () => {
      if (this.selectionSnd.isPlaying) {
        this.selectionSnd.stop();
      }
      this.selectionSnd.play();
    });
    creditButton.on("pointerdown", () => {
      if (this.confirmSnd.isPlaying) {
        this.confirmSnd.stop();
      }
      this.confirmSnd.play();
      this.time.delayedCall(200, () => {
        this.scene.start("Credit");
      });
    });

    // 创建确认和选择音效对象，音量设置为70%
    this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
    this.selectionSnd = this.sound.add("selection", { volume: 0.7 });

    // 播放主菜单背景音乐，音量50%，循环播放
    this.bgm = this.sound.add("mainMenuBGM", { volume: 0.5, loop: true });
    this.bgm.play();

    // ------- 以下为新增的 Ralph 逻辑 -------

    // 1) 定义 Ralph 的动画（idle / move_left / move_right）
    this.anims.create({
      key: "ralph_idle",
      frames: [{ key: "Ralph", frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: "ralph_move_right",
      frames: this.anims.generateFrameNumbers("Ralph", { start: 1, end: 2 }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "ralph_move_left",
      frames: this.anims.generateFrameNumbers("Ralph", { start: 9, end: 10 }),
      frameRate: 5,
      repeat: -1
    });

    // 2) 从“RalphSpawns”对象图层获取出生点
    let ralphSpawn = map.findObject("RalphSpawns", obj => obj.name === "RalphSpawns");
    // 如果找不到就随便放个位置，以免报错
    let ralphX = ralphSpawn ? ralphSpawn.x : 100;
    let ralphY = ralphSpawn ? ralphSpawn.y : 100;

    // 创建 Ralph 精灵并设置初始为 idle
    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph").setDepth(9999);
    this.ralph.play("ralph_idle");

    // 3) 获取 “RalphEdges” 中的左右边界
    //    假设在 Tiled 里你设置了两个对象：name="LeftEdge" 与 name="RightEdge"
    let edgesLayer = map.getObjectLayer("RalphEdges");
    this.leftEdgeX = 0;
    this.rightEdgeX = map.widthInPixels; // 先用整张地图的宽度兜底
    if (edgesLayer && edgesLayer.objects.length > 0) {
      edgesLayer.objects.forEach(obj => {
        if (obj.name === "LeftEdge") {
          this.leftEdgeX = obj.x;
        } else if (obj.name === "RightEdge") {
          this.rightEdgeX = obj.x;
        }
      });
    }

    // 4) 随机决定初始朝向，设定移动速度
    this.ralphDirection = (Phaser.Math.Between(0, 1) === 0) ? "left" : "right";
    this.ralphSpeed = 40; // 你可以调整走路速度

    // 根据方向播放动画
    if (this.ralphDirection === "left") {
      this.ralph.play("ralph_move_left");
    } else {
      this.ralph.play("ralph_move_right");
    }
    // ------- Ralph 相关逻辑到此结束 -------
  }

  update(time, delta) {
    // ------- 以下为 Ralph 移动与边界检测，新增 -------
    if (this.ralph) {
      if (this.ralphDirection === "left") {
        this.ralph.x -= this.ralphSpeed * (delta / 1000);
        // 碰到左边界就立刻改为向右走
        if (this.ralph.x <= this.leftEdgeX) {
          this.ralphDirection = "right";
          this.ralph.play("ralph_move_right");
        }
      } else {
        this.ralph.x += this.ralphSpeed * (delta / 1000);
        // 碰到右边界就立刻改为向左走
        if (this.ralph.x >= this.rightEdgeX) {
          this.ralphDirection = "left";
          this.ralph.play("ralph_move_left");
        }
      }
    }
    // ------- Ralph 新增逻辑结束 -------
  }
}

window.MainMenu = MainMenu;
