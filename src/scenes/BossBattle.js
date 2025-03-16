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

    // ----------------- 新增：加载鸟的 spritesheet -----------------
    this.load.spritesheet("bird1", "bird1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("bird1-flip", "bird1-flip.png", { frameWidth: 64, frameHeight: 64 });

    // ----------------- 新增：加载云的图片 -----------------
    this.load.image("cloud", "cloud.png");
    this.load.image("cloud2", "cloud2.png");

    // ★【新增】加载 AngryRalphSpritesheet.png
    this.load.spritesheet("AngryRalph", "AngryRalphSpritesheet.png", {
      frameWidth: 192,
      frameHeight: 176
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

    // 记录Felix最后的面向（初始向右）
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

  // ----------------- 保持你的其余函数逻辑不变 -----------------

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

  // ★【新增】创建 Angry Ralph
  createAngryRalph(map) {
    // 1) 定义动画：idle=frame0, move-right=1,2, move-left=9,10
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

    // 2) 从对象层 "RalphSpawns" 中读取坐标
    let ralphSpawnX = 400, ralphSpawnY = 100;
    let ralphSpawnLayer = map.getObjectLayer("RalphSpawns");
    if (ralphSpawnLayer && ralphSpawnLayer.objects.length > 0) {
      let obj = ralphSpawnLayer.objects[0];
      ralphSpawnX = obj.x + (obj.width || 0) / 2;
      ralphSpawnY = obj.y + (obj.height || 0) / 2;
    }

    // 3) 在该位置创建 angryRalph
    this.angryRalph = this.physics.add.sprite(ralphSpawnX, ralphSpawnY, "AngryRalph", 0)
      .setDepth(5)
      .setScale(1); // 可根据需求放大缩小

    this.angryRalph.play("angryralph_idle");

    // 4) 读取 "RalphEdges" 对象层，假设这里有2个对象分别表示左右边界
    this.angryRalphEdges = { left: 100, right: 600 }; // 默认
    let edgesLayer = map.getObjectLayer("RalphEdges");
    if (edgesLayer && edgesLayer.objects.length >= 2) {
      // 取前两个对象的 x 值，分别作为 left / right
      let edgeA = edgesLayer.objects[0];
      let edgeB = edgesLayer.objects[1];
      let xA = edgeA.x + (edgeA.width || 0) / 2;
      let xB = edgeB.x + (edgeB.width || 0) / 2;
      this.angryRalphEdges.left = Math.min(xA, xB);
      this.angryRalphEdges.right = Math.max(xA, xB);
    }

    // 5) 速度和 AI 状态
    this.angryRalphSpeed = 100; // 移动速度
    // 用一个定时器/时间戳来决定何时切换移动或idle
    this.angryRalphNextDecisionTime = 0; 
    this.angryRalphState = "idle"; // "idle" | "moveLeft" | "moveRight"
  }

  // ★【新增】在 update() 中被调用：让 AngryRalph 来回移动或idle
  updateAngryRalph(time, delta) {
    if (!this.angryRalph) return;

    // 如果到达左右边界，就强制停下或换个方向
    if (this.angryRalph.x <= this.angryRalphEdges.left) {
      // 把位置校正到边界，避免卡住
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
      // 在 idle / moveLeft / moveRight 三种状态中随机选一个
      let states = ["idle", "moveLeft", "moveRight"];
      let chosen = Phaser.Utils.Array.GetRandom(states);

      // 应用新的状态
      switch (chosen) {
        case "idle":
          this.angryRalph.setVelocityX(0);
          this.angryRalph.play("angryralph_idle", true);
          break;
        case "moveLeft":
          this.angryRalph.setVelocityX(-this.angryRalphSpeed);
          this.angryRalph.play("angryralph_move_left", true);
          break;
        case "moveRight":
          this.angryRalph.setVelocityX(this.angryRalphSpeed);
          this.angryRalph.play("angryralph_move_right", true);
          break;
      }
      this.angryRalphState = chosen;

      // 下次随机 1~3 秒之后再做决定
      let delay = Phaser.Math.Between(1000, 3000);
      this.angryRalphNextDecisionTime = time + delay;
    }
  }
}

window.BossBattle = BossBattle;
