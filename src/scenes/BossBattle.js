class BossBattle extends Phaser.Scene {
  constructor() {
    super("BossBattle");
  }

  preload() {
    this.load.path = "./assets/";
    // 加载 BossBattle 场景的 JSON 地图
    this.load.tilemapTiledJSON("bossBattleMap", "BossBattle.json");

    // 加载两张 tileset 对应的图像（根据你的实际文件名）
    this.load.image("morningAdventuresImage", "morning_adventures_tileset_16x16.png");
    this.load.image("layoutHelpImage", "layout_help.png");

    // 加载 FelixGunSpritesheet.png（注意替换帧尺寸为实际尺寸）
    this.load.spritesheet("FelixGun", "FelixGunSpritesheet.png", {
      frameWidth: 641,
      frameHeight: 608
    });
  }

  create() {
    const map = this.make.tilemap({ key: "bossBattleMap" });

    const morningTileset = map.addTilesetImage("morning_adventures_tileset_16x16", "morningAdventuresImage");
    const layoutTileset   = map.addTilesetImage("layout_help", "layoutHelpImage");

    // 创建图层：Background、Floor、Real Floor
    const backgroundLayer = map.createLayer("Background", [morningTileset, layoutTileset], 0, 0).setDepth(0);
    const floorLayer      = map.createLayer("Floor",      [morningTileset, layoutTileset], 0, 0).setDepth(1);
    const realFloorLayer  = map.createLayer("Real Floor", [morningTileset, layoutTileset], 0, 0).setDepth(2);

    // Matter：将 tilemap 图层转换为静态物理体
    this.matter.world.convertTilemapLayer(floorLayer);
    this.matter.world.convertTilemapLayer(realFloorLayer);

    // 从对象层 FelixSpawns 中读取生成点
    const spawnLayer = map.getObjectLayer("FelixSpawns");
    let spawnX = 100, spawnY = 100;
    if (spawnLayer && spawnLayer.objects.length > 0) {
      const spawnObj = spawnLayer.objects[0];
      spawnX = spawnObj.x + (spawnObj.width || 0) / 2;
      spawnY = spawnObj.y + (spawnObj.height || 0) / 2;
    }

    // 使用 Matter 创建 Felix
    this.felix = this.matter.add.sprite(spawnX, spawnY, "FelixGun", 0);
    this.felix.setScale(0.1);  // 适当调整大小
    this.felix.setFixedRotation();  // 防止碰撞时旋转

    // 设置 Matter 世界边界（与 tilemap 尺寸一致）
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 设置相机边界，并让摄像机跟随 Felix
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.felix, false, 0.1, 0.1);

    // 添加标题文本
    this.add.text(
      map.widthInPixels / 2,
      50,
      "Boss Battle",
      { fontSize: "48px", fill: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);

    // 创建返回主菜单按钮
    const returnBtn = this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels - 100,
      "Victory! Return to Main Menu",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x: 10, y: 5 } }
    ).setOrigin(0.5).setInteractive();
    returnBtn.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });

    // 定义动画（与原版一致）
    this.anims.create({
      key: "idle-right",
      frames: [{ key: "FelixGun", frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: "idle-left",
      frames: [{ key: "FelixGun", frame: 1 }],
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: "move-right",
      frames: this.anims.generateFrameNumbers("FelixGun", { start: 2, end: 3 }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "move-left",
      frames: this.anims.generateFrameNumbers("FelixGun", { start: 4, end: 5 }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "jump-right",
      frames: [{ key: "FelixGun", frame: 6 }],
      frameRate: 1
    });
    this.anims.create({
      key: "jump-left",
      frames: [{ key: "FelixGun", frame: 7 }],
      frameRate: 1
    });

    // 用于记录 Felix 最后面向方向
    this.facing = "right";  
    // 创建光标键
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(time, delta) {
    if (!this.felix) return;

    const speed = 200;
    // Matter 跳跃力度（需微调）
    const jumpVelocity = -10;

    // 左右移动
    if (this.cursors.left.isDown) {
      this.felix.setVelocityX(-speed);
      this.felix.anims.play("move-left", true);
      this.facing = "left";
    }
    else if (this.cursors.right.isDown) {
      this.felix.setVelocityX(speed);
      this.felix.anims.play("move-right", true);
      this.facing = "right";
    }
    else {
      this.felix.setVelocityX(0);
      if (this.facing === "right") {
        this.felix.anims.play("idle-right", true);
      } else {
        this.felix.anims.play("idle-left", true);
      }
    }

    // 简单判断是否在地面：当垂直速度接近 0 时允许跳跃
    if (this.cursors.up.isDown && Math.abs(this.felix.body.velocity.y) < 1) {
      this.felix.setVelocityY(jumpVelocity);
      if (this.facing === "right") {
        this.felix.anims.play("jump-right", true);
      } else {
        this.felix.anims.play("jump-left", true);
      }
    }
  }
}

window.BossBattle = BossBattle;
