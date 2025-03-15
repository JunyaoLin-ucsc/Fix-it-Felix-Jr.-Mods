class Gameplay extends Phaser.Scene {
  constructor() {
    super("Gameplay");
  }

  init(data) {
    // 如果是从 Next Loop 过来的，则 data.loop 存在，否则默认为 1（Restart时应传入 { loop:1, score:0 }）
    this.loop = data.loop || 1;
    this.currentStage = 1;
    this.maxStage = 5;
    this.levelTransitioning = false;
    this.windowsById = {};
    this.lastStoneDropIndex = null;
    this.inFinalStage = false;

    // 分数（如果重启则 data.score 可能为 0）
    this.score = data.score || 0;

    // 根据 Loop 计算初始生命值
    this.lives = this.getLivesByLoop(this.loop);

    // 每个 Stage 60 秒倒计时（进入新 Stage 时会重置）
    this.stageTime = 60;

    // 玻璃区间
    this.stageRanges = {
      1: { start: 1, end: 26 },
      2: { start: 27, end: 56 },
      3: { start: 57, end: 86 },
      4: { start: 87, end: 116 },
      5: { start: 117, end: 146 }
    };

    this.stageAreas = {};
    this.felixDirection = "right";
    this.currentRepairingGlass = null;

    // 用于石头碰撞时的短暂无敌（防止同一帧内重复扣血）
    this.invincible = false;

    // 用于区分每批扔出的石头，每次 throwStones 前会生成一个新的批次 ID
    this.processedStoneBatches = new Set();
    this.currentStoneBatch = 0;
  }

  // 根据 loop 计算初始生命值
  getLivesByLoop(loop) {
    if (loop === 1) return 3;
    if (loop === 2) return 4;
    return 4 + Math.floor((loop - 2) / 3);
  }

  preload() {
    this.load.path = "./assets/";
    this.load.tilemapTiledJSON("gameplayMap", "Gameplay.json");
    this.load.image("tilesetImage", "tileset.png");
    this.load.image("tileset2Image", "tileset2.png");

    this.load.spritesheet("Felix", "Felix-Sheet-export.png", {
      frameWidth: 600,
      frameHeight: 608
    });

    // 用 spritesheet 加载 RalphSpritesheet.png
    // 注意修改 frameWidth/frameHeight 为你实际资源的帧尺寸（此处假设为 192*176）
    this.load.spritesheet("Ralph", "RalphSpritesheet.png", {
      frameWidth: 192,
      frameHeight: 176
    });

    this.load.image("stone", "stone.png");
    this.load.spritesheet("glassSheet", "Glass-Sheet.png", {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.audio("movement", "movement.wav");
    this.load.audio("failure", "failure.wav");

    this.load.image("life", "Life.png");

    // --- Bird spritesheet load start ---
    this.load.spritesheet("bird1", "bird1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("bird1-flip", "bird1-flip.png", { frameWidth: 64, frameHeight: 64 });
    // --- Bird spritesheet load end ---
  }

  create() {
    // 确保石头组存在
    this.stones = this.physics.add.group();

    const map = this.make.tilemap({ key: "gameplayMap" });
    this.map = map;
    const tilesetA = map.addTilesetImage("tileset", "tilesetImage");
    const tilesetB = map.addTilesetImage("tileset2", "tileset2Image");

    map.createLayer("MainBackground", [tilesetA, tilesetB], 0, 0).setDepth(0);
    map.createLayer("Grass", [tilesetA, tilesetB], 0, -32).setDepth(1);
    map.createLayer("House", [tilesetA, tilesetB], 0, -32).setDepth(2);
    map.createLayer("Street Lamp", [tilesetA, tilesetB], 0, -32).setDepth(3);

    const floorLayer = map.createLayer("Floor", [tilesetA, tilesetB], 0, 0).setDepth(4);
    map.createLayer("Ladder", [tilesetA, tilesetB], 0, 0).setDepth(5);
    map.createLayer("Pillar", [tilesetA, tilesetB], 0, 0).setDepth(6);
    map.createLayer("Wall Paint", [tilesetA, tilesetB], 0, 0).setDepth(7);
    map.createLayer("Red Brick", [tilesetA, tilesetB], 0, 0).setDepth(8);
    map.createLayer("Support", [tilesetA, tilesetB], 0, 0).setDepth(9);

    const floorGrassLayer = map.createLayer("Floor Grass", [tilesetA, tilesetB], 0, 0).setDepth(13);
    this.windowLayerRef = map.createLayer("Window", [tilesetA, tilesetB], 0, 0).setDepth(12);
    const doorLayer = map.createLayer("Door", [tilesetA, tilesetB], 0, 0).setDepth(11);

    this.movementSnd = this.sound.add("movement");
    this.failureSnd = this.sound.add("failure");

    if (floorLayer) floorLayer.setCollisionByProperty({ collides: true });
    if (this.windowLayerRef) this.windowLayerRef.setCollisionByProperty({ collides: true });

    for (let s = 1; s <= this.maxStage; s++) {
      let spaceLayer = map.getObjectLayer(`Stage ${s} Space`);
      if (spaceLayer && spaceLayer.objects.length > 0) {
        let obj = spaceLayer.objects[0];
        this.stageAreas[s] = { topY: obj.y };
      }
    }
    let finalSpace = map.getObjectLayer("Final Stage Space");
    if (finalSpace && finalSpace.objects.length > 0) {
      let obj = finalSpace.objects[0];
      this.stageAreas["final"] = { topY: obj.y };
    }

    // 创建 Felix
    let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawns");
    this.felix = this.physics.add.sprite(felixSpawn.x, felixSpawn.y, "Felix", 0).setScale(0.1);
    this.felix.setCollideWorldBounds(true).setDepth(9999);
    this.time.delayedCall(0, () => {
      const dw = this.felix.displayWidth;
      const dh = this.felix.displayHeight;
      this.felix.body.setSize(dw * 10, dh * 10);
      this.felix.body.setOffset(dw, dh * 0.02);
    });
    this.physics.add.collider(this.felix, floorLayer);
    this.physics.add.collider(this.felix, doorLayer);
    this.physics.add.collider(this.felix, floorGrassLayer);
    this.physics.add.collider(this.felix, this.windowLayerRef);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    let stage1Area = this.stageAreas[1];
    if (stage1Area) {
      let stageHeight = 750;
      this.physics.world.setBounds(0, stage1Area.topY, map.widthInPixels, stageHeight);
      this.cameras.main.setBounds(0, stage1Area.topY, map.widthInPixels, stageHeight);
      this.cameras.main.setScroll(0, stage1Area.topY);
    }

    // 创建 Ralph 并定义动画
    this.createRalph();

    // 调用放大函数，将 Ralph 放大（例如放大到 1.75 倍）
    this.enlargeRalph(1.75);

    this.loadStageObjectLayers(1);

    // --- UI: Score, Time, Loop, Lives ---
    this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, {
      fontSize: "32px",
      fill: "#ffffff",
      lineSpacing: 5,
    }).setScrollFactor(0).setDepth(99999);

    this.timeText = this.add.text(360, 10, `Time: ${this.stageTime}`, {
      fontSize: "32px",
      fill: "#ffffff"
    }).setScrollFactor(0).setDepth(99999);

    this.loopText = this.add.text(10, 30, `Loop: ${this.loop}`, {
      fontSize: "32px",
      fill: "#ffffff",
      lineSpacing: 5,
    }).setScrollFactor(0).setDepth(99999);

    this.stageText = this.add.text(10, 50, `Stage: ${this.currentStage}`, {
      fontSize: "32px",
      fill: "#ffffff",
      lineSpacing: 5,
    }).setScrollFactor(0).setDepth(99999);

    this.lifeIcons = [];
    this.updateLivesUI();

    // --- 合并石头碰撞：同一批石头只扣一次血 ---
    this.physics.add.overlap(this.felix, this.stones, (felix, stone) => {
      if (this.processedStoneBatches.has(stone.batchId)) {
        return;
      }
      if (!this.levelTransitioning && !this.invincible) {
        this.processedStoneBatches.add(stone.batchId);
        if (!this.failureSnd.isPlaying) {
          this.failureSnd.play();
        }
        this.lives--;
        this.updateLivesUI();
        if (this.lives <= 0) {
          this.scene.start("Gameover", {
            loop: 1,
            score: 0,
            canNextLoop: false
          });
          return;
        }
        this.invincible = true;
        this.stones.children.iterate(child => {
          if (child.body && child.batchId === stone.batchId) {
            child.body.checkCollision.none = true;
          }
        });
        this.time.delayedCall(100, () => { this.invincible = false; });
      }
    }, null, this);

    // 每次扔石头前生成新的批次 ID
    this.currentStoneBatch = 0;
    const stoneInterval = (this.loop === 1) ? 3000 : 2000;
    const stoneVelocity = (this.loop === 1) ? 100 : 150 + 10 * (this.loop - 1);
    this.stoneTimer = this.time.addEvent({
      delay: stoneInterval,
      loop: true,
      callback: () => {
        this.currentStoneBatch++;
        this.throwStones(stoneVelocity);
      },
      callbackScope: this
    });

    this.events.on('shutdown', () => {
      if (this.stoneTimer) {
        this.stoneTimer.remove();
        this.stoneTimer = null;
      }
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.isWindowJumping = false;

    this.loadGlassForStage(this.currentStage);

    // --- Bird logic start ---
    this.birds = this.physics.add.group();
    this.physics.add.overlap(this.birds, this.felix, this.handleBirdCollision, null, this);

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

    this.birdSpawnPositions = [];
    for (let i = 1; i <= 5; i++) {
      let layer = this.map.getObjectLayer("Stage " + i + " BirdFly");
      if (layer && layer.objects && layer.objects.length > 0) {
        let spawnObj = layer.objects[0];
        this.birdSpawnPositions.push(spawnObj.y);
      }
    }

    this.time.addEvent({
      delay: 3000,
      callback: this.spawnBird,
      callbackScope: this,
      loop: true
    });
    // --- Bird logic end ---

    this.felix.setFrame(0);
    this.levelTransitioning = false;
  }

  enlargeRalph(newScale) {
    this.ralph.setScale(newScale);
  }

  createRalph() {
    let ralphLayer = this.map.getObjectLayer("RalphSpawns");
    let ralphX = 400, ralphY = 100;
    if (ralphLayer && ralphLayer.objects.length > 0) {
      let obj = ralphLayer.objects[0];
      ralphX = obj.x + (obj.width || 0) / 2;
      ralphY = obj.y + (obj.height || 0) / 2;
    }

    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph", 0)
      .setDepth(1000)
      .setScale(0.2);

    // 定义动画
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
    this.anims.create({
      key: "ralph_throw",
      frames: this.anims.generateFrameNumbers("Ralph", { start: 3, end: 8 }),
      frameRate: 8,
      repeat: 0
    });
    this.anims.create({
      key: "ralph_final",
      frames: this.anims.generateFrameNumbers("Ralph", { start: 11, end: 13 }),
      frameRate: 5,
      repeat: 0
    });

    this.ralph.play("ralph_idle");
  }

  updateLivesUI() {
    this.lifeIcons.forEach(icon => icon.destroy());
    this.lifeIcons = [];
    const spacing = 60;
    let startX = this.cameras.main.width - 10;
    for (let i = 0; i < this.lives; i++) {
      let icon = this.add.image(startX - i * spacing, 20, "life")
        .setScrollFactor(0)
        .setScale(0.2)
        .setOrigin(1, 0)
        .setDepth(99999);
      this.lifeIcons.push(icon);
    }
  }
  
  updateStageUI() {
    this.stageText.setText(`Stage: ${this.currentStage}`);
  }

  throwStones(velocity = 150) {
    if (this.inFinalStage) return;
    this.ralph.play("ralph_throw");
    this.ralph.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.ralph.play("ralph_idle");
    });
    const pos = { x: this.ralph.x, y: this.ralph.y };
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 200, () => {
        this.createStone(pos.x, pos.y, velocity);
      });
    }
    this.ralphDelayedCall = this.time.delayedCall(3 * 200 + 500, () => {
      this.moveRalphRandom();
      this.ralphDelayedCall = null;
    });
  }

  createStone(x, y, velocity = 150) {
    let stone = this.stones.create(x, y, "stone");
    stone.batchId = this.currentStoneBatch;
    stone.setScale(0.05).setDepth(9998);
    stone.setVelocityY(velocity);
  }

  moveRalphRandom() {
    if (this.inFinalStage) return;
    if (!this.stoneDrops || !this.stoneDrops.length) return;
    let idx, tries = 0;
    do {
      idx = Phaser.Math.Between(0, this.stoneDrops.length - 1);
      tries++;
    } while (idx === this.lastStoneDropIndex && this.stoneDrops.length > 1 && tries < 10);
    this.lastStoneDropIndex = idx;
    let target = this.stoneDrops[idx];
    if (target.x > this.ralph.x) {
      this.ralph.play("ralph_move_right", true);
    } else {
      this.ralph.play("ralph_move_left", true);
    }
    this.tweens.killTweensOf(this.ralph);
    this.tweens.add({
      targets: this.ralph,
      x: target.x,
      y: target.y,
      duration: 500,
      ease: "Linear",
      onComplete: () => {
        this.ralph.play("ralph_idle");
      }
    });
  }

  loadStageObjectLayers(stage) {
    this.windowPlatforms = [];
    let felixPosLayer = this.map.getObjectLayer(`Felix Positions ${stage}`);
    if (felixPosLayer && felixPosLayer.objects.length > 0) {
      felixPosLayer.objects.forEach(obj => {
        let px = obj.x + obj.width / 2;
        let py = obj.y + obj.height / 2;
        this.windowPlatforms.push({ x: px, y: py });
      });
    }
    this.stoneDrops = [];
    let stoneDropLayer = this.map.getObjectLayer(`StoneDropPosition ${stage}`);
    if (stoneDropLayer && stoneDropLayer.objects.length > 0) {
      stoneDropLayer.objects.forEach(obj => {
        let sx = obj.x + (obj.width || 0) / 2;
        let sy = obj.y + (obj.height || 0) / 2;
        this.stoneDrops.push({ x: sx, y: sy });
      });
    }
  }

  loadGlassForStage(stage) {
    let range = this.stageRanges[stage];
    if (!range) return;
    let allZero = true;
    for (let num = range.start; num <= range.end; num += 2) {
      let windowId = Math.floor((num - range.start) / 2) + 1;
      let key = `${stage}_${windowId}`;
      let lowerLayer = this.map.getObjectLayer("Glass " + num);
      let upperLayer = this.map.getObjectLayer("Glass " + (num + 1));
      if (!lowerLayer || !lowerLayer.objects.length) {
        continue;
      }
      if (!upperLayer || !upperLayer.objects.length) {
        continue;
      }
      let objLower = lowerLayer.objects[0];
      let objUpper = upperLayer.objects[0];
      let gxLower = objLower.x + objLower.width / 2;
      let gyLower = objLower.y + objLower.height / 2;
      let gxUpper = objUpper.x + objUpper.width / 2;
      let gyUpper = objUpper.y + objUpper.height / 2;
      let lowerSprite = this.add.sprite(gxLower, gyLower, "glassSheet").setDepth(this.windowLayerRef.depth + 1);
      let upperSprite = this.add.sprite(gxUpper, gyUpper, "glassSheet").setDepth(this.windowLayerRef.depth + 1);
      let frameLower = Phaser.Math.Between(0, 2);
      let frameUpper = Phaser.Math.Between(0, 2);
      lowerSprite.setFrame(frameLower);
      upperSprite.setFrame(frameUpper);
      if (frameLower !== 0 || frameUpper !== 0) {
        allZero = false;
      }
      let lowerBroken = (frameLower !== 0);
      let upperBroken = (frameUpper !== 0);
      this.windowsById[key] = {
        stage: stage,
        glasses: [
          { sprite: lowerSprite, isBroken: lowerBroken, repairTimer: 0 },
          { sprite: upperSprite, isBroken: upperBroken, repairTimer: 0 }
        ]
      };
    }
    if (stage === 1 && allZero) {
      let keys = Object.keys(this.windowsById).filter(k => k.startsWith("1_"));
      if (keys.length > 0) {
        let forcedKey = keys[Phaser.Math.Between(0, keys.length - 1)];
        let wObj = this.windowsById[forcedKey];
        let forcedGlass = wObj.glasses[0];
        forcedGlass.sprite.setFrame(2);
        forcedGlass.isBroken = true;
      }
    }
  }

  allWindowsRepairedForStage() {
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage === this.currentStage) {
        for (let g of wObj.glasses) {
          if (g.isBroken) return false;
        }
      }
    }
    return true;
  }

  checkAndRepairWindows(delta) {
    const REPAIR_DISTANCE = 50;
    const REPAIR_INTERVAL = 500;
    if (this.currentRepairingGlass) {
      let dist = Phaser.Math.Distance.Between(
        this.felix.x, this.felix.y,
        this.currentRepairingGlass.sprite.x, this.currentRepairingGlass.sprite.y
      );
      if (dist < REPAIR_DISTANCE) {
        this.currentRepairingGlass.repairTimer += delta;
        if (this.felixDirection === "right") {
          let animFrame = 3 + (Math.floor(this.currentRepairingGlass.repairTimer / 50) % 4);
          this.felix.setFrame(animFrame);
        } else {
          let animFrame = 7 + (Math.floor(this.currentRepairingGlass.repairTimer / 50) % 4);
          this.felix.setFrame(animFrame);
        }
        if (this.currentRepairingGlass.repairTimer >= REPAIR_INTERVAL) {
          this.currentRepairingGlass.sprite.setFrame(0);
          this.currentRepairingGlass.isBroken = false;
          this.currentRepairingGlass.repairTimer = 0;
          this.score += 100;
          this.scoreText.setText(`Score: ${this.score}`);
          if (this.felixDirection === "right") {
            this.felix.setFrame(3);
          } else {
            this.felix.setFrame(7);
          }
          this.currentRepairingGlass = null;
        }
      } else {
        this.currentRepairingGlass.repairTimer = 0;
        this.currentRepairingGlass = null;
      }
      return;
    }
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage !== this.currentStage) continue;
      for (let g of wObj.glasses) {
        if (!g.isBroken) continue;
        let dist = Phaser.Math.Distance.Between(
          this.felix.x, this.felix.y,
          g.sprite.x, g.sprite.y
        );
        if (dist < REPAIR_DISTANCE) {
          g.repairTimer = g.repairTimer || 0;
          this.currentRepairingGlass = g;
          break;
        }
      }
      if (this.currentRepairingGlass) break;
    }
  }

  update(time, delta) {
    if (!this.cursors) return;
    if (this.levelTransitioning || this.isWindowJumping) return;

    this.stageTime -= delta / 1000;
    if (this.stageTime <= 0) {
      this.scene.start("Gameover", {
        loop: this.loop,
        score: this.score,
        canNextLoop: false
      });
      return;
    }
    this.timeText.setText(`Time: ${Math.floor(this.stageTime)}`);

    if (this.cursors.right.isDown) {
      this.felixDirection = "right";
      if (!this.allWindowsRepairedForStage()) {
        this.felix.setFrame(1);
      }
    } else if (this.cursors.left.isDown) {
      this.felixDirection = "left";
      if (!this.allWindowsRepairedForStage()) {
        this.felix.setFrame(2);
      }
    } else if (this.cursors.up.isDown || this.cursors.down.isDown) {
      if (this.felixDirection === "right") {
        this.felix.setFrame(1);
      } else {
        this.felix.setFrame(2);
      }
    } else {
      this.felix.setFrame(0);
    }

    this.checkAndRepairWindows(delta);

    if (this.allWindowsRepairedForStage()) {
      console.log(`All windows in Stage ${this.currentStage} repaired => levelTransition().`);
      this.levelTransition();
      return;
    }

    let currentIndex = this.findClosestPlatformIndex(this.felix.x, this.felix.y);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      let aboveIdx = this.findPlatformAbove(currentIndex);
      if (aboveIdx !== null) this.doWindowMoveTween(aboveIdx);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      let belowIdx = this.findPlatformBelow(currentIndex);
      if (belowIdx !== null) this.doWindowMoveTween(belowIdx);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      let leftIdx = this.findPlatformLeft(currentIndex);
      if (leftIdx !== null) this.doWindowJumpAnimation(currentIndex, leftIdx);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      let rightIdx = this.findPlatformRight(currentIndex);
      if (rightIdx !== null) this.doWindowJumpAnimation(currentIndex, rightIdx);
    }

    // --- Bird update logic ---
    if (this.birds) {
      this.birds.getChildren().forEach(bird => {
        if (bird.texture.key === "bird1") {
          if (bird.x > this.cameras.main.width + bird.width) {
            bird.destroy();
          }
        } else if (bird.texture.key === "bird1-flip") {
          if (bird.x < -bird.width) {
            bird.destroy();
          }
        }
      });
    }
  }

  spawnBird() {
    // 随机决定生成单只或同时生成两只鸟（出现频率较低）
    let chance = Phaser.Math.Between(1, 100);
    if (chance <= 30) {
      this.spawnOneBird();
    } else if (chance > 30 && chance <= 40) {
      this.spawnTwoBirds();
    }
  }

  spawnOneBird() {
    // 筛选出当前没有被占用的飞行高度（同一时刻同一高度只能有一只鸟，容差5像素）
    let availablePositions = this.birdSpawnPositions.filter(yPos => {
      return !this.birds.getChildren().some(bird => Math.abs(bird.y - yPos) < 5);
    });
    if (availablePositions.length === 0) {
      return;
    }
    // 随机选择一个可用的高度
    let spawnY = Phaser.Utils.Array.GetRandom(availablePositions);
    // 随机选择鸟的类型
    let birdType = Phaser.Math.RND.pick(["bird1", "bird1-flip"]);
    // 根据鸟类型设置X轴初始位置：bird1从左侧出现，bird1-flip从右侧出现
    let spawnX = (birdType === "bird1") ? -32 : this.cameras.main.width + 32;
    // 创建鸟并启用碰撞盒
    let bird = this.physics.add.sprite(spawnX, spawnY, birdType, 0);
    bird.body.setSize(64, 64);
    bird.setDepth(100); // 确保鸟覆盖所有tile layer
    let speed = 100;
    if (birdType === "bird1") {
      bird.body.velocity.x = speed;
      bird.anims.play("bird1_fly");
    } else {
      bird.body.velocity.x = -speed;
      bird.anims.play("bird1flip_fly");
    }
    this.birds.add(bird);
  }

  spawnTwoBirds() {
    // 筛选当前未被占用的高度，必须至少有两个不同高度
    let availablePositions = this.birdSpawnPositions.filter(yPos => {
      return !this.birds.getChildren().some(bird => Math.abs(bird.y - yPos) < 5);
    });
    if (availablePositions.length < 2) {
      // 若不足两个位置则只生成一只
      this.spawnOneBird();
      return;
    }
    // 随机打乱后取前两个不同高度
    Phaser.Utils.Array.Shuffle(availablePositions);
    let spawnY1 = availablePositions[0];
    let spawnY2 = availablePositions[1];
    // 分别生成bird1和bird1-flip，它们不能处于同一高度
    let bird1 = this.physics.add.sprite(-32, spawnY1, "bird1", 0);
    bird1.body.setSize(64, 64);
    bird1.setDepth(10);
    bird1.body.velocity.x = 100;
    bird1.anims.play("bird1_fly");
    this.birds.add(bird1);

    let bird1Flip = this.physics.add.sprite(this.cameras.main.width + 32, spawnY2, "bird1-flip", 0);
    bird1Flip.body.setSize(64, 64);
    bird1Flip.setDepth(10);
    bird1Flip.body.velocity.x = -100;
    bird1Flip.anims.play("bird1flip_fly");
    this.birds.add(bird1Flip);
  }

  handleBirdCollision(felix, bird) {
    // 当鸟与Felix碰撞时，Felix减少1生命值，并短暂无敌
    if (!this.invincible) {
      this.lives--;
      this.updateLivesUI();
      this.invincible = true;
      this.time.delayedCall(1000, () => {
        this.invincible = false;
      });
      bird.destroy();
    }
  }

  levelTransition() {
    this.levelTransitioning = true;
    if (this.ralphDelayedCall) {
      this.ralphDelayedCall.remove();
      this.ralphDelayedCall = null;
    }
    let nextStage = this.currentStage + 1;
    if (nextStage > this.maxStage) {
      if (this.stageAreas["final"]) {
        console.log("All normal stages done => go to Final Stage.");
        this.transitionToFinalStage();
      } else {
        console.log("All normal stages done, no Final Stage Space found. Stop transition.");
      }
      this.levelTransitioning = false;
      return;
    }
    let currentArea = this.stageAreas[this.currentStage];
    let nextArea = this.stageAreas[nextStage];
    if (!currentArea || !nextArea) {
      console.error(`Stage area missing: current=${this.currentStage}, next=${nextStage}`);
      this.levelTransitioning = false;
      return;
    }
    console.log(`Stage ${this.currentStage} repaired => transitioning to Stage ${nextStage}.`);
    this.stageTime = 60;
    let stageHeight = 750;
    this.physics.world.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    this.preLoadNextStage(nextStage);
    this.felix.setFrame(0);
    if (this.stoneTimer) {
      this.stoneTimer.paused = true;
    }
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, nextArea.topY);
    if (this.stoneTimer) {
      this.stoneTimer.paused = false;
    }
    this.levelTransitioning = false;
  }

  preLoadNextStage(nextStage) {
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage === this.currentStage) {
        wObj.glasses.forEach(g => g.sprite.destroy());
        delete this.windowsById[key];
      }
    }
    this.currentStage = nextStage;
    this.updateStageUI();
    this.loadGlassForStage(nextStage);
    let felixLayer = this.map.getObjectLayer(`FelixStage${nextStage}`);
    let nextArea = this.stageAreas[nextStage];
    let newX = this.felix.x;
    let newY = nextArea ? nextArea.topY + 200 : this.felix.y;
    if (felixLayer && felixLayer.objects.length > 0) {
      let randF = Phaser.Math.Between(0, felixLayer.objects.length - 1);
      let fObj = felixLayer.objects[randF];
      newX = fObj.x + (fObj.width || 0) / 2;
      newY = fObj.y + (fObj.height || 0) / 2;
      console.log(`Felix => stage${nextStage}: (${newX}, ${newY})`);
    }
    this.felix.setPosition(newX, newY);
    this.tweens.killTweensOf(this.ralph);
    let rLayer = this.map.getObjectLayer(`RalphStage${nextStage}`);
    if (rLayer && rLayer.objects.length > 0) {
      let rIndex = Phaser.Math.Between(0, rLayer.objects.length - 1);
      let rObj = rLayer.objects[rIndex];
      let rx = rObj.x + (rObj.width || 0) / 2;
      let ry = rObj.y + (rObj.height || 0) / 2;
      this.ralph.setPosition(rx, ry);
      console.log(`Ralph => stage${nextStage}: (${rx}, ${ry})`);
      // Ralph 回到 idle 帧 0
      this.ralph.play("ralph_idle");
    } else {
      console.warn(`No RalphStage${nextStage} or empty. Keep old pos.`);
    }
    this.loadStageObjectLayers(nextStage);
    let stageHeight = 750;
    this.physics.world.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
  }

  transitionToFinalStage() {
    let finalData = this.stageAreas["final"];
    if (!finalData) {
      console.warn("No final stage data. End game or do something else.");
      return;
    }
    this.stageTime = 60;
    let finalTopY = finalData.topY;
    let stageHeight = 750;
    this.physics.world.setBounds(0, finalTopY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, finalTopY, this.map.widthInPixels, stageHeight);
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, finalTopY);
    this.inFinalStage = true;
    if (this.stoneTimer) {
      this.stoneTimer.remove();
      this.stoneTimer = null;
    }
    this.tweens.killTweensOf(this.ralph);
    let felixFinalLayer = this.map.getObjectLayer("FelixFinal");
    if (felixFinalLayer && felixFinalLayer.objects.length > 0) {
      let obj = felixFinalLayer.objects[0];
      let fx = obj.x + (obj.width || 0) / 2;
      let fy = obj.y + (obj.height || 0) / 2;
      this.felix.setPosition(fx, fy);
      this.felix.setFrame(0);
    }
    let ralphFinalLayer = this.map.getObjectLayer("RalphFinal");
    if (ralphFinalLayer && ralphFinalLayer.objects.length > 0) {
      let obj = ralphFinalLayer.objects[0];
      let rx = obj.x + (obj.width || 0) / 2;
      let ry = obj.y + (obj.height || 0) / 2;
      this.ralph.setPosition(rx, ry);
      this.ralph.play("ralph_final");
    }
    this.time.delayedCall(3000, () => {
      this.scene.start("Gameover", {
        loop: this.loop,
        score: this.score,
        canNextLoop: true
      });
    });
  }

  doWindowMoveTween(targetIndex) {
    this.isWindowJumping = true;
    this.movementSnd.play({ restart: true });
    let targetPos = this.windowPlatforms[targetIndex];
    this.tweens.add({
      targets: this.felix,
      x: targetPos.x,
      y: targetPos.y,
      duration: 300,
      ease: "Linear",
      onComplete: () => {
        this.isWindowJumping = false;
        this.felix.setVelocity(0, 0);
      }
    });
  }

  doWindowJumpAnimation(fromIndex, toIndex) {
    this.isWindowJumping = true;
    this.movementSnd.play({ restart: true });
    let fromPos = this.windowPlatforms[fromIndex];
    let toPos = this.windowPlatforms[toIndex];
    this.felix.setPosition(fromPos.x, fromPos.y);
    let midX = (fromPos.x + toPos.x) / 2;
    let midY = (fromPos.y + toPos.y) / 2 - 50;
    this.tweens.add({
      targets: this.felix,
      x: midX,
      y: midY,
      duration: 200,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.felix,
          x: toPos.x,
          y: toPos.y,
          duration: 200,
          ease: "Quad.easeIn",
          onComplete: () => {
            this.isWindowJumping = false;
            this.felix.setVelocity(0, 0);
          }
        });
      }
    });
  }

  findClosestPlatformIndex(x, y) {
    if (!this.windowPlatforms || this.windowPlatforms.length === 0) return null;
    let closest = null;
    let minDist = Infinity;
    this.windowPlatforms.forEach((p, i) => {
      let d = Phaser.Math.Distance.Between(x, y, p.x, p.y);
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
    });
    return closest;
  }

  findPlatformAbove(idx) {
    if (idx == null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate = null;
    let minDist = Infinity;
    this.windowPlatforms.forEach((p, i) => {
      if (p.y < cur.y && Math.abs(p.x - cur.x) < 40) {
        let dist = cur.y - p.y;
        if (dist < minDist) {
          minDist = dist;
          candidate = i;
        }
      }
    });
    return candidate;
  }

  findPlatformBelow(idx) {
    if (idx == null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate = null;
    let minDist = Infinity;
    this.windowPlatforms.forEach((p, i) => {
      if (p.y > cur.y && Math.abs(p.x - cur.x) < 40) {
        let dist = p.y - cur.y;
        if (dist < minDist) {
          minDist = dist;
          candidate = i;
        }
      }
    });
    return candidate;
  }

  findPlatformLeft(idx) {
    if (idx == null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate = null;
    let minDist = Infinity;
    this.windowPlatforms.forEach((p, i) => {
      if (p.x < cur.x && Math.abs(p.y - cur.y) < 40) {
        let dist = cur.x - p.x;
        if (dist < minDist) {
          minDist = dist;
          candidate = i;
        }
      }
    });
    return candidate;
  }

  findPlatformRight(idx) {
    if (idx == null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate = null;
    let minDist = Infinity;
    this.windowPlatforms.forEach((p, i) => {
      if (p.x > cur.x && Math.abs(p.y - cur.y) < 40) {
        let dist = p.x - cur.x;
        if (dist < minDist) {
          minDist = dist;
          candidate = i;
        }
      }
    });
    return candidate;
  }
}

window.Gameplay = Gameplay;
