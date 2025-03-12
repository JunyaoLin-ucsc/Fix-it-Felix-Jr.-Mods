class Gameplay extends Phaser.Scene {
  constructor() {
    super("Gameplay");
  }

  init() {
    this.currentStage = 1;
    this.maxStage = 5;
    this.levelTransitioning = false;
    this.windowsById = {};
    this.lastStoneDropIndex = null;
    // 初始化移动点数组（若Tiled中没有专用的，每个stage建议都准备好）
    this.ralphMovements = [];

    this.stageRanges = {
      1: { start: 1, end: 26 },
      2: { start: 27, end: 56 },
      3: { start: 57, end: 86 },
      4: { start: 87, end: 116 },
      5: { start: 117, end: 146 }
    };

    // 存储每个 Stage 的区域数据，从 Tiled 中 "Stage X Space" 对象层读取
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

    // 读取 Stage X Space 层，保存 topY
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

    // 摄像机设置，注意此处暂时采用跟随Felix（后续关卡切换时可切换为平滑滚动）
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.felix, true, 0.25, 0);

    // 创建 Ralph
    const ralphLayer = map.getObjectLayer("RalphSpawns");
    let ralphX = 400, ralphY = 100;
    if (ralphLayer && ralphLayer.objects.length > 0) {
      let obj = ralphLayer.objects[0];
      ralphX = obj.x + (obj.width || 0) / 2;
      ralphY = obj.y + (obj.height || 0) / 2;
    }
    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph").setDepth(1000).setScale(0.2);

    // 读取 RalphMovement（请确保当前关卡内的移动点已正确设置）
    // 如果每个关卡有单独的 RalphMovement，请在关卡切换时重新赋值 this.ralphMovements
    this.ralphMovements = [];
    let ralphMoveLayer = map.getObjectLayer("RalphMovement");
    if (ralphMoveLayer && ralphMoveLayer.objects.length > 0) {
      ralphMoveLayer.objects.forEach(o => {
        let rx = o.x + (o.width || 0) / 2;
        this.ralphMovements.push(rx);
      });
    } else {
      console.warn("RalphMovement layer missing or empty. Ralph will not move.");
    }

    // 读取 StoneDropPosition（只读取当前关卡内的StoneDropPosition，如果需要分关卡请自行扩展）
    this.stoneDrops = [];
    let stoneDropLayer = map.getObjectLayer("StoneDropPosition");
    if (stoneDropLayer && stoneDropLayer.objects.length > 0) {
      stoneDropLayer.objects.forEach(o => {
        let sx = o.x + (o.width || 0) / 2;
        let sy = o.y + (o.height || 0) / 2;
        this.stoneDrops.push({ x: sx, y: sy });
      });
    } else {
      console.warn("StoneDropPosition layer missing or empty.");
    }

    // 重叠检测：当 Felix 被石头砸到时触发失败音效，并进入 Gameover 场景
    this.stones = this.physics.add.group();
    this.physics.add.overlap(this.felix, this.stones, () => {
      if (!this.levelTransitioning) {
        if (!this.failureSnd.isPlaying) {
          this.failureSnd.play();
        }
        this.scene.start("Gameover");
      }
    });
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: this.throwStones,
      callbackScope: this
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.windowPlatforms = [];
    let layerObj = map.getObjectLayer("Felix Positions");
    if (layerObj && layerObj.objects.length > 0) {
      layerObj.objects.forEach(obj => {
        let px = obj.x + obj.width / 2;
        let py = obj.y + obj.height / 2;
        this.windowPlatforms.push({ x: px, y: py });
      });
    } else {
      console.warn("Felix Positions layer missing or empty.");
    }
    this.isWindowJumping = false;

    this.loadGlassForStage(this.currentStage);
    this.levelTransitioning = false;
  }

  loadGlassForStage(stage) {
    let range = this.stageRanges[stage];
    if (!range) return;
    // 对于每个玻璃窗，随机分配帧 0、1、2（0为修复完好，1、2为破损状态）
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
      // 随机分配 0,1,2 其中 0 表示完好（不破损），1和2表示破损
      let frameLower = Phaser.Math.Between(0, 2);
      let frameUpper = Phaser.Math.Between(0, 2);
      lowerSprite.setFrame(frameLower);
      upperSprite.setFrame(frameUpper);
      this.windowsById[key] = {
        stage: stage,
        glasses: [
          { sprite: lowerSprite, isBroken: frameLower !== 0, repairTimer: 0 },
          { sprite: upperSprite, isBroken: frameUpper !== 0, repairTimer: 0 }
        ]
      };
    }
  }

  throwStones() {
    // 在当前关卡内寻找与 Ralph 足够接近的投石点
    let closeDrops = this.stoneDrops.filter(pos => {
      return (Math.abs(pos.x - this.ralph.x) < 5 && Math.abs(pos.y - this.ralph.y) < 5);
    });
    let pos;
    if (closeDrops.length > 0) {
      let idx, tries = 0;
      do {
        idx = Phaser.Math.Between(0, closeDrops.length - 1);
        tries++;
      } while (idx === this.lastStoneDropIndex && closeDrops.length > 1 && tries < 10);
      this.lastStoneDropIndex = idx;
      pos = closeDrops[idx];
    } else {
      // 如果找不到，则退化为在 Ralph 附近创建石头
      pos = { x: this.ralph.x, y: this.ralph.y };
    }
    // 确保石头与 Ralph 贴图重合
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

  moveRalphRandom() {
    if (!this.ralphMovements || this.ralphMovements.length === 0) return;
    let idx = Phaser.Math.Between(0, this.ralphMovements.length - 1);
    let targetX = this.ralphMovements[idx];
    let currentY = this.ralph.y; // 只左右移动
    this.tweens.killTweensOf(this.ralph);
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

  // 关卡切换：使用 stageAreas 中读取的 topY 值来计算摄像机与物理世界的新边界，
  // 并在切换时更新 Felix 与 Ralph 的位置（从各自的 Stage 对象层中随机选取）
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
  
    // 更新物理世界与摄像机边界到下一关区域
    let stageHeight = 750; // 固定高度
    this.physics.world.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
  
    // 更新 Felix 位置：读取 "FelixStageN" 对象层（若存在）
    let felixLayerName = `FelixStage${nextStage}`;
    let felixLayer = this.map.getObjectLayer(felixLayerName);
    let newX = this.felix.x;
    let newY = nextArea.topY + 200; // 默认位置
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
  
    // 更新 Ralph 位置：读取 "RalphStageN" 对象层（若存在）
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
  
    // 清理上一关的玻璃，并加载下一关的玻璃
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage === this.currentStage) {
        wObj.glasses.forEach(g => g.sprite.destroy());
        delete this.windowsById[key];
      }
    }
    this.currentStage = nextStage;
    this.loadGlassForStage(nextStage);
  
    // 摄像机重新跟随 Felix
    this.cameras.main.startFollow(this.felix, true, 0.25, 0);
    this.levelTransitioning = false;
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
    const REPAIR_INTERVAL = 100; // 单位毫秒
    for (let key in this.windowsById) {
      let wObj = this.windowsById[key];
      if (wObj.stage !== this.currentStage) continue;
      wObj.glasses.forEach(g => {
        if (!g.isBroken) return;
        let dist = Phaser.Math.Distance.Between(this.felix.x, this.felix.y, g.sprite.x, g.sprite.y);
        if (dist < REPAIR_DISTANCE) {
          g.repairTimer += delta;
          if (g.repairTimer >= REPAIR_INTERVAL) {
            // 直接将修复状态设为完好（frame 0）  
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
    // 播放 movement 音效，重启当前音效播放（防止重叠）
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
