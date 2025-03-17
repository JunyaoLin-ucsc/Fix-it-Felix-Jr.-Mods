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

    // ★【新增】让 Felix 深度 = 10
    this.felix.setDepth(10);

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
    // 当 crashDown 落地时，播放捶地动画（7,8,9,10）
    this.physics.add.collider(this.angryRalph, floorLayer, () => {
      if (this.angryRalphState === "crashDown") {
        this.angryRalph.setVelocity(0, 0);
        this.angryRalph.body.allowGravity = false;
        // 捶地动画
        this.angryRalph.play("angryralph_crash_down");
        // 若需要，对 Felix 造成伤害
        // this.dealDamageToFelix();

        // 捶地动画播完后 => postCrash 状态
        this.time.delayedCall(800, () => {
          if (!this.angryRalph) return;
          this.angryRalph.play("angryralph_idle");
          this.angryRalphState = "postCrash";
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

    // ★【更新】Ralph 的 AI
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
    // 3：向右“脸”发射激光
    this.anims.create({
      key: "angryralph_fire_right",
      frames: [{ key: "AngryRalph", frame: 3 }],
      frameRate: 5,
      repeat: 0
    });
    // 4：向左“脸”发射激光
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
      .setScale(2);

    // ★【Ralph 深度 = 5】
    this.angryRalph.setDepth(5);

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

    this.angryRalphSpeed = 100;
    this.angryRalphState = "idle";

    // 一开始，先随机移动
    this.startRandomMovement();
  }

  // ★【重置】
  resetRalph() {
    this.angryRalph.setVelocity(0, 0);
    this.angryRalph.body.allowGravity = false;
    this.angryRalph.x = this.angryRalphSpawn.x;
    this.angryRalph.y = this.angryRalphSpawn.y;
    this.angryRalph.play("angryralph_idle");
    this.angryRalphState = "idle";
    this.startRandomMovement();
  }

  // =========================
  // Ralph 攻击流程
  // =========================

  // 开始随机移动
  startRandomMovement() {
    if (!this.angryRalph || this.angryRalphState !== "idle") return;

    this.angryRalphState = "move";
    const moveChoices = ["left", "right", "idle"];
    const choice = Phaser.Utils.Array.GetRandom(moveChoices);

    if (choice === "left") {
      this.angryRalph.setVelocityX(-this.angryRalphSpeed);
      this.angryRalph.play("angryralph_move_left", true);
    } else if (choice === "right") {
      this.angryRalph.setVelocityX(this.angryRalphSpeed);
      this.angryRalph.play("angryralph_move_right", true);
    } else {
      this.angryRalph.setVelocityX(0);
      this.angryRalph.play("angryralph_idle", true);
    }

    // 移动1~3秒后，开始跳跃攻击
    const delay = Phaser.Math.Between(1000, 3000);
    this.time.delayedCall(delay, () => {
      if (!this.angryRalph) return;
      this.angryRalph.setVelocityX(0);
      this.angryRalph.play("angryralph_idle");
      this.angryRalphState = "idle";
      this.startAttackSequence();
    });
  }

  // 攻击流程：跳到 Felix 头顶 -> 等2~3秒 -> 下落砸地 -> 捶地 -> 发激光 -> 回到随机移动
  startAttackSequence() {
    if (!this.angryRalph) return;
    this.angryRalphState = "jumpUp";
    this.angryRalph.play("angryralph_jump_up", true);

    // 直接把 Ralph 移到 Felix 上方
    this.angryRalph.x = this.felix.x;
    this.angryRalph.y = this.felix.y - 200;

    // 等 2~3 秒后再坠落
    const waitTime = Phaser.Math.Between(2000, 3000);
    this.time.delayedCall(waitTime, () => {
      if (!this.angryRalph) return;
      this.angryRalphState = "crashDown";
      this.angryRalph.body.allowGravity = true;
      this.angryRalph.setVelocityY(700);
      // 真正的捶地动画在 collider 回调中播放
    });
  }

  // 捶地完 -> postCrash -> 发激光
  performLaserAttack() {
    if (!this.angryRalph) return;
    this.angryRalphState = "laser";

    // 1 = 脸发射激光, 2 = 手持激光炮
    const laserType = Phaser.Math.Between(1, 2);
    // 判断朝向
    let direction = (this.felix.x >= this.angryRalph.x) ? "right" : "left";

    // (A) 准备坐标 & hitbox 的差异
    let laserX, laserY;
    let bodyW, bodyH, offsetX, offsetY;

    if (laserType === 1) {
      // ===========【脸部激光】===========
      if (direction === "right") {
        this.angryRalph.play("angryralph_fire_right", true);
        laserX = this.angryRalph.x + 380;
      } else {
        this.angryRalph.play("angryralph_fire_left", true);
        laserX = this.angryRalph.x - 380;
      }
      laserY = this.angryRalph.y - 70;
      bodyW = 2560; 
      bodyH = 200;
      offsetX = 50; 
      offsetY = 50; 
    } else {
      // ===========【手持激光炮】===========
      if (direction === "right") {
        this.angryRalph.play("angryralph_fire_weapon_right", true);
        laserX = this.angryRalph.x + 550;
      } else {
        this.angryRalph.play("angryralph_fire_weapon_left", true);
        laserX = this.angryRalph.x - 550;
      }
      laserY = this.angryRalph.y + 50;
      bodyW = 2560; 
      bodyH = 200;
      offsetX = 0; 
      offsetY = 300; 
    }

    // (B) 实际创建激光
    const laser = this.physics.add.sprite(laserX, laserY, "Laser");
    laser.setScale(0.3);
    laser.body.allowGravity = false;
    laser.body.setSize(bodyW, bodyH).setOffset(offsetX, offsetY);

    // ★【Laser 深度 = 7】(介于 Ralph(5) 与 Felix(10) 之间)
    laser.setDepth(7);

    // 播放动画
    if (direction === "right") {
      laser.play("laser_fire_right");
    } else {
      laser.play("laser_fire_left");
    }

    // 1秒后消失，并回到 idle
    this.time.delayedCall(1000, () => {
      laser.destroy();
      if (!this.angryRalph) return;
      this.angryRalph.play("angryralph_idle");
      this.angryRalphState = "idle";
      this.startRandomMovement();
    });
  }

  updateAngryRalph(time, delta) {
    if (!this.angryRalph) return;

    // 边界
    if (this.angryRalph.x < this.angryRalphEdges.left) {
      this.angryRalph.x = this.angryRalphEdges.left;
    } else if (this.angryRalph.x > this.angryRalphEdges.right) {
      this.angryRalph.x = this.angryRalphEdges.right;
    }

    // 如果捶地动画播完进入 postCrash，则进行激光攻击
    if (this.angryRalphState === "postCrash") {
      this.performLaserAttack();
    }
  }
}

window.BossBattle = BossBattle;
