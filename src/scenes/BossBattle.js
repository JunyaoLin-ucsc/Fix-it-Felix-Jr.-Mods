class BossBattle extends Phaser.Scene {
  constructor() {
    super("BossBattle");
  }

  preload() {
    this.load.path = "./assets/";
    // 加载 BossBattle 场景的 JSON 地图
    this.load.tilemapTiledJSON("bossBattleMap", "BossBattle.json");

    // 加载两张 tileset 对应的图像
    this.load.image("morningAdventuresImage", "morning_adventures_tileset_16x16.png");
    this.load.image("layoutHelpImage", "layout_help.png");

    // 加载 FelixGunSpritesheet.png
    this.load.spritesheet("FelixGun", "FelixGunSpritesheet.png", {
      frameWidth: 641,
      frameHeight: 608
    });

    // ----------------- 加载 Bullet 的 spritesheet -----------------
    // 假设 Bullet-Sheet.png 的每帧尺寸为 32x32（请根据实际情况调整）
    this.load.spritesheet("bullet", "Bullet-Sheet.png", { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    const map = this.make.tilemap({ key: "bossBattleMap" });
    const morningTileset = map.addTilesetImage("morning_adventures_tileset_16x16", "morningAdventuresImage");
    const layoutTileset = map.addTilesetImage("layout_help", "layoutHelpImage");

    // 创建图层：Background、Floor、Real Floor
    const backgroundLayer = map.createLayer("Background", [morningTileset, layoutTileset], 0, 0).setDepth(0);
    const floorLayer = map.createLayer("Floor", [morningTileset, layoutTileset], 0, 0).setDepth(1);
    const realFloorLayer = map.createLayer("Real Floor", [morningTileset, layoutTileset], 0, 0).setDepth(2);

    // 启用带有 collides 属性的砖块的物理碰撞
    floorLayer.setCollisionByProperty({ collides: true });
    realFloorLayer.setCollisionByProperty({ collides: true });

    // 从对象层 "FelixSpawns" 中读取生成点
    const spawnLayer = map.getObjectLayer("FelixSpawns");
    let spawnX = 100, spawnY = 100;
    if (spawnLayer && spawnLayer.objects.length > 0) {
      const spawnObj = spawnLayer.objects[0];
      spawnX = spawnObj.x + (spawnObj.width || 0) / 2;
      spawnY = spawnObj.y + (spawnObj.height || 0) / 2;
    }

    // 创建 Felix（使用 FelixGun spritesheet）
    this.felix = this.physics.add.sprite(spawnX, spawnY, "FelixGun", 0);
    this.felix.setScale(0.20);
    this.felix.setCollideWorldBounds(true);

    // 让 Felix 与地面碰撞
    this.physics.add.collider(this.felix, floorLayer);
    this.physics.add.collider(this.felix, realFloorLayer);

    // 设置重力和物理世界边界
    this.physics.world.gravity.y = 800;
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 让摄像机跟随 Felix
    this.cameras.main.startFollow(this.felix, false, 0.1, 0.1);

    // 添加标题文本
    this.add.text(
      map.widthInPixels / 2,
      50,
      "Boss Battle",
      { fontSize: "48px", fill: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);

    // 创建返回主菜单的按钮
    const returnBtn = this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels - 100,
      "Victory! Return to Main Menu",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x: 10, y: 5 } }
    ).setOrigin(0.5).setInteractive();
    returnBtn.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });

    // 定义动画：idle、move 和 jump 状态（左右区分）
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
      frames: this.anims.generateFrameNumbers("FelixGun", { start: 2, end: 5 }),
      frameRate: 18,
      repeat: -1
    });
    this.anims.create({
      key: "move-left",
      frames: this.anims.generateFrameNumbers("FelixGun", { start: 6, end: 9 }),
      frameRate: 18,
      repeat: -1
    });
    this.anims.create({
      key: "jump-right",
      frames: [{ key: "FelixGun", frame: 10 }],
      frameRate: 1
    });
    this.anims.create({
      key: "jump-left",
      frames: [{ key: "FelixGun", frame: 11 }],
      frameRate: 1
    });

    // 记录角色最后的面向（初始向右）
    this.facing = "right";
    // 创建键盘光标键
    this.cursors = this.input.keyboard.createCursorKeys();

    // ========== 可变跳跃逻辑 ==========
    // 标记是否正在跳跃
    this.isJumping = false;
    // 跳跃初速度（长跳时的力度）
    this.jumpVelocity = -600;
    // 若松开上键，则把垂直速度限制到此值，以形成小跳
    this.shortJumpVelocity = -250;

    // ----------------- 子弹发射相关逻辑 -----------------
    // 创建子弹物理组
    this.bullets = this.physics.add.group();

    // 定义枪口偏移量：Felix 持枪时枪口相对于 Felix 中心的偏移（不随动画改变，但会因跳跃高度改变）
    this.muzzleOffset = {
      right: { x: 100, y: 50 },
      left: { x: -100, y: 50 }
    };

    // 记录是否在射击
    this.shooting = false;

    // 鼠标左键按下时开始射击
    this.input.on("pointerdown", (pointer) => {
      if (pointer.leftButtonDown()) {
        this.shooting = true;
      }
    });

    // 鼠标左键松开时停止射击
    this.input.on("pointerup", () => {
      this.shooting = false;
    });

    // 设置一个定时器，每 200 毫秒检查一次射击状态并发射子弹
    this.shootTimer = this.time.addEvent({
      delay: 200,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true
    });
    // ----------------- 子弹发射逻辑结束 -----------------

    // ----------------- BossBattle 其它逻辑保持不变 -----------------
  }

  update(time, delta) {
    if (!this.felix) return;

    const speed = 200;

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
      this.felix.setVelocityX(0);
      if (this.facing === "right") {
        this.felix.anims.play("idle-right", true);
      } else {
        this.felix.anims.play("idle-left", true);
      }
    }

    // 如果脚下着地，允许再次跳跃
    if (this.felix.body.blocked.down) {
      this.isJumping = false;
    }

    // 按下上键且脚下着地时跳跃
    if (this.cursors.up.isDown && this.felix.body.blocked.down) {
      this.felix.setVelocityY(this.jumpVelocity);
      this.isJumping = true;
      if (this.facing === "right") {
        this.felix.anims.play("jump-right", true);
      } else {
        this.felix.anims.play("jump-left", true);
      }
    }

    // 若正在跳跃且松开上键时截断跳跃，形成短跳效果
    if (this.isJumping && !this.cursors.up.isDown && this.felix.body.velocity.y < 0) {
      if (this.felix.body.velocity.y < this.shortJumpVelocity) {
        this.felix.setVelocityY(this.shortJumpVelocity);
      }
      this.isJumping = false;
    }

    // 清理超出屏幕范围的子弹
    this.bullets.children.each((bullet) => {
      if (bullet.x > this.cameras.main.width + 50 || bullet.x < -50) {
        bullet.destroy();
      }
    });
  }

  // fireBullet()：根据 Felix 当前的枪口位置发射子弹
  fireBullet() {
    if (!this.shooting) return;

    // 根据当前朝向确定枪口偏移
    let offset = (this.facing === "right") ? this.muzzleOffset.right : this.muzzleOffset.left;
    // 子弹生成位置 = Felix 当前坐标 + 偏移，再向上偏移20像素
    let muzzleX = this.felix.x + offset.x;
    let muzzleY = this.felix.y + offset.y - 20;

    let bullet = this.bullets.create(muzzleX, muzzleY, "bullet");
    // 根据 Felix 朝向决定 bullet 使用的帧：
    // 当面向右时，使用帧0；当面向左时，使用帧1
    bullet.setFrame((this.facing === "right") ? 0 : 1);
    // 缩小子弹0.5倍
    bullet.setScale(0.5);

    // 如果 bullet spritesheet 有动画，也可以播放动画
    if (this.anims.exists("bullet_fly")) {
      bullet.anims.play("bullet_fly");
    }
    bullet.body.allowGravity = false;
    // 根据 Felix 朝向决定子弹发射方向
    bullet.body.velocity.x = (this.facing === "right") ? 500 : -500;

    console.log(`子弹发射位置：(${muzzleX}, ${muzzleY})，朝向：${this.facing}`);
  }
}

window.BossBattle = BossBattle;
