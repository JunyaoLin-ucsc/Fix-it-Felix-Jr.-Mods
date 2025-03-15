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

    // 【新增】加载 FelixGunSpritesheet.png
    // 注意要把 frameWidth / frameHeight 替换成实际帧宽度 / 高度
    this.load.spritesheet("FelixGun", "FelixGunSpritesheet.png", {
      frameWidth: 128,
      frameHeight: 128
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

    // 如果有碰撞属性，启用物理碰撞
    floorLayer.setCollisionByProperty({ collides: true });
    realFloorLayer.setCollisionByProperty({ collides: true });

    // 从对象层 FelixSpawns 中读取生成点
    const spawnLayer = map.getObjectLayer("FelixSpawns");
    let spawnX = 100, spawnY = 100;
    if (spawnLayer && spawnLayer.objects.length > 0) {
      const spawnObj = spawnLayer.objects[0];
      spawnX = spawnObj.x + (spawnObj.width || 0) / 2;
      spawnY = spawnObj.y + (spawnObj.height || 0) / 2;
    }

    // 创建 Felix
    this.felix = this.physics.add.sprite(spawnX, spawnY, "FelixGun", 0);
    this.felix.setScale(0.7);  // 适当调整大小
    this.felix.setCollideWorldBounds(true);

    // 让 Felix 与地面碰撞
    this.physics.add.collider(this.felix, floorLayer);
    this.physics.add.collider(this.felix, realFloorLayer);

    // 若需要重力，可以在物理世界设置
    this.physics.world.gravity.y = 800;  // 示例数值

    // 设置相机与物理世界边界
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 【关键】让摄像机跟随 Felix
    this.cameras.main.startFollow(this.felix, false, 0.1, 0.1);

    // 添加标题文本
    this.add.text(
      map.widthInPixels / 2,
      50,
      "Boss Battle",
      { fontSize: "48px", fill: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);

    // 创建临时按钮返回主菜单
    const returnBtn = this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels - 100,
      "Victory! Return to Main Menu",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x: 10, y: 5 } }
    ).setOrigin(0.5).setInteractive();
    returnBtn.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });

    // 【定义动画】静止向右=0，静止向左=1，走右=2..3，走左=4..5，跳右=6，跳左=7
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
    this.facing = "right";  // 初始设为 right
    // 创建光标键
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(time, delta) {
    if (!this.felix) return;

    const speed = 200;
    const jumpVelocity = -400;

    // 左右移动
    if (this.cursors.left.isDown) {
      this.felix.setVelocityX(-speed);
      // 播放 move-left
      this.felix.anims.play("move-left", true);
      this.facing = "left";
    }
    else if (this.cursors.right.isDown) {
      this.felix.setVelocityX(speed);
      // 播放 move-right
      this.felix.anims.play("move-right", true);
      this.facing = "right";
    }
    else {
      // 无按键时水平速度归零
      this.felix.setVelocityX(0);
      // 根据 facing 播放对应 idle
      if (this.facing === "right") {
        this.felix.anims.play("idle-right", true);
      } else {
        this.felix.anims.play("idle-left", true);
      }
    }

    // 跳跃：只有当角色脚下着地才允许
    // 可以用 body.blocked.down 或 body.onFloor() / body.touching.down
    if (this.cursors.up.isDown && this.felix.body.blocked.down) {
      this.felix.setVelocityY(jumpVelocity);

      // 根据 facing 决定跳跃动画
      if (this.facing === "right") {
        this.felix.anims.play("jump-right", true);
      } else {
        this.felix.anims.play("jump-left", true);
      }
    }
  }
}

window.BossBattle = BossBattle;
