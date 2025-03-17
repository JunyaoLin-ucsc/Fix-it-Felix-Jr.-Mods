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

    // =============== 保留你的三层：Background、Floor、Real Floor ===============
    const backgroundLayer = map.createLayer("Background", [morningTileset, layoutTileset], 0, 0).setDepth(0);
    const floorLayer = map.createLayer("Floor", [morningTileset, layoutTileset], 0, 0).setDepth(1);
    const realFloorLayer = map.createLayer("Real Floor", [morningTileset, layoutTileset], 0, 0).setDepth(2);
    // =========================================================================

    // 启用带有 collides 属性的砖块的物理碰撞
    floorLayer.setCollisionByProperty({ collides: true });
    realFloorLayer.setCollisionByProperty({ collides: true });

    // 从对象层 "FelixSpawns" 中读取 Felix 生成点
    const felixSpawnLayer = map.getObjectLayer("FelixSpawns");
    let felixSpawnX = 100, felixSpawnY = 100;
    if (felixSpawnLayer && felixSpawnLayer.objects.length > 0) {
      const spawnObj = felixSpawnLayer.objects[0];
      felixSpawnX = spawnObj.x + (spawnObj.width || 0) / 2;
      felixSpawnY = spawnObj.y + (spawnObj.height || 0) / 2;
    }

    // 创建 Felix（使用 FelixGun spritesheet）
    this.felix = this.physics.add.sprite(felixSpawnX, felixSpawnY, "FelixGun", 0);
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

    // ★【已有】Laser 动画定义
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
    this.shooting = false;
    this.input.on("pointerdown", (pointer) => {
      if (pointer.leftButtonDown()) {
        this.shooting = true;
        this.fireBullet();
      }
    });
    this.input.on("pointerup", () => {
      this.shooting = false;
    });
    this.shootTimer = this.time.addEvent({
      delay: 200,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true
    });

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

    // ★【创建 Angry Ralph（他的出生点来源于 "RalphSpawns"）】
    this.createAngryRalph(map);

    // ★【让 AngryRalph 与 floorLayer 碰撞】
    // 这里面主要监听 crashDown 状态碰到地面后，播放捶地动画并回到 idle
    this.physics.add.collider(this.angryRalph, floorLayer, () => {
      if (this.angryRalphState === "crashDown") {
        // 落地：先停止
        this.angryRalph.setVelocity(0, 0);
        this.angryRalph.body.allowGravity = false;
        // 播放捶地动画 (7,8,9,10) 并造成伤害
        this.angryRalph.play("angryralph_crash_down");
        // 如果需要对 Felix 造成伤害，你可以在这里判断距离/碰撞
        // this.dealDamageToFelix(); // 伪代码

        // 等捶地动画播完后，再回归 idle 并继续后续流程
        this.time.delayedCall(800, () => {
          // d(7~10)动画大约有 4 帧 * frameRate 10 = 400ms 左右，给它 800ms 播放完
          if (!this.angryRalph) return;
          this.angryRalph.play("angryralph_idle");
          this.angryRalphState = "postCrash"; 
          // 在 postCrash 状态下，会接着发激光
        });
      }
    });
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

    // Felix 跳跃检测
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

    // 如果 Ralph 掉出地图，则重置
    if (this.angryRalph.y > this.physics.world.bounds.height + 100) {
      this.resetRalph();
    }

    // ★【更新】Ralph 的 AI 逻辑
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

  // ★【创建】Ralph 的初始化：使用 "RalphSpawns" 作为出生点
  createAngryRalph(map) {
    // ========== 按你所说的帧定义 ==========
    // 0：出生idle
    this.anims.create({
      key: "angryralph_idle",
      frames: [{ key: "AngryRalph", frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    // 1,2：向右走
    this.anims.create({
      key: "angryralph_move_right",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 1, end: 2 }),
      frameRate: 5,
      repeat: -1
    });
    // 3：向右脸发射激光
    this.anims.create({
      key: "angryralph_fire_right",
      frames: [{ key: "AngryRalph", frame: 3 }],
      frameRate: 5,
      repeat: 0
    });
    // 4：向左脸发射激光
    this.anims.create({
      key: "angryralph_fire_left",
      frames: [{ key: "AngryRalph", frame: 4 }],
      frameRate: 5,
      repeat: 0
    });
    // 5,6：跳到 Felix 上方
    this.anims.create({
      key: "angryralph_jump_up",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 5, end: 6 }),
      frameRate: 5,
      repeat: 0
    });
    // 7,8,9,10：捶地攻击
    this.anims.create({
      key: "angryralph_crash_down",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 7, end: 10 }),
      frameRate: 10,
      repeat: 0
    });
    // 11,12：向左走
    this.anims.create({
      key: "angryralph_move_left",
      frames: this.anims.generateFrameNumbers("AngryRalph", { start: 11, end: 12 }),
      frameRate: 5,
      repeat: -1
    });
    // （13,14,15：被打败 —— 不添加）
    // 16：手持激光炮向右发射
    this.anims.create({
      key: "angryralph_fire_weapon_right",
      frames: [{ key: "AngryRalph", frame: 16 }],
      frameRate: 5,
      repeat: 0
    });
    // 17：手持激光炮向左发射
    this.anims.create({
      key: "angryralph_fire_weapon_left",
      frames: [{ key: "AngryRalph", frame: 17 }],
      frameRate: 5,
      repeat: 0
    });

    // 读取 "RalphSpawns" 对象层
    let ralphSpawnX, ralphSpawnY;
    const ralphSpawnLayer = map.getObjectLayer("RalphSpawns");
    if (ralphSpawnLayer && ralphSpawnLayer.objects.length > 0) {
      const obj = ralphSpawnLayer.objects[0];
      ralphSpawnX = obj.x + (obj.width || 0) / 2;
      ralphSpawnY = obj.y + (obj.height || 0) / 2;
    } else {
      console.warn("RalphSpawns layer not found! Using default spawn.");
      ralphSpawnX = 400;
      ralphSpawnY = 100;
    }

    // 在该位置创建 Ralph，并放大2倍
    this.angryRalph = this.physics.add.sprite(ralphSpawnX, ralphSpawnY, "AngryRalph", 0)
      .setDepth(5)
      .setScale(2);

    // 默认不受重力影响；在 crashDown 状态下启用重力
    this.angryRalph.body.allowGravity = false;
    // 保持原先的碰撞体积
    this.angryRalph.setBodySize(100, 120);

    // 初始播放 idle 动画
    this.angryRalph.play("angryralph_idle");

    // 读取 "RalphEdges" 对象层，限定移动区域
    this.angryRalphEdges = { left: 100, right: 600 };
    const edgesLayer = map.getObjectLayer("RalphEdges");
    if (edgesLayer && edgesLayer.objects.length >= 2) {
      const edgeA = edgesLayer.objects[0];
      const edgeB = edgesLayer.objects[1];
      const xA = edgeA.x + (edgeA.width || 0) / 2;
      const xB = edgeB.x + (edgeB.width || 0) / 2;
      this.angryRalphEdges.left = Math.min(xA, xB);
      this.angryRalphEdges.right = Math.max(xA, xB);
    }

    // 保存 Ralph 出生点，便于重置
    this.angryRalphSpawn = { x: ralphSpawnX, y: ralphSpawnY };

    // 初始化一些状态
    this.angryRalphSpeed = 100;
    this.angryRalphState = "idle"; // idle, move, jumpUp, crashDown, postCrash, laser, etc.

    // 【核心改动】一开始先启动一次随机移动
    this.startRandomMovement();
  }

  // ★【重置】若 Ralph 掉出地图，则将其重置到出生点并设 idle
  resetRalph() {
    this.angryRalph.setVelocity(0, 0);
    this.angryRalph.body.allowGravity = false;
    this.angryRalph.x = this.angryRalphSpawn.x;
    this.angryRalph.y = this.angryRalphSpawn.y;
    this.angryRalph.play("angryralph_idle");
    this.angryRalphState = "idle";
    // 再次开始随机移动
    this.startRandomMovement();
  }

  // =========================
  // 【核心改动】Ralph 攻击流程
  // =========================

  // 开始随机移动
  startRandomMovement() {
    // 如果 Ralph 不存在或已经在攻击，就不执行
    if (!this.angryRalph || this.angryRalphState !== "idle") return;

    this.angryRalphState = "move";

    // 随机选择左/右移动 或 干脆 idle
    const moveChoices = ["left", "right", "idle"];
    const choice = Phaser.Utils.Array.GetRandom(moveChoices);

    if (choice === "left") {
      this.angryRalph.setVelocityX(-this.angryRalphSpeed);
      this.angryRalph.play("angryralph_move_left", true);
    } else if (choice === "right") {
      this.angryRalph.setVelocityX(this.angryRalphSpeed);
      this.angryRalph.play("angryralph_move_right", true);
    } else {
      // idle
      this.angryRalph.setVelocityX(0);
      this.angryRalph.play("angryralph_idle", true);
    }

    // 随机移动 1~3 秒后，开始攻击流程
    const delay = Phaser.Math.Between(1000, 3000);
    this.time.delayedCall(delay, () => {
      if (!this.angryRalph) return;
      // 停止移动
      this.angryRalph.setVelocityX(0);
      this.angryRalph.play("angryralph_idle");
      this.angryRalphState = "idle";
      // 开始攻击流程
      this.startAttackSequence();
    });
  }

  // 攻击流程：跳到 Felix 头顶 → 等待2~3秒 → 下落砸地 → 捶地动画 → 选一个激光方式 → 发射 → 回到随机移动
  startAttackSequence() {
    if (!this.angryRalph) return;
    // 先设置 jumpUp 状态
    this.angryRalphState = "jumpUp";
    // 播放 jumpUp 动画
    this.angryRalph.play("angryralph_jump_up", true);

    // 直接把 Ralph 移到 Felix 上方
    this.angryRalph.x = this.felix.x;
    this.angryRalph.y = this.felix.y - 200;

    // 等待 2~3 秒
    const waitTime = Phaser.Math.Between(2000, 3000);
    this.time.delayedCall(waitTime, () => {
      // 切换到 crashDown，让 Ralph 下落砸地
      if (!this.angryRalph) return;
      this.angryRalphState = "crashDown";
      this.angryRalph.body.allowGravity = true;
      this.angryRalph.setVelocityY(700);
      // 真正的捶地动画播放在地面碰撞回调里
    });
  }

  // 当捶地动画播放完 -> 进入 postCrash 状态，然后发射激光
  performLaserAttack() {
    if (!this.angryRalph) return;
    this.angryRalphState = "laser";

    // 随机选择“脸发射激光”(frame 3,4) 或 “手持激光炮激光”(frame 16,17)
    const laserType = Phaser.Math.Between(1, 2); 
    // 1 = face-laser, 2 = weapon-laser

    // 判断朝向：若 Felix 在右边就朝右，否则朝左
    let direction = (this.felix.x >= this.angryRalph.x) ? "right" : "left";

    // 先播放动画，再创建 Laser sprite
    if (laserType === 1) {
      // 脸发射激光
      if (direction === "right") {
        this.angryRalph.play("angryralph_fire_right", true);
      } else {
        this.angryRalph.play("angryralph_fire_left", true);
      }
    } else {
      // 手持激光炮
      if (direction === "right") {
        this.angryRalph.play("angryralph_fire_weapon_right", true);
      } else {
        this.angryRalph.play("angryralph_fire_weapon_left", true);
      }
    }

    // 创建激光对象
    let laserX = (direction === "right") ? this.angryRalph.x + 550 : this.angryRalph.x - 550;
    let laserY = this.angryRalph.y + 50;
    const laser = this.physics.add.sprite(laserX, laserY, "Laser");
    laser.setScale(0.3);
    laser.body.allowGravity = false;
    // 保持你的 hitbox & offset
    laser.body.setSize(2560, 200).setOffset(0, 300);

    // 播放激光动画
    if (direction === "right") {
      laser.play("laser_fire_right");
    } else {
      laser.play("laser_fire_left");
    }
    
    // 如果需要伤害 Felix，可做 overlap 检测
    // this.physics.add.overlap(laser, this.felix, this.damageFelix, null, this);

    // 1 秒后激光消失，回到 idle
    this.time.delayedCall(1000, () => {
      laser.destroy();
      if (!this.angryRalph) return;
      this.angryRalph.play("angryralph_idle");
      this.angryRalphState = "idle";

      // 攻击完了，再进入下一轮移动
      this.startRandomMovement();
    });
  }

  // ★【更新】Ralph 的 AI 逻辑（仅做状态判断和边界检查）
  updateAngryRalph(time, delta) {
    if (!this.angryRalph) return;

    // 边界检查
    if (this.angryRalph.x < this.angryRalphEdges.left) {
      this.angryRalph.x = this.angryRalphEdges.left;
    } else if (this.angryRalph.x > this.angryRalphEdges.right) {
      this.angryRalph.x = this.angryRalphEdges.right;
    }

    // 如果已经处在 crashDown 状态，在地面碰撞事件里会继续
    // 如果刚刚捶地动画结束，会进入 postCrash 状态
    if (this.angryRalphState === "postCrash") {
      // 捶地完了，就发射激光
      this.performLaserAttack();
    }
    // 其余状态逻辑（idle, move, jumpUp, laser） 已经在定时器里处理了
    // 所以这里不再做任何随机 AI
  }
}

window.BossBattle = BossBattle;
