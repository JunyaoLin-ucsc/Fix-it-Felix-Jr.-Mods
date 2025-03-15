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

    // 加载 FelixGunSpritesheet.png
    this.load.spritesheet("FelixGun", "FelixGunSpritesheet.png", {
      frameWidth: 641,
      frameHeight: 608
    });
  }

  create() {
    const map = this.make.tilemap({ key: "bossBattleMap" });

    const morningTileset = map.addTilesetImage(
      "morning_adventures_tileset_16x16",
      "morningAdventuresImage"
    );
    const layoutTileset = map.addTilesetImage("layout_help", "layoutHelpImage");

    // 创建图层：Background、Floor、Real Floor
    const backgroundLayer = map
      .createLayer("Background", [morningTileset, layoutTileset], 0, 0)
      .setDepth(0);
    const floorLayer = map
      .createLayer("Floor", [morningTileset, layoutTileset], 0, 0)
      .setDepth(1);
    const realFloorLayer = map
      .createLayer("Real Floor", [morningTileset, layoutTileset], 0, 0)
      .setDepth(2);

    // 如果有碰撞属性，启用物理碰撞
    floorLayer.setCollisionByProperty({ collides: true });
    realFloorLayer.setCollisionByProperty({ collides: true });

    // 从对象层 FelixSpawns 中读取生成点
    const spawnLayer = map.getObjectLayer("FelixSpawns");
    let spawnX = 100,
      spawnY = 100;
    if (spawnLayer && spawnLayer.objects.length > 0) {
      const spawnObj = spawnLayer.objects[0];
      spawnX = spawnObj.x + (spawnObj.width || 0) / 2;
      spawnY = spawnObj.y + (spawnObj.height || 0) / 2;
    }

    // 创建 Felix
    this.felix = this.physics.add.sprite(spawnX, spawnY, "FelixGun", 0);
    this.felix.setScale(0.1); // 适当调整大小
    this.felix.setCollideWorldBounds(true);

    // 让 Felix 与地面碰撞
    this.physics.add.collider(this.felix, floorLayer);
    this.physics.add.collider(this.felix, realFloorLayer);

    // 若需要重力，可以在物理世界设置
    this.physics.world.gravity.y = 800; // 示例数值

    // 设置相机与物理世界边界
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 让摄像机跟随 Felix
    this.cameras.main.startFollow(this.felix, false, 0.1, 0.1);

    // 添加标题文本
    this.add
      .text(map.widthInPixels / 2, 50, "Boss Battle", {
        fontSize: "48px",
        fill: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 创建临时按钮返回主菜单
    const returnBtn = this.add
      .text(map.widthInPixels / 2, map.heightInPixels - 100, "Victory! Return to Main Menu", {
        fontSize: "36px",
        backgroundColor: "#000",
        color: "#fff",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setInteractive();
    returnBtn.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });

    // 定义动画：静止向右=0，静止向左=1，走右=2..3，走左=4..5，跳右=6，跳左=7
    this.anims.create({
      key: "idle-right",
      frames: [{ key: "FelixGun", frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: "idle-left",
      frames: [{ key: "FelixGun", frame: 1 }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: "move-right",
      frames: this.anims.generateFrameNumbers("FelixGun", { start: 2, end: 3 }),
      frameRate: 5,
      repeat: -1,
    });
    this.anims.create({
      key: "move-left",
      frames: this.anims.generateFrameNumbers("FelixGun", { start: 4, end: 5 }),
      frameRate: 5,
      repeat: -1,
    });
    this.anims.create({
      key: "jump-right",
      frames: [{ key: "FelixGun", frame: 6 }],
      frameRate: 1,
    });
    this.anims.create({
      key: "jump-left",
      frames: [{ key: "FelixGun", frame: 7 }],
      frameRate: 1,
    });

    // 用于记录 Felix 最后面向方向
    this.facing = "right"; // 初始设为 right
    // 创建光标键
    this.cursors = this.input.keyboard.createCursorKeys();

    // 【关键新增】标记角色是否在斜坡上
    this.onSlope = false;

    // 【关键】给带 slope=true 的 Tile 设置回调，用于贴合角色到斜坡
    floorLayer.forEachTile((tile) => {
      if (tile.properties.slope) {
        floorLayer.setTileCollisionCallback(tile.index, this.handleSlope, this);
      }
    });
    realFloorLayer.forEachTile((tile) => {
      if (tile.properties.slope) {
        realFloorLayer.setTileCollisionCallback(tile.index, this.handleSlope, this);
      }
    });
  }

  update(time, delta) {
    if (!this.felix) return;

    // 每帧开始先假设不在斜坡上，若 handleSlope() 被调用才会置为 true
    this.onSlope = false;

    const speed = 200;
    const jumpVelocity = -400;

    // 左右移动
    if (this.cursors.left.isDown) {
      this.felix.setVelocityX(-speed);
      this.felix.anims.play("move-left", true);
      this.facing = "left";
    } else if (this.cursors.right.isDown) {
      this.felix.setVelocityX(speed);
      this.felix.anims.play("move-right", true);
      this.facing = "right";
    } else {
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
    if (this.cursors.up.isDown && this.felix.body.blocked.down) {
      this.felix.setVelocityY(jumpVelocity);
      if (this.facing === "right") {
        this.felix.anims.play("jump-right", true);
      } else {
        this.felix.anims.play("jump-left", true);
      }
    }

    // 如果本帧没有检测到斜坡，就恢复正常重力
    if (!this.onSlope) {
      this.felix.body.allowGravity = true;
    }
  }

  /**
   * 斜坡碰撞处理：假设斜坡是左低右高的 45°。
   * 如果玩家踩在斜坡上且没按上跳，则贴合到斜坡表面并关闭重力。
   * 如果按了上键则执行跳跃。
   */
  handleSlope(sprite, tile) {
    // 标记本帧踩在斜坡上
    this.onSlope = true;

    // 计算角色在当前砖块内的水平相对位置
    const relativeX = sprite.x - tile.pixelX;

    // 根据 45° 斜坡公式：relativeX 越大，地面越高
    // 当 relativeX=0 时，地面在 tile.pixelY+tile.width (斜坡最左下)
    // 当 relativeX=tile.width 时，地面在 tile.pixelY (斜坡右上)
    const slopeGroundY = tile.pixelY + tile.width - relativeX;

    // 如果角色底部低于斜坡表面，就贴合
    const spriteBottom = sprite.y + sprite.displayHeight / 2; // 注意使用 displayHeight
    if (spriteBottom > slopeGroundY) {
      // 如果玩家按下上键，则执行跳跃
      if (this.cursors.up.isDown) {
        sprite.setVelocityY(-400); // 直接给个跳跃速度
      } else {
        // 否则将玩家贴在斜坡上
        sprite.y = slopeGroundY - sprite.displayHeight / 2;
        sprite.body.velocity.y = 0;

        // 关闭重力，使角色不会继续往下掉
        sprite.body.allowGravity = false;
      }
    }
  }
}

window.BossBattle = BossBattle;
