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
    this.load.spritesheet("bullet", "Bullet-Sheet.png", { frameWidth: 32, frameHeight: 32 });

    // ----------------- 加载鸟的 spritesheet -----------------
    this.load.spritesheet("bird1", "bird1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("bird1-flip", "bird1-flip.png", { frameWidth: 64, frameHeight: 64 });

    // ----------------- 加载云的图片 -----------------
    this.load.image("cloud", "cloud.png");
    this.load.image("cloud2", "cloud2.png");

    // ★【已有】加载 AngryRalphSpritesheet.png
    this.load.spritesheet("AngryRalph", "AngryRalphSpritesheet.png", {
      frameWidth: 192,
      frameHeight: 176
    });

    // ★【新增】加载 Laser-Sheet.png
    this.load.spritesheet("Laser", "Laser-Sheet.png", {
      frameWidth: 2560,
      frameHeight: 832
    });
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
    this.felix.setScale(0.15);
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

    // 定义 Felix 的动画
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

    // ★【新增】Laser 动画定义
    // Laser（右向）: 帧0→1→2→3→回到0（可根据需求调整 repeat）
    this.anims.create({
      key: "laser_fire_right",
      frames: [
        { key: "Laser", frame: 0 },
        { key: "Laser", frame: 1 },
        { key: "Laser", frame: 2 },
        { key: "Laser", frame: 3 },
        { key: "Laser", frame: 0 }
      ],
      frameRate: 10,
      repeat: -1
    });
    // Laser（左向）: 帧4→5→6→7→回到4
    this.anims.create({
      key: "laser_fire_left",
      frames: [
        { key: "Laser", frame: 4 },
        { key: "Laser", frame: 5 },
        { key: "Laser", frame: 6 },
        { key: "Laser", frame: 7 },
        { key: "Laser", frame: 4 }
      ],
      frameRate: 10,
      repeat: -1
    });

    // 记录 Felix 最后面向（初始向右）
    this.facing = "right";
    // 创建键盘光标键
    this.cursors = this.input.keyboard.createCursorKeys();

    // ========== 可变跳跃逻辑 ==========
    this.isJumping = false;
    this.jumpVelocity = -600;
    this.shortJumpVelocity = -250;

    // ----------------- 子弹发射相关逻辑 -----------------
    this.bullets = this.physics.add.group();
    this.muzzleOffset = {
      right: { x: 53, y: 15 },
      left: { x: -53, y: 15 }
    };

    // ① 是否在射击
    this.shooting = false;

    // ② 监听鼠标按下：单击瞬间发射一颗子弹，并设定 shooting 状态
    this.input.on("pointerdown", (pointer) => {
      if (pointer.leftButtonDown()) {
        this.shooting = true;
        this.fireBullet();
      }
    });

    // ③ 监听鼠标松开：停止射击
    this.input.on("pointerup", () => {
      this.shooting = false;
    });

    // ④ 每隔200毫秒检测 shooting，如果为 true 则连续发射子弹
    this.shootTimer = this.time.addEvent({
      delay: 200,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true
    });
    // ----------------- 子弹发射逻辑结束 -----------------

    // ----------------- 鸟/云相关的初始化 -----------------
    this.birdGroup = this.physics.add.group();
    if (!this.anims.exists("bird1_fly")) {
      this.anims.create({
        key: "bird1_fly",
        frames: this.anims.generateFrameNumbers("bird1", { start: 0, end: 1 }),
        frameRate: 5,
        repeat: -1
      });
    }
    if (!this.anims.exists("bird1flip_fly")) {
      this.anims.create({
        key: "bird1flip_fly",
        frames: this.anims.generateFrameNumbers("bird1-flip", { start: 0, end: 1 }),
        frameRate: 5,
        repeat: -1
      });
    }
    this.time.addEvent({
      delay: 3000,
      callback: this.spawnBird,
      callbackScope: this,
      loop: true
    });
    this.cloudGroup = this.add.group();
    this.time.addEvent({
      delay: 5000,
      callback: this.spawnCloud,
      callbackScope: this,
      loop: true
    });

    // ★【新增】创建 Angry Ralph
    this.createAngryRalph(map);
  }

  update(time, delta) {
    if (!this.felix) return;

    const speed = 200;

    // Felix 左右移动
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

    // 跳跃检测
    if (this.felix.body.blocked.down) {
      this.isJumping = false;
    }
    if (this.cursors.up.isDown && this.felix.body.blocked.down) {
      this.felix.setVelocityY(this.jumpVelocity);
      this.isJumping = true;
      if (this.facing === "right") {
        this.felix.anims.play("jump-right", true);
      } else {
        this.felix.anims.play("jump-left", true);
      }
    }
    if (this.isJumping && !this.cursors.up.isDown && this.felix.body.velocity.y < 0) {
      if (this.felix.body.velocity.y < this.shortJumpVelocity) {
        this.felix.setVelocityY(this.shortJumpVelocity);
      }
      this.isJumping = false;
    }

    // 清理超出视口范围的子弹
    this.bullets.children.each((bullet) => {
      const cam = this.cameras.main;
      if (bullet.x > cam.scrollX + cam.width + 50 || bullet.x < cam.scrollX - 50) {
        bullet.destroy();
      }
    });

    // 清理超出视口范围的鸟
    this.birdGroup.children.each((bird) => {
      const cam = this.cameras.main;
      if (bird.x > cam.scrollX + cam.width + 100 || bird.x < cam.scrollX - 100) {
        bird.destroy();
      }
    });

    // 清理超出视口范围的云
    this.cloudGroup.children.each((cloud) => {
      const cam = this.cameras.main;
      if (cloud.x > cam.scrollX + cam.width + 150 || cloud.x < cam.scrollX - 150) {
        cloud.destroy();
      }
    });

    // ★【新增】每帧更新 Angry Ralph 的移动逻辑
    this.updateAngryRalph(time, delta);
  }

  // 子弹发射逻辑
  fireBullet() {
    if (!this.shooting) return;

    const offset = (this.facing === "right") ? this.muzzleOffset.right : this.muzzleOffset.left;
    const muzzleX = this.felix.x + offset.x;
    const muzzleY = this.felix.y + offset.y;

    const bullet = this.bullets.create(muzzleX, muzzleY, "bullet");
    bullet.setFrame((this.facing === "right") ? 0 : 1);
    bullet.setScale(0.5);

    if (this.anims.exists("bullet_fly")) {
      bullet.anims.play("bullet_fly");
    }
    bullet.body.allowGravity = false;
    bullet.body.velocity.x = (this.facing === "right") ? 500 : -500;
  }

  spawnBird() {
    const cam = this.cameras.main;
    const birdY = Phaser.Math.Between(cam.scrollY + 80, cam.scrollY + 300);
    const chance = Phaser.Math.Between(1, 100);
    if (chance <= 50) {
      const type = Phaser.Math.RND.pick(["bird1", "bird1-flip"]);
      if (type === "bird1") {
        let bird = this.birdGroup.create(cam.scrollX - 64, birdY, "bird1", 0);
        bird.body.allowGravity = false;
        bird.body.velocity.x = 150;
        bird.anims.play("bird1_fly");
      } else {
        let bird = this.birdGroup.create(cam.scrollX + cam.width + 64, birdY, "bird1-flip", 0);
        bird.body.allowGravity = false;
        bird.body.velocity.x = -150;
        bird.anims.play("bird1flip_fly");
      }
    } else {
      let birdLeft = this.birdGroup.create(cam.scrollX - 64, birdY, "bird1", 0);
      birdLeft.body.allowGravity = false;
      birdLeft.body.velocity.x = 150;
      birdLeft.anims.play("bird1_fly");

      let birdRight = this.birdGroup.create(cam.scrollX + cam.width + 64, birdY, "bird1-flip", 0);
      birdRight.body.allowGravity = false;
      birdRight.body.velocity.x = -150;
      birdRight.anims.play("bird1flip_fly");
    }
  }

  spawnCloud() {
    const cam = this.cameras.main;
    const cloudType = Phaser.Math.RND.pick(["cloud", "cloud2"]);
    const cloudY = Phaser.Math.Between(cam.scrollY + 20, cam.scrollY + 150);
    const startSide = Phaser.Math.Between(0, 1);
    let cloud;
    if (startSide === 0) {
      cloud = this.cloudGroup.create(cam.scrollX - 100, cloudY, cloudType);
      cloud.setScale(3);
      this.tweens.add({
        targets: cloud,
        x: cam.scrollX + cam.width + 100,
        duration: 30000,
        ease: "Linear",
        onComplete: () => { cloud.destroy(); }
      });
    } else {
      cloud = this.cloudGroup.create(cam.scrollX + cam.width + 100, cloudY, cloudType);
      cloud.setScale(3);
      this.tweens.add({
        targets: cloud,
        x: cam.scrollX - 100,
        duration: 30000,
        ease: "Linear",
        onComplete: () => { cloud.destroy(); }
      });
    }
    cloud.setDepth(1000);
  }

  // ★【新增】创建 Angry Ralph（包括新动画定义）
  createAngryRalph(map) {
    // 原有动画定义
    this.anims.create({
      key: "angryralph_idle",
      frames: [{ key: "AngryRalph", frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: "angryralph_move_right",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 1, end: 2 }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "angryralph_move_left",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 9, end: 10 }),
      frameRate: 5,
      repeat: -1
    });

    // ★【新增】AngryRalph 其他动画定义
    // 帧3：面向右边发射激光
    this.anims.create({
      key: "angryralph_fire_right",
      frames: [{ key: "AngryRalph", frame: 3 }],
      frameRate: 5,
      repeat: 0
    });
    // 帧4：面向左边发射激光
    this.anims.create({
      key: "angryralph_fire_left",
      frames: [{ key: "AngryRalph", frame: 4 }],
      frameRate: 5,
      repeat: 0
    });
    // 帧5,6：跳起来移动到当前 Felix 位置上方
    this.anims.create({
      key: "angryralph_jump_up",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 5, end: 6 }),
      frameRate: 5,
      repeat: 0
    });
    // 帧7,8,9,10：空中快速向下砸去（仅触发一次，且只循环一次）
    this.anims.create({
      key: "angryralph_crash_down",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 7, end: 10 }),
      frameRate: 10,
      repeat: 0
    });
    // 帧11,12：向左移动的动画（循环播放）
    this.anims.create({
      key: "angryralph_move_left2",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 11, end: 12 }),
      frameRate: 5,
      repeat: -1
    });
    // 帧13,14,15：被打败的动画（只播放一次）
    this.anims.create({
      key: "angryralph_defeated",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 13, end: 15 }),
      frameRate: 5,
      repeat: 0
    });
    // 帧16,17：手持武器发射激光状态
    this.anims.create({
      key: "angryralph_fire_weapon",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 16, end: 17 }),
      frameRate: 5,
      repeat: 0
    });

    // 从对象层 "RalphSpawns" 中读取坐标
    let ralphSpawnX = 400, ralphSpawnY = 100;
    let ralphSpawnLayer = map.getObjectLayer("RalphSpawns");
    if (ralphSpawnLayer && ralphSpawnLayer.objects.length > 0) {
      let obj = ralphSpawnLayer.objects[0];
      ralphSpawnX = obj.x + (obj.width || 0) / 2;
      ralphSpawnY = obj.y + (obj.height || 0) / 2;
    }

    // 在该位置创建 AngryRalph
    this.angryRalph = this.physics.add.sprite(ralphSpawnX, ralphSpawnY, "AngryRalph", 0)
      .setDepth(5)
      .setScale(1); // 可根据需求放大缩小

    // 禁用重力，防止掉出地图
    this.angryRalph.body.allowGravity = false;

    // 初始播放 idle 动画
    this.angryRalph.play("angryralph_idle");

    // 读取 "RalphEdges" 对象层（假设有2个对象分别表示左右边界）
    this.angryRalphEdges = { left: 100, right: 600 }; // 默认值
    let edgesLayer = map.getObjectLayer("RalphEdges");
    if (edgesLayer && edgesLayer.objects.length >= 2) {
      let edgeA = edgesLayer.objects[0];
      let edgeB = edgesLayer.objects[1];
      let xA = edgeA.x + (edgeA.width || 0) / 2;
      let xB = edgeB.x + (edgeB.width || 0) / 2;
      this.angryRalphEdges.left = Math.min(xA, xB);
      this.angryRalphEdges.right = Math.max(xA, xB);
    }

    // 设置速度和 AI 状态
    this.angryRalphSpeed = 100; // 移动速度
    this.angryRalphNextDecisionTime = 0;
    this.angryRalphState = "idle";

    // ★【可选】当 AngryRalph 碰到 Floor 时触发 crash_down 动作（注意：需确保 floorLayer 已添加到物理系统中）
    this.physics.add.collider(this.angryRalph, map.getLayer("Floor").tilemapLayer, () => {
      if (!this.angryRalph.body.blocked.down) {
        this.angryRalph.play("angryralph_crash_down", true);
      }
    });
  }

  // ★【新增】每帧更新 AngryRalph 的移动/状态逻辑
  updateAngryRalph(time, delta) {
    if (!this.angryRalph) return;

    // 如果达到左右边界，强制停下并播放 idle 动作
    if (this.angryRalph.x <= this.angryRalphEdges.left) {
      this.angryRalph.x = this.angryRalphEdges.left;
      this.angryRalph.setVelocityX(0);
      this.angryRalph.play("angryralph_idle", true);
      this.angryRalphState = "idle";
    } else if (this.angryRalph.x >= this.angryRalphEdges.right) {
      this.angryRalph.x = this.angryRalphEdges.right;
      this.angryRalph.setVelocityX(0);
      this.angryRalph.play("angryralph_idle", true);
      this.angryRalphState = "idle";
    }

    // 每隔一段随机时间重新决定状态
    if (time > this.angryRalphNextDecisionTime) {
      let states = ["idle", "moveLeft", "moveRight"];
      let chosen = Phaser.Utils.Array.GetRandom(states);

      switch (chosen) {
        case "idle":
          this.angryRalph.setVelocityX(0);
          this.angryRalph.play("angryralph_idle", true);
          break;
        case "moveLeft":
          this.angryRalph.setVelocityX(-this.angryRalphSpeed);
          // 可选择使用 "angryralph_move_left" 或 "angryralph_move_left2"
          this.angryRalph.play("angryralph_move_left", true);
          break;
        case "moveRight":
          this.angryRalph.setVelocityX(this.angryRalphSpeed);
          this.angryRalph.play("angryralph_move_right", true);
          break;
      }
      this.angryRalphState = chosen;

      // 下次随机 1~3 秒之后再重新决策
      let delay = Phaser.Math.Between(1000, 3000);
      this.angryRalphNextDecisionTime = time + delay;
    }
  }
}

window.BossBattle = BossBattle;
