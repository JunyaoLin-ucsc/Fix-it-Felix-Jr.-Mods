class Gameplay extends Phaser.Scene {
  constructor() {
    super("Gameplay");
  }

  init() {
    this.currentStage = 1;
    this.maxStage = 5;
    this.levelTransitioning = false;
    this.windowsById = {};
    this.lastStoneDropIndex = null; // 防止 Ralph 连续投同一个点

    // 每关玻璃编号区间
    this.stageRanges = {
      1: { start: 1, end: 26 },
      2: { start: 27, end: 56 },
      3: { start: 57, end: 86 },
      4: { start: 87, end: 116 },
      5: { start: 117, end: 146 }
    };

    // 记录每个 Stage 的 topY，用于相机滚动
    this.stageAreas = {};
  }

  preload() {
    this.load.path = "./assets/";
    this.load.tilemapTiledJSON("gameplayMap", "Gameplay.json");
    this.load.image("tilesetImage", "tileset.png");
    this.load.image("tileset2Image", "tileset2.png");

    this.load.image("Felix", "Felix.png");
    this.load.image("Ralph", "Ralph.png");
    this.load.image("stone", "stone.png");

    this.load.spritesheet("glassSheet", "Glass-Sheet.png", {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.audio("movement", "movement.wav");
    this.load.audio("failure", "failure.wav");
  }

  create() {
    // 读取地图
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

    // 音效
    this.movementSnd = this.sound.add("movement");
    this.failureSnd = this.sound.add("failure");

    // 设置碰撞
    if (floorLayer) floorLayer.setCollisionByProperty({ collides: true });
    if (this.windowLayerRef) this.windowLayerRef.setCollisionByProperty({ collides: true });

    // 读取 "Stage X Space" 的 topY
    for (let s = 1; s <= this.maxStage; s++) {
      let spaceLayer = map.getObjectLayer(`Stage ${s} Space`);
      if (spaceLayer && spaceLayer.objects.length > 0) {
        let obj = spaceLayer.objects[0];
        this.stageAreas[s] = { topY: obj.y };
        console.log(`Stage ${s}: topY=${obj.y}`);
      } else {
        console.warn(`Stage ${s} Space layer missing or empty.`);
      }
    }
    // 若还有一个 Final Stage Space，可额外读取
    let finalSpace = map.getObjectLayer("Final Stage Space");
    if (finalSpace && finalSpace.objects.length > 0) {
      let obj = finalSpace.objects[0];
      this.stageAreas["final"] = { topY: obj.y };
      console.log(`Final Stage topY=${obj.y}`);
    }

    // 创建 Felix
    let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawns");
    this.felix = this.physics.add.sprite(felixSpawn.x, felixSpawn.y, "Felix").setScale(0.1);
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

    // 设置相机
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // ★ 在这里将相机初始scroll到 stage1 的区域
    let stage1Area = this.stageAreas[1];
    if (stage1Area) {
      let stageHeight = 750;
      this.physics.world.setBounds(0, stage1Area.topY, map.widthInPixels, stageHeight);
      this.cameras.main.setBounds(0, stage1Area.topY, map.widthInPixels, stageHeight);
      // 相机立即滚动到 Stage1 顶部
      this.cameras.main.setScroll(0, stage1Area.topY);
    }

    // 创建 Ralph
    const ralphLayer = map.getObjectLayer("RalphSpawns");
    let ralphX = 400, ralphY = 100;
    if (ralphLayer && ralphLayer.objects.length > 0) {
      let obj = ralphLayer.objects[0];
      ralphX = obj.x + (obj.width || 0) / 2;
      ralphY = obj.y + (obj.height || 0) / 2;
    }
    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph").setDepth(1000).setScale(0.2);

    // 先读取 Stage 1 的 Felix Positions 和 StoneDropPosition
    this.loadStageObjectLayers(1);

    // 投石物理组
    this.stones = this.physics.add.group();
    this.physics.add.overlap(this.felix, this.stones, () => {
      if (!this.levelTransitioning) {
        if (!this.failureSnd.isPlaying) {
          this.failureSnd.play();
        }
        this.scene.start("Gameover");
      }
    });
    // 定时投石
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: this.throwStones,
      callbackScope: this
    });

    // 键盘输入
    this.cursors = this.input.keyboard.createCursorKeys();
    this.isWindowJumping = false;

    // 加载当前 Stage (1) 的玻璃
    this.loadGlassForStage(this.currentStage);
    this.levelTransitioning = false;
  }

  // 每次进入一个Stage后，加载它专用的 "Felix Positions X" 和 "StoneDropPosition X"
  loadStageObjectLayers(stage) {
    this.windowPlatforms = [];
    let felixPosLayer = this.map.getObjectLayer(`Felix Positions ${stage}`);
    if (felixPosLayer && felixPosLayer.objects.length > 0) {
      felixPosLayer.objects.forEach(obj => {
        let px = obj.x + obj.width / 2;
        let py = obj.y + obj.height / 2;
        this.windowPlatforms.push({ x: px, y: py });
      });
    } else {
      console.warn(`Felix Positions ${stage} layer missing or empty.`);
    }

    this.stoneDrops = [];
    let stoneDropLayer = this.map.getObjectLayer(`StoneDropPosition ${stage}`);
    if (stoneDropLayer && stoneDropLayer.objects.length > 0) {
      stoneDropLayer.objects.forEach(obj => {
        let sx = obj.x + (obj.width || 0) / 2;
        let sy = obj.y + (obj.height || 0) / 2;
        this.stoneDrops.push({ x: sx, y: sy });
      });
    } else {
      console.warn(`StoneDropPosition ${stage} layer missing or empty.`);
    }
  }

  // 加载指定Stage的玻璃数据：Stage 1随机[0,1,2], Stage2+强制[1,2]
  loadGlassForStage(stage) {
    let range = this.stageRanges[stage];
    if (!range) return;
    let allZero = true; // 用于检测是否全部随机成0
    for (let num = range.start; num <= range.end; num += 2) {
      let windowId = Math.floor((num - range.start) / 2) + 1;
      let key = `${stage}_${windowId}`;
      let lowerLayer = this.map.getObjectLayer("Glass " + num);
      let upperLayer = this.map.getObjectLayer("Glass " + (num + 1));
      if (!lowerLayer || !lowerLayer.objects.length) {
        console.warn(`Glass ${num} layer missing or empty.`);
        continue;
      }
      if (!upperLayer || !upperLayer.objects.length) {
        console.warn(`Glass ${num + 1} layer missing or empty.`);
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

      // Stage 1 随机 [0..2], 其余 [1..2]
      let frameLower, frameUpper;
      if (stage === 1) {
        frameLower = Phaser.Math.Between(0, 2);
        frameUpper = Phaser.Math.Between(0, 2);
      } else {
        // Stage2+ 强制破损
        frameLower = Phaser.Math.Between(0, 2);
        frameUpper = Phaser.Math.Between(0, 2);
      }
      lowerSprite.setFrame(frameLower);
      upperSprite.setFrame(frameUpper);

      if (frameLower !== 0 || frameUpper !== 0) {
        allZero = false; // 只要有一块不是0，就说明不是全部完好
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

    // 如果 stage=1 且全都是0，则强行把最后一扇或随机一扇改为破损2
    if (stage === 1 && allZero) {
      let keys = Object.keys(this.windowsById).filter(k => k.startsWith("1_"));
      if (keys.length > 0) {
        let forcedKey = keys[Phaser.Math.Between(0, keys.length - 1)];
        let wObj = this.windowsById[forcedKey];
        let forcedGlass = wObj.glasses[0]; // 下玻璃
        forcedGlass.sprite.setFrame(2);
        forcedGlass.isBroken = true;
        console.log(`Stage1 had all 0 => forced ${forcedKey} lower glass to frame=2`);
      }
    }
  }

  // 投石：从 Ralph 的位置产生石头，然后 Ralph 移动到本Stage某个石头点
  throwStones() {
    const pos = { x: this.ralph.x, y: this.ralph.y };
    const stoneVelocity = 150;
    // 连续扔3块
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 200, () => {
        this.createStone(pos.x, pos.y, stoneVelocity);
      });
    }
    // 扔完后移动
    this.time.delayedCall(3 * 200 + 500, () => {
      this.moveRalphRandom();
    });
  }

  createStone(x, y, velocity = 150) {
    let stone = this.stones.create(x, y, "stone");
    stone.setScale(0.05).setDepth(9998);
    stone.setVelocityY(velocity);
  }

  // Ralph 在当前stage的stoneDrops之间移动
  moveRalphRandom() {
    if (!this.stoneDrops.length) return;
    let idx, tries = 0;
    do {
      idx = Phaser.Math.Between(0, this.stoneDrops.length - 1);
      tries++;
    } while (idx === this.lastStoneDropIndex && this.stoneDrops.length > 1 && tries < 10);

    this.lastStoneDropIndex = idx;
    let target = this.stoneDrops[idx];

    this.tweens.killTweensOf(this.ralph);
    this.tweens.add({
      targets: this.ralph,
      x: target.x,
      y: target.y,
      duration: 500,
      ease: "Linear"
    });
  }

  // 是否本关所有窗户都修好了
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

  // 关卡切换：使用 camera.pan() 实现滚动；完成后加载下个关卡数据
  levelTransition() {
    this.levelTransitioning = true;

    let nextStage = this.currentStage + 1;
    // 若超过 maxStage，则检查是否有 Final Stage
    if (nextStage > this.maxStage) {
      // 如果存在 "Final Stage Space"
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

    console.log(`Stage ${this.currentStage} repaired => go to Stage ${nextStage}.`);
    // 设置相机与物理边界
    let stageHeight = 750;
    this.physics.world.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);

    // 计算滚动目标
    let newCenterY = nextArea.topY + this.cameras.main.height / 2;
    let currentCenter = this.cameras.main.midPoint;
    console.log(`Camera pan from y=${currentCenter.y} to y=${newCenterY}`);

    // 停止跟随，执行 pan
    this.cameras.main.stopFollow();
    this.cameras.main.pan(currentCenter.x, newCenterY, 2000, "Linear", false, () => {
      // pan 完成后，Felix & Ralph 换到新关卡位置
      this.switchToStage(nextStage);
      this.levelTransitioning = false;
    });
  }

  // 切换到 Final Stage
  transitionToFinalStage() {
    let finalData = this.stageAreas["final"];
    if (!finalData) {
      console.warn("No final stage data. End game or do something else.");
      return;
    }
    let finalTopY = finalData.topY;
    console.log(`Camera pan to final stage topY=${finalTopY}`);

    // 设置边界
    let stageHeight = 750;
    this.physics.world.setBounds(0, finalTopY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, finalTopY, this.map.widthInPixels, stageHeight);

    let newCenterY = finalTopY + this.cameras.main.height / 2;
    let currentCenter = this.cameras.main.midPoint;

    this.cameras.main.stopFollow();
    this.cameras.main.pan(currentCenter.x, newCenterY, 2000, "Linear", false, () => {
      console.log("Reached final stage area. Place Felix & Ralph at final positions or show ending.");

      // 如果 Tiled 中有 "FelixFinal" 图层，就把 Felix 放到那里
      let felixFinalLayer = this.map.getObjectLayer("FelixFinal");
      if (felixFinalLayer && felixFinalLayer.objects.length > 0) {
        let obj = felixFinalLayer.objects[0];
        let fx = obj.x + (obj.width || 0)/2;
        let fy = obj.y + (obj.height || 0)/2;
        this.felix.setPosition(fx, fy);
        console.log(`Felix => final: (${fx}, ${fy})`);
      }

      // 同理，如果有 "RalphFinal" 图层，就把 Ralph 放到那里
      let ralphFinalLayer = this.map.getObjectLayer("RalphFinal");
      if (ralphFinalLayer && ralphFinalLayer.objects.length > 0) {
        let obj = ralphFinalLayer.objects[0];
        let rx = obj.x + (obj.width || 0)/2;
        let ry = obj.y + (obj.height || 0)/2;
        this.ralph.setPosition(rx, ry);
        console.log(`Ralph => final: (${rx}, ${ry})`);
      }

      // 这里可以播放通关动画、显示结束UI等等
    });
  }

  // 在相机滚动结束后，正式切换到 nextStage
  switchToStage(nextStage) {
    // 清理上一关玻璃
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage === this.currentStage) {
        wObj.glasses.forEach(g => g.sprite.destroy());
        delete this.windowsById[key];
      }
    }

    // 加载新关卡玻璃
    this.currentStage = nextStage;
    this.loadGlassForStage(nextStage);

    // 更新 Felix 位置
    let felixLayerName = `FelixStage${nextStage}`;
    let felixLayer = this.map.getObjectLayer(felixLayerName);
    let nextArea = this.stageAreas[nextStage];
    let newX = this.felix.x;
    let newY = (nextArea ? nextArea.topY + 200 : this.felix.y);
    if (felixLayer && felixLayer.objects.length > 0) {
      let randF = Phaser.Math.Between(0, felixLayer.objects.length - 1);
      let fObj = felixLayer.objects[randF];
      newX = fObj.x + (fObj.width || 0) / 2;
      newY = fObj.y + (fObj.height || 0) / 2;
      console.log(`Felix => stage${nextStage}: (${newX}, ${newY})`);
    }
    this.felix.setPosition(newX, newY);

    // 更新 Ralph 位置
    this.tweens.killTweensOf(this.ralph);
    let ralphLayerName = `RalphStage${nextStage}`;
    let rLayer = this.map.getObjectLayer(ralphLayerName);
    if (rLayer && rLayer.objects.length > 0) {
      let rIndex = Phaser.Math.Between(0, rLayer.objects.length - 1);
      let rObj = rLayer.objects[rIndex];
      let rx = rObj.x + (rObj.width || 0) / 2;
      let ry = rObj.y + (rObj.height || 0) / 2;
      this.ralph.setPosition(rx, ry);
      console.log(`Ralph => stage${nextStage}: (${rx}, ${ry})`);
    } else {
      console.warn(`No RalphStage${nextStage} or empty. Keep old pos.`);
    }

    // 加载新的 Felix Positions / StoneDropPosition
    this.loadStageObjectLayers(nextStage);

    // 若需要跟随 Felix，可再次启动跟随
    this.cameras.main.startFollow(this.felix, true, 0.25, 0);
  }

  update(time, delta) {
    if (!this.cursors) return;
    if (this.levelTransitioning || this.isWindowJumping) return;

    this.checkAndRepairWindows(delta);

    if (this.allWindowsRepairedForStage()) {
      console.log(`All windows in Stage ${this.currentStage} repaired => levelTransition().`);
      this.levelTransition();
      return;
    }

    // 平台移动
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
  }

  // 直接修复：破损(1,2) => 0
  checkAndRepairWindows(delta) {
    const REPAIR_DISTANCE = 50;
    const REPAIR_INTERVAL = 100; // 毫秒
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage !== this.currentStage) continue;
      wObj.glasses.forEach(g => {
        if (!g.isBroken) return;
        let dist = Phaser.Math.Distance.Between(
          this.felix.x, this.felix.y,
          g.sprite.x, g.sprite.y
        );
        if (dist < REPAIR_DISTANCE) {
          g.repairTimer += delta;
          if (g.repairTimer >= REPAIR_INTERVAL) {
            g.sprite.setFrame(0);
            g.isBroken = false;
            g.repairTimer = 0;
          }
        } else {
          g.repairTimer = 0;
        }
      });
    }
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
    // 先设置起点
    this.felix.setPosition(fromPos.x, fromPos.y);
    // 做抛物线中点
    let midX = (fromPos.x + toPos.x) / 2;
    let midY = (fromPos.y + toPos.y) / 2 - 50;
    // 上抛
    this.tweens.add({
      targets: this.felix,
      x: midX,
      y: midY,
      duration: 200,
      ease: "Quad.easeOut",
      onComplete: () => {
        // 下落
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
    if (!this.windowPlatforms.length) return null;
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
