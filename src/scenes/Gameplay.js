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
    this.inFinalStage = false; // 标记是否处于最终阶段

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
    // 读取地图和 tileset
    const map = this.make.tilemap({ key: "gameplayMap" });
    this.map = map;
    const tilesetA = map.addTilesetImage("tileset", "tilesetImage");
    const tilesetB = map.addTilesetImage("tileset2", "tileset2Image");

    // 创建各个 Tile Layer
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

    // 音效加载
    this.movementSnd = this.sound.add("movement");
    this.failureSnd = this.sound.add("failure");

    // 设置碰撞
    if (floorLayer) floorLayer.setCollisionByProperty({ collides: true });
    if (this.windowLayerRef) this.windowLayerRef.setCollisionByProperty({ collides: true });

    // 读取每个 Stage 的空间区域（取 Stage X Space 对象层的 topY）
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
    // 读取 Final Stage Space（如果存在）
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

    // 设置相机与物理边界，并将相机初始 scroll 到 Stage 1 区域
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    let stage1Area = this.stageAreas[1];
    if (stage1Area) {
      let stageHeight = 750;
      this.physics.world.setBounds(0, stage1Area.topY, map.widthInPixels, stageHeight);
      this.cameras.main.setBounds(0, stage1Area.topY, map.widthInPixels, stageHeight);
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

    // 读取当前阶段（Stage 1）的专用对象层数据（Felix Positions 和 StoneDropPosition）
    this.loadStageObjectLayers(1);

    // 投石物理组与重叠检测
    this.stones = this.physics.add.group();
    this.physics.add.overlap(this.felix, this.stones, () => {
      if (!this.levelTransitioning) {
        if (!this.failureSnd.isPlaying) {
          this.failureSnd.play();
        }
        this.scene.start("Gameover");
      }
    });
    this.stoneTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: this.throwStones,
      callbackScope: this
    });

    // 键盘输入
    this.cursors = this.input.keyboard.createCursorKeys();
    this.isWindowJumping = false;

    // 加载当前 Stage (1) 的玻璃数据
    this.loadGlassForStage(this.currentStage);
    this.levelTransitioning = false;
  }

  // 加载当前阶段专用的 Felix Positions 与 StoneDropPosition
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

  // 加载指定阶段的玻璃数据
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

      // Stage 1 随机 [0..2]，其它阶段也随机 [0..2]
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
        console.log(`Stage1 had all 0 => forced ${forcedKey} lower glass to frame=2`);
      }
    }
  }

  // 投石：从 Ralph 的位置产生石头，然后 Ralph 移动到当前阶段的 StoneDropPosition
  throwStones() {
    if (this.inFinalStage) return; // 最终阶段不投石
    const pos = { x: this.ralph.x, y: this.ralph.y };
    const stoneVelocity = 150;
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 200, () => {
        this.createStone(pos.x, pos.y, stoneVelocity);
      });
    }
    this.time.delayedCall(3 * 200 + 500, () => {
      this.moveRalphRandom();
    });
  }

  createStone(x, y, velocity = 150) {
    let stone = this.stones.create(x, y, "stone");
    stone.setScale(0.05).setDepth(9998);
    stone.setVelocityY(velocity);
  }

  // Ralph 在当前阶段的 StoneDropPosition 之间移动
  moveRalphRandom() {
    if (this.inFinalStage) return;
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

  // 检查当前阶段所有窗户是否修复完毕
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

  // 关卡切换：实现传送带式滚动，平滑移动相机 scrollY
  levelTransition() {
    this.levelTransitioning = true;
    let nextStage = this.currentStage + 1;
    
    // 如果超过最大阶段，则进入 Final Stage
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
    
    // 获取当前和下一阶段区域数据
    let currentArea = this.stageAreas[this.currentStage];
    let nextArea = this.stageAreas[nextStage];
    if (!currentArea || !nextArea) {
      console.error(`Stage area missing: current=${this.currentStage}, next=${nextStage}`);
      this.levelTransitioning = false;
      return;
    }
    console.log(`Stage ${this.currentStage} repaired => go to Stage ${nextStage}.`);
    
    let stageHeight = 750;
    // 更新物理与摄像机边界到下一阶段区域
    this.physics.world.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    
    // 设定目标 scrollY 值：滚动到下一阶段区域的顶端
    let targetScrollY = nextArea.topY;
    console.log(`Target camera scrollY: ${targetScrollY}`);
    
    // 暂停投石和停止 Ralph 的 tween
    if (this.stoneTimer) {
      this.stoneTimer.paused = true;
    }
    this.tweens.killTweensOf(this.ralph);
    
    // 预加载下一阶段数据
    this.preLoadNextStage(nextStage);
    
    // 停止相机跟随 Felix
    this.cameras.main.stopFollow();
    
    // 使用 tween counter 平滑更新摄像机 scrollY，实现传送带式滚动效果（这里设置20秒滚动）
    this.tweens.addCounter({
      from: this.cameras.main.scrollY,
      to: targetScrollY,
      duration: 20000,
      ease: 'Linear',
      onUpdate: (tween) => {
        let value = tween.getValue();
        this.cameras.main.setScroll(0, value);
      },
      onComplete: () => {
        if (this.stoneTimer) {
          this.stoneTimer.paused = false;
        }
        // 恢复摄像机跟随 Felix
        this.cameras.main.startFollow(this.felix, true, 0.25, 0);
        this.levelTransitioning = false;
      }
    });
  }
  
  // 预加载下一阶段数据（不做摄像机滚动，由 levelTransition 调用）
  preLoadNextStage(nextStage) {
    // 清理当前阶段的玻璃
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage === this.currentStage) {
        wObj.glasses.forEach(g => g.sprite.destroy());
        delete this.windowsById[key];
      }
    }
    // 更新当前阶段并加载下一阶段玻璃
    this.currentStage = nextStage;
    this.loadGlassForStage(nextStage);
    
    // 更新 Felix 位置（读取 "FelixStageX" 对象层）
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
    
    // 更新 Ralph 位置（读取 "RalphStageX" 对象层）
    let rLayer = this.map.getObjectLayer(`RalphStage${nextStage}`);
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
    
    // 加载新阶段专用对象层数据
    this.loadStageObjectLayers(nextStage);
    
    // 更新物理与摄像机边界
    let stageHeight = 750;
    this.physics.world.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
  }
  
  // 切换到 Final Stage：停止 Ralph 的动作，滚动至 Final Stage Space 后3秒跳转到 Gameover
  transitionToFinalStage() {
    let finalData = this.stageAreas["final"];
    if (!finalData) {
      console.warn("No final stage data. End game or do something else.");
      return;
    }
    let finalTopY = finalData.topY;
    console.log(`Camera pan to final stage topY=${finalTopY}`);
    let stageHeight = 750;
    this.physics.world.setBounds(0, finalTopY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, finalTopY, this.map.widthInPixels, stageHeight);
    
    let targetScrollY = finalTopY; // 这里滚动到 Final Stage Space 的顶部
    // 暂停投石和 Ralph 动作
    if (this.stoneTimer) {
      this.stoneTimer.remove();
      this.stoneTimer = null;
    }
    this.tweens.killTweensOf(this.ralph);
    this.cameras.main.stopFollow();
    
    // 使用 tween counter 平滑更新相机 scrollY到 Final Stage（这里设为8秒）
    this.tweens.addCounter({
      from: this.cameras.main.scrollY,
      to: targetScrollY,
      duration: 8000,
      ease: 'Linear',
      onUpdate: (tween) => {
        let value = tween.getValue();
        this.cameras.main.setScroll(0, value);
      },
      onComplete: () => {
        console.log("Reached final stage area.");
        this.inFinalStage = true;
        // 将 Felix 移至 "FelixFinal" 对象层（若存在）
        let felixFinalLayer = this.map.getObjectLayer("FelixFinal");
        if (felixFinalLayer && felixFinalLayer.objects.length > 0) {
          let obj = felixFinalLayer.objects[0];
          let fx = obj.x + (obj.width || 0) / 2;
          let fy = obj.y + (obj.height || 0) / 2;
          this.felix.setPosition(fx, fy);
          console.log(`Felix => final: (${fx}, ${fy})`);
        }
        // 将 Ralph 移至 "RalphFinal" 对象层（若存在）
        let ralphFinalLayer = this.map.getObjectLayer("RalphFinal");
        if (ralphFinalLayer && ralphFinalLayer.objects.length > 0) {
          let obj = ralphFinalLayer.objects[0];
          let rx = obj.x + (obj.width || 0) / 2;
          let ry = obj.y + (obj.height || 0) / 2;
          this.ralph.setPosition(rx, ry);
          console.log(`Ralph => final: (${rx}, ${ry})`);
        }
        // 滚动到 Final Stage 后，等待3秒再进入 Gameover
        this.time.delayedCall(3000, () => {
          this.scene.start("Gameover");
        });
      }
    });
  }

  // 平台移动：窗口移动和跳跃动画
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

  // 直接修复：将破损玻璃直接置为完好（frame 0）
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

  update(time, delta) {
    if (!this.cursors) return;
    if (this.levelTransitioning || this.isWindowJumping) return;

    // 调用修复逻辑
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
  }
}

window.Gameplay = Gameplay;
