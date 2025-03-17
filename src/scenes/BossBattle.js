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

    // ★【新增】Laser 动画定义
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

    // ★【让 Angry Ralph 与 floorLayer 碰撞】
    this.physics.add.collider(this.angryRalph, floorLayer, () => {
      if (this.angryRalphState === "crashDown") {
        this.angryRalph.setVelocity(0, 0);
        // 禁用重力恢复
        this.angryRalph.body.allowGravity = false;
        this.angryRalph.play("angryralph_idle");
        this.angryRalphState = "idle";
        // 如果连招中，进入下一步骤
        if (this.angryRalphComboStep > 0) {
          this.angryRalphComboStep = 3;
        }
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
    // 清理超出视口范围的鸟 —— 删除鸟的 hitbox，避免干扰
    this.birdGroup.children.each((bird) => {
      bird.body.setSize(0, 0);
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
    // 如果正在连招，则进入连招更新逻辑
    if (this.angryRalphComboStep > 0) {
      this.updateRalphCombo();
    } else {
      this.updateAngryRalphNormal(time);
    }
  }

  // 正常状态下的 AI 逻辑（不包含连招）
  updateAngryRalphNormal(time) {
    // 检查水平边界
    if (this.angryRalph.x < this.angryRalphEdges.left) {
      this.angryRalph.x = this.angryRalphEdges.left;
      this.angryRalphState = "moveRight";
    } else if (this.angryRalph.x > this.angryRalphEdges.right) {
      this.angryRalph.x = this.angryRalphEdges.right;
      this.angryRalphState = "moveLeft";
    }

    // 如果处于 jumpUp、crashDown、fireLaser 状态，则不打断
    if (this.angryRalphState === "jumpUp" || this.angryRalphState === "crashDown" || this.angryRalphState === "fireLaser") {
      if (this.angryRalphState === "crashDown") {
        this.angryRalph.body.allowGravity = true;
        this.angryRalph.setVelocityY(700);
        this.angryRalph.play("angryralph_crash_down", true);
      }
      return;
    }

    // 达到决策时间后重新随机状态（只保留 idle/moveLeft/moveRight）
    if (time > this.angryRalphNextDecisionTime) {
      const states = ["idle", "moveLeft", "moveRight"];
      const chosen = Phaser.Utils.Array.GetRandom(states);
      switch (chosen) {
        case "idle":
          this.angryRalph.setVelocityX(0);
          this.angryRalph.play("angryralph_idle", true);
          this.angryRalphState = "idle";
          break;
        case "moveLeft":
          this.angryRalph.setVelocityX(-this.angryRalphSpeed);
          this.angryRalph.play("angryralph_move_left", true);
          this.angryRalphState = "moveLeft";
          break;
        case "moveRight":
          this.angryRalph.setVelocityX(this.angryRalphSpeed);
          this.angryRalph.play("angryralph_move_right", true);
          this.angryRalphState = "moveRight";
          break;
      }
      // 下次决策延时 1~3 秒
      const delay = Phaser.Math.Between(1000, 3000);
      this.angryRalphNextDecisionTime = time + delay;

      // ★【新增】每次决策后有 10% 概率启动连招
      if (Phaser.Math.Between(1, 100) <= 10) {
        this.startRalphCombo();
      }
    }
  }

  // ★【启动】连招：不影响正常移动，连招流程在后续 updateRalphCombo 中执行
  startRalphCombo() {
    // 连招从正常状态开始，不影响出生位置
    this.angryRalphComboStep = 1;
    // 随机决定本轮激光发射次数（1~3次）
    this.angryRalphLasersLeft = Phaser.Math.Between(1, 3);
  }

  // ★【更新】连招流程逻辑
  updateRalphCombo() {
    switch (this.angryRalphComboStep) {
      case 1:
        // Step 1：锁定 Felix，跳到他上方
        this.angryRalph.setVelocity(0, 0);
        this.angryRalph.play("angryralph_jump_up", true);
        this.angryRalph.x = this.felix.x;
        this.angryRalph.y = this.felix.y - 200;
        // 进入 Step 2
        this.angryRalphComboStep = 2;
        break;
      case 2:
        // Step 2：等待落地砸地
        this.angryRalph.setVelocity(0, 0);
        // 进入 crashDown 状态（floor 碰撞回调会把状态设为 idle）
        this.angryRalphState = "crashDown";
        // 当砸地完成后，floor 碰撞回调会将状态转为 idle
        // 此时连招流程继续进入 Step 3
        this.angryRalphComboStep = 3;
        break;
      case 3:
        // Step 3：如果落地后状态已恢复为 idle，则开始连续激光连招
        if (this.angryRalphState === "idle") {
          if (this.angryRalphLasersLeft > 0) {
            // 随机选择：用嘴部或激光炮发射
            let useWeapon = Phaser.Math.Between(0, 1) === 1;
            let faceRight = (this.felix.x >= this.angryRalph.x);
            this.fireRalphLaser(useWeapon, faceRight);
            this.angryRalphLasersLeft--;
          } else {
            // 连招结束，恢复正常
            this.angryRalphComboStep = 0;
          }
        }
        break;
    }
  }

  // ★【连招】Ralph 发射激光函数（嘴部或激光炮，左右随机）
  fireRalphLaser(useWeapon, faceRight) {
    // 发射前先停下
    this.angryRalph.setVelocityX(0);
    this.angryRalphState = "fireLaser";
    // 根据选择播放对应动画：帧16/17（武器）或帧3/4（嘴部）
    let animKey = "";
    if (useWeapon) {
      animKey = faceRight ? "angryralph_fire_weapon_right" : "angryralph_fire_weapon_left";
    } else {
      animKey = faceRight ? "angryralph_fire_right" : "angryralph_fire_left";
    }
    this.angryRalph.play(animKey, true);

    // 创建 Laser 精灵（位置和大小不改你的设置）
    let laserX = faceRight ? (this.angryRalph.x + 80) : (this.angryRalph.x - 80);
    let laser = this.physics.add.sprite(laserX, this.angryRalph.y, "Laser");
    laser.setScale(0.2);
    laser.body.allowGravity = false;
    let laserAnim = faceRight ? "laser_fire_right" : "laser_fire_left";
    laser.play(laserAnim);
    // 1秒后销毁激光，并把状态设为 idle，为下一次激光连招做准备
    this.time.delayedCall(1000, () => {
      laser.destroy();
      this.angryRalphState = "idle";
    }, null, this);
  }

  resetRalph() {
    this.angryRalph.setVelocity(0, 0);
    this.angryRalph.body.allowGravity = false;
    this.angryRalph.x = this.angryRalphSpawn.x;
    this.angryRalph.y = this.angryRalphSpawn.y;
    this.angryRalph.play("angryralph_idle");
    this.angryRalphState = "idle";
    this.angryRalphComboStep = 0;
    this.angryRalphLasersLeft = 0;
  }

  updateAngryRalphNormal(time) {
    // 检查水平边界
    if (this.angryRalph.x < this.angryRalphEdges.left) {
      this.angryRalph.x = this.angryRalphEdges.left;
      this.angryRalphState = "moveRight";
    } else if (this.angryRalph.x > this.angryRalphEdges.right) {
      this.angryRalph.x = this.angryRalphEdges.right;
      this.angryRalphState = "moveLeft";
    }

    // 如果处于 jumpUp、crashDown、fireLaser 状态，则不打断
    if (this.angryRalphState === "jumpUp" || this.angryRalphState === "crashDown" || this.angryRalphState === "fireLaser") {
      if (this.angryRalphState === "crashDown") {
        this.angryRalph.body.allowGravity = true;
        this.angryRalph.setVelocityY(700);
        this.angryRalph.play("angryralph_crash_down", true);
      }
      return;
    }

    if (time > this.angryRalphNextDecisionTime) {
      // 正常状态下只随机 idle/moveLeft/moveRight
      const states = ["idle", "moveLeft", "moveRight"];
      const chosen = Phaser.Utils.Array.GetRandom(states);
      switch (chosen) {
        case "idle":
          this.angryRalph.setVelocityX(0);
          this.angryRalph.play("angryralph_idle", true);
          this.angryRalphState = "idle";
          break;
        case "moveLeft":
          this.angryRalph.setVelocityX(-this.angryRalphSpeed);
          this.angryRalph.play("angryralph_move_left", true);
          this.angryRalphState = "moveLeft";
          break;
        case "moveRight":
          this.angryRalph.setVelocityX(this.angryRalphSpeed);
          this.angryRalph.play("angryralph_move_right", true);
          this.angryRalphState = "moveRight";
          break;
      }
      const delay = Phaser.Math.Between(1000, 3000);
      this.angryRalphNextDecisionTime = time + delay;
      // 每次正常决策后有10%概率启动连招
      if (Phaser.Math.Between(1, 100) <= 10) {
        this.startRalphCombo();
      }
    }
  }

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
    // 3：向右发射激光
    this.anims.create({
      key: "angryralph_fire_right",
      frames: [{ key: "AngryRalph", frame: 3 }],
      frameRate: 5,
      repeat: 0
    });
    // 4：向左发射激光
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

    // 读取 "RalphSpawns" 对象层作为出生点
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
    // 不修改你设置的 hitbox 参数
    this.angryRalph.setBodySize(100, 120);

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
    this.angryRalphNextDecisionTime = 0;
    this.angryRalphState = "idle";

    // ★【新增】连招相关变量（不改动 hitbox、offset）
    this.angryRalphComboStep = 0;   // 0=无连招, 1=开始连招, 2=落地砸下, 3=激光连招中
    this.angryRalphLasersLeft = 0;  // 本轮激光次数
  }

  resetRalph() {
    this.angryRalph.setVelocity(0, 0);
    this.angryRalph.body.allowGravity = false;
    this.angryRalph.x = this.angryRalphSpawn.x;
    this.angryRalph.y = this.angryRalphSpawn.y;
    this.angryRalph.play("angryralph_idle");
    this.angryRalphState = "idle";
    this.angryRalphComboStep = 0;
    this.angryRalphLasersLeft = 0;
  }

  updateAngryRalph(time, delta) {
    if (!this.angryRalph) return;

    // 如果正在执行连招，则调用连招更新逻辑
    if (this.angryRalphComboStep > 0) {
      this.updateRalphCombo();
      return;
    }

    // 检查水平边界
    if (this.angryRalph.x < this.angryRalphEdges.left) {
      this.angryRalph.x = this.angryRalphEdges.left;
      this.angryRalphState = "moveRight";
    } else if (this.angryRalph.x > this.angryRalphEdges.right) {
      this.angryRalph.x = this.angryRalphEdges.right;
      this.angryRalphState = "moveLeft";
    }

    // 如果处于 jumpUp、crashDown、fireLaser 状态，则不打断
    if (this.angryRalphState === "jumpUp" || this.angryRalphState === "crashDown" || this.angryRalphState === "fireLaser") {
      if (this.angryRalphState === "crashDown") {
        this.angryRalph.body.allowGravity = true;
        this.angryRalph.setVelocityY(700);
        this.angryRalph.play("angryralph_crash_down", true);
      }
      return;
    }

    // 正常状态下只随机 idle/moveLeft/moveRight
    if (time > this.angryRalphNextDecisionTime) {
      const states = ["idle", "moveLeft", "moveRight"];
      const chosen = Phaser.Utils.Array.GetRandom(states);
      switch (chosen) {
        case "idle":
          this.angryRalph.setVelocityX(0);
          this.angryRalph.play("angryralph_idle", true);
          this.angryRalphState = "idle";
          break;
        case "moveLeft":
          this.angryRalph.setVelocityX(-this.angryRalphSpeed);
          this.angryRalph.play("angryralph_move_left", true);
          this.angryRalphState = "moveLeft";
          break;
        case "moveRight":
          this.angryRalph.setVelocityX(this.angryRalphSpeed);
          this.angryRalph.play("angryralph_move_right", true);
          this.angryRalphState = "moveRight";
          break;
      }
      const delay = Phaser.Math.Between(1000, 3000);
      this.angryRalphNextDecisionTime = time + delay;

      // 每次正常决策后有10%概率启动连招（而不是一开始就连招）
      if (Phaser.Math.Between(1, 100) <= 10) {
        this.startRalphCombo();
      }
    }
  }

  // ★【连招】启动连招流程，不影响初始移动
  startRalphCombo() {
    // 连招启动：从正常状态出发，不改变出生位置
    this.angryRalphComboStep = 1;
    // 随机决定本轮激光发射次数（1~3 次）
    this.angryRalphLasersLeft = Phaser.Math.Between(1, 3);
  }

  // ★【连招】更新连招流程
  updateRalphCombo() {
    switch (this.angryRalphComboStep) {
      case 1:
        // Step 1：锁定 Felix，跳到他上方
        this.angryRalph.setVelocity(0, 0);
        this.angryRalph.play("angryralph_jump_up", true);
        this.angryRalph.x = this.felix.x;
        this.angryRalph.y = this.felix.y - 200;
        // 进入 Step 2：等待落地
        this.angryRalphComboStep = 2;
        break;
      case 2:
        // Step 2：此时应进入 crashDown，由 floor 碰撞回调处理落地
        this.angryRalph.setVelocity(0, 0);
        this.angryRalphState = "crashDown";
        // 连招进入下一阶段后，由 floor 碰撞将状态重置为 idle，
        // 我们在连招更新中检测到 idle后进入 Step 3
        if (this.angryRalphState === "idle") {
          this.angryRalphComboStep = 3;
        }
        break;
      case 3:
        // Step 3：连招激光阶段
        if (this.angryRalph.state === "idle" || this.angryRalphState === "idle") {
          if (this.angryRalphLasersLeft > 0) {
            // 随机选择是否使用武器发射（嘴部或激光炮）
            let useWeapon = Phaser.Math.Between(0, 1) === 1;
            let faceRight = (this.felix.x >= this.angryRalph.x);
            this.fireRalphLaser(useWeapon, faceRight);
            this.angryRalphLasersLeft--;
          } else {
            // 连招完毕，恢复正常随机决策
            this.angryRalphComboStep = 0;
          }
        }
        break;
    }
  }

  // ★【连招】Ralph 发射激光（根据 useWeapon 与方向）
  fireRalphLaser(useWeapon, faceRight) {
    this.angryRalph.setVelocityX(0);
    this.angryRalphState = "fireLaser";
    let animKey = "";
    if (useWeapon) {
      animKey = faceRight ? "angryralph_fire_weapon_right" : "angryralph_fire_weapon_left";
    } else {
      animKey = faceRight ? "angryralph_fire_right" : "angryralph_fire_left";
    }
    this.angryRalph.play(animKey, true);

    let laserX = faceRight ? (this.angryRalph.x + 80) : (this.angryRalph.x - 80);
    let laser = this.physics.add.sprite(laserX, this.angryRalph.y, "Laser");
    laser.setScale(0.2);
    laser.body.allowGravity = false;
    let laserAnim = faceRight ? "laser_fire_right" : "laser_fire_left";
    laser.play(laserAnim);
    this.time.delayedCall(1000, () => {
      laser.destroy();
      this.angryRalphState = "idle";
    }, null, this);
  }

  resetRalph() {
    this.angryRalph.setVelocity(0, 0);
    this.angryRalph.body.allowGravity = false;
    this.angryRalph.x = this.angryRalphSpawn.x;
    this.angryRalph.y = this.angryRalphSpawn.y;
    this.angryRalph.play("angryralph_idle");
    this.angryRalphState = "idle";
    this.angryRalphComboStep = 0;
    this.angryRalphLasersLeft = 0;
  }

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
}

window.BossBattle = BossBattle;
