class Gameplay extends Phaser.Scene {
  constructor() {
    super("Gameplay");
  }

  init() {
    this.currentStage = 1;
    this.maxStage = 5;
    this.levelTransitioning = false;
    this.windowsById = {};

    this.stageRanges = {
      1: { start: 1, end: 26 },
      2: { start: 27, end: 56 },
      3: { start: 57, end: 86 },
      4: { start: 87, end: 116 },
      5: { start: 117, end: 146 }
    };

    // 读取 Tiled 中 "Stage X Space" 对象层信息
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
    // ----- 地图 & 图层 -----
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

    // 读取 Stage X Space: topY = obj.y
    for (let s = 1; s <= this.maxStage; s++) {
      let layerName = "Stage " + s + " Space";
      let spaceLayer = map.getObjectLayer(layerName);
      if (spaceLayer && spaceLayer.objects.length > 0) {
        let obj = spaceLayer.objects[0];
        let topY = obj.y;
        this.stageAreas[s] = { topY };
        console.log(`Stage ${s}: topY=${topY}`);
      } else {
        console.warn(`Stage ${s} Space layer missing or empty.`);
      }
    }

    // ----- Felix -----
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

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.felix, true, 0.25, 0);

    // ----- Ralph -----
    const ralphLayer = map.getObjectLayer("RalphSpawns");
    let ralphX = 400, ralphY = 100;
    if (ralphLayer && ralphLayer.objects.length > 0) {
      let obj = ralphLayer.objects[0];
      ralphX = obj.x + (obj.width || 0) / 2;
      ralphY = obj.y + (obj.height || 0) / 2;
    }
    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph").setDepth(1000).setScale(0.2);

    // RalphMovement: 全局 X 坐标（同一张地图）
    this.ralphMovements = [];
    let ralphMoveLayer = map.getObjectLayer("RalphMovement");
    if (ralphMoveLayer) {
      ralphMoveLayer.objects.forEach(o => {
        let rx = o.x + (o.width || 0) / 2;
        let ry = o.y + (o.height || 0) / 2;
        // 将 y 也存起来，以便过滤当前 stage
        this.ralphMovements.push({ x: rx, y: ry });
      });
    }

    // StoneDropPosition: 全局
    this.stoneDrops = [];
    let stoneDropLayer = map.getObjectLayer("StoneDropPosition");
    if (stoneDropLayer) {
      stoneDropLayer.objects.forEach(o => {
        let sx = o.x + (o.width || 0) / 2;
        let sy = o.y + (o.height || 0) / 2;
        this.stoneDrops.push({ x: sx, y: sy });
      });
    }

    // stones group
    this.stones = this.physics.add.group();
    this.physics.add.overlap(this.felix, this.stones, () => {
      if (!this.levelTransitioning) {
        if (!this.failureSnd.isPlaying) {
          this.failureSnd.play();
        }
        this.scene.start("Gameover");
      }
    });

    // 不再用定时器扔石头，改为自定义循环
    // this.time.addEvent({ ... }) // <- 删除

    this.cursors = this.input.keyboard.createCursorKeys();
    this.windowPlatforms = [];
    let layerObj = map.getObjectLayer("Felix Positions");
    if (layerObj) {
      layerObj.objects.forEach(obj => {
        let px = obj.x + obj.width / 2;
        let py = obj.y + obj.height / 2;
        this.windowPlatforms.push({ x: px, y: py });
      });
    }
    this.isWindowJumping = false;

    // 加载当前关卡的玻璃
    this.loadGlassForStage(this.currentStage);

    this.levelTransitioning = false;

    // 启动 Ralph 行为循环：随机移动 -> 停下 -> 投石 -> 重复
    this.startRalphBehavior();
  }

  // ========== 让 Ralph 在当前Stage内随机移动，然后扔石头，然后重复 ==========
  startRalphBehavior() {
    if (this.levelTransitioning) return; // 切换关卡时不操作

    // 先获取当前Stage内的Movement点
    let area = this.stageAreas[this.currentStage];
    if (!area) {
      // 若找不到当前Stage区域，暂时不移动
      console.warn("No stage area for currentStage=", this.currentStage);
      return;
    }
    let stageTop = area.topY;
    let stageHeight = 750; // 假设每关750
    let validMovements = this.ralphMovements.filter(pos => {
      return (pos.y >= stageTop && pos.y < (stageTop + stageHeight));
    });
    if (validMovements.length === 0) {
      // 没有可用点就不动
      console.warn("No ralphMovements in current stage area, do nothing.");
      return;
    }

    // 随机选一个点
    let randIdx = Phaser.Math.Between(0, validMovements.length - 1);
    let targetPos = validMovements[randIdx];

    // 移动 Ralph 到该点
    this.tweens.killTweensOf(this.ralph); // 先清除旧Tween
    this.tweens.add({
      targets: this.ralph,
      x: targetPos.x,
      y: targetPos.y,
      duration: 600,
      ease: "Linear",
      onComplete: () => {
        // 到达后，扔石头
        this.throwStonesAtCurrentRalphPos();
      }
    });
  }

  // ========== 在 Ralph 当前坐标扔石头，然后再次调用 startRalphBehavior() ==========
  throwStonesAtCurrentRalphPos() {
    // 只在当前stage内投石：获取Ralph当前位置
    let rx = this.ralph.x;
    let ry = this.ralph.y;

    // 3块石头，间隔200ms
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 200, () => {
        this.createStone(rx, ry, 150);
      });
    }

    // 扔完石头后，延时再移动
    this.time.delayedCall(3 * 200 + 500, () => {
      // 若关卡没变，则继续循环
      if (!this.levelTransitioning) {
        this.startRalphBehavior();
      }
    });
  }

  createStone(x, y, velocity = 150) {
    let stone = this.stones.create(x, y, "stone");
    stone.setScale(0.05).setDepth(9998);
    stone.setVelocityY(velocity);
  }

  // ========== 加载玻璃：每扇窗的两块玻璃随机frame(0,1,2) ==========
  loadGlassForStage(stage) {
    let range = this.stageRanges[stage];
    if (!range) return;
    for (let num = range.start; num <= range.end; num += 2) {
      let windowId = Math.floor((num - range.start) / 2) + 1;
      let key = `${stage}_${windowId}`;
      let lowerLayer = this.map.getObjectLayer("Glass " + num);
      let upperLayer = this.map.getObjectLayer("Glass " + (num + 1));
      if (!lowerLayer || lowerLayer.objects.length === 0) {
        console.warn(`Glass ${num} layer missing or empty.`);
        continue;
      }
      if (!upperLayer || upperLayer.objects.length === 0) {
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

      // 改为随机0,1,2 => 0(完好) or 1,2(破损)
      let rndFrameLower = Phaser.Math.Between(0, 2);
      let rndFrameUpper = Phaser.Math.Between(0, 2);
      lowerSprite.setFrame(rndFrameLower);
      upperSprite.setFrame(rndFrameUpper);

      this.windowsById[key] = {
        stage: stage,
        glasses: [
          { sprite: lowerSprite, isBroken: (rndFrameLower > 0), repairTimer: 0 },
          { sprite: upperSprite, isBroken: (rndFrameUpper > 0), repairTimer: 0 }
        ]
      };
    }
  }

  // 原本 moveRalphRandom 已经不需要，可以留着不改也行
  moveRalphRandom() {
    if (!this.ralphMovements.length) return;
    let idx = Phaser.Math.Between(0, this.ralphMovements.length - 1);
    let targetX = this.ralphMovements[idx].x;  // 记得加.x
    let currentY = this.ralph.y;
    this.tweens.add({
      targets: this.ralph,
      x: targetX,
      y: currentY,
      duration: 500,
      ease: "Linear"
    });
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

  // 不改关卡切换函数
  levelTransition() {
    this.levelTransitioning = true;
  
    let nextStage = this.currentStage + 1;
    if (nextStage > this.maxStage) {
      console.log("All stages done! game finished!");
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
  
    console.log(`Transition from stage=${this.currentStage} -> ${nextStage}`);
  
    let stageHeight = 750;
    this.physics.world.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
  
    let felixLayerName = `FelixStage${nextStage}`;
    let felixLayer = this.map.getObjectLayer(felixLayerName);
    let newX = this.felix.x;
    let newY = nextArea.topY + 200;
    if (felixLayer && felixLayer.objects.length > 0) {
      let randF = Phaser.Math.Between(0, felixLayer.objects.length - 1);
      let fObj = felixLayer.objects[randF];
      newX = fObj.x + (fObj.width || 0) / 2;
      newY = fObj.y + (fObj.height || 0) / 2;
      console.log(`Random Felix spawn from layer ${felixLayerName} => (${newX},${newY})`);
    } else {
      console.warn(`No layer "${felixLayerName}" or empty. Using fallback => (${newX}, ${newY})`);
    }
    this.felix.setPosition(newX, newY);
  
    this.tweens.killTweensOf(this.ralph);
  
    let ralphLayerName = `RalphStage${nextStage}`;
    let spawnLayer = this.map.getObjectLayer(ralphLayerName);
    if (spawnLayer && spawnLayer.objects.length > 0) {
      let randomIndex = Phaser.Math.Between(0, spawnLayer.objects.length - 1);
      let rObj = spawnLayer.objects[randomIndex];
      let rx = rObj.x + (rObj.width || 0) / 2;
      let ry = rObj.y + (rObj.height || 0) / 2;
      this.ralph.setPosition(rx, ry);
      console.log(`Move Ralph to stage ${nextStage} => (${rx}, ${ry})`);
    } else {
      console.warn(`No layer "${ralphLayerName}" or no objects, keep Ralph old pos.`);
    }
  
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage === this.currentStage) {
        wObj.glasses.forEach(g => g.sprite.destroy());
        delete this.windowsById[key];
      }
    }
    this.currentStage = nextStage;
    this.loadGlassForStage(nextStage);
  
    this.cameras.main.startFollow(this.felix, true, 0.25, 0);
  
    this.levelTransitioning = false;

    // 切换完关卡后，重新启动 Ralph 行为
    this.startRalphBehavior();
  }
  
  update(time, delta) {
    if (!this.cursors) return;
    if (this.levelTransitioning || this.isWindowJumping) return;

    this.checkAndRepairWindows(delta);

    if (this.allWindowsRepairedForStage()) {
      console.log(`All windows in Stage ${this.currentStage} repaired. Trigger levelTransition().`);
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

  checkAndRepairWindows(delta) {
    const REPAIR_DISTANCE = 50;
    const REPAIR_INTERVAL = 100;
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage !== this.currentStage) continue;
      wObj.glasses.forEach(g => {
        if (!g.isBroken) return;
        let dist = Phaser.Math.Distance.Between(this.felix.x, this.felix.y, g.sprite.x, g.sprite.y);
        if (dist < REPAIR_DISTANCE) {
          g.repairTimer += delta;
          if (g.repairTimer >= REPAIR_INTERVAL) {
            let currentFrame = parseInt(g.sprite.frame.name, 10);
            if (currentFrame === 2) {
              g.sprite.setFrame(1);
            } else {
              g.sprite.setFrame(0);
              g.isBroken = false;
            }
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
