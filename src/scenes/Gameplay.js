// Gameplay.js

class Gameplay extends Phaser.Scene {
  constructor() {
    super("Gameplay");
  }

  init() {
    this.currentStage = 1;
    this.maxStage = 5;
    this.levelTransitioning = false;
    this.windowsById = {};

    // 若你想限制 Ralph 不再移动到其他 Stage 的 dropPosition，可在 throwStones() 或 moveRalphRandom() 中加判断
    this.lastStoneDropIndex = null;

    // 每关玻璃的编号区间
    this.stageRanges = {
      1: { start: 1, end: 26 },
      2: { start: 27, end: 56 },
      3: { start: 57, end: 86 },
      4: { start: 87, end: 116 },
      5: { start: 117, end: 146 }
    };

    // 记录 "Stage X Space" / "Final Space" 信息
    this.stageAreas = {};
  }

  preload() {
    this.load.path = "./assets/";

    // 加载地图 & 贴图
    this.load.tilemapTiledJSON("gameplayMap", "Gameplay.json");
    this.load.image("tilesetImage", "tileset.png");
    this.load.image("tileset2Image", "tileset2.png");

    // Felix, Ralph, stone
    this.load.image("Felix", "Felix.png");
    this.load.image("Ralph", "Ralph.png");
    this.load.image("stone", "stone.png");

    // 玻璃 spritesheet
    this.load.spritesheet("glassSheet", "Glass-Sheet.png", {
      frameWidth: 32,
      frameHeight: 32
    });

    // 音效
    this.load.audio("movement", "movement.wav");
    this.load.audio("failure", "failure.wav");
  }

  create() {
    // ---------------- 读取地图 ----------------
    const map = this.make.tilemap({ key: "gameplayMap" });
    this.map = map;
    const tilesetA = map.addTilesetImage("tileset", "tilesetImage");
    const tilesetB = map.addTilesetImage("tileset2", "tileset2Image");

    // 创建 Tile Layer
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

    // 碰撞
    if (floorLayer) floorLayer.setCollisionByProperty({ collides: true });
    if (this.windowLayerRef) this.windowLayerRef.setCollisionByProperty({ collides: true });

    // 音效
    this.movementSnd = this.sound.add("movement");
    this.failureSnd = this.sound.add("failure");

    // 读取 "Stage X Space" 与 "Final Space"
    for (let s = 1; s <= this.maxStage; s++) {
      let layerName = "Stage " + s + " Space";
      let spaceLayer = map.getObjectLayer(layerName);
      if (spaceLayer && spaceLayer.objects.length > 0) {
        let obj = spaceLayer.objects[0];
        this.stageAreas[s] = { topY: obj.y };
        console.log(`Stage ${s} => topY=${obj.y}`);
      } else {
        console.warn(`Stage ${s} Space layer missing or empty.`);
      }
    }
    // 如果你有 Final Stage / Final Space
    let finalLayer = map.getObjectLayer("Final Space");
    if (finalLayer && finalLayer.objects.length > 0) {
      let obj = finalLayer.objects[0];
      this.stageAreas["final"] = { topY: obj.y };
      console.log(`Final Stage => topY=${obj.y}`);
    }

    // 创建 Felix
    let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawns");
    let spawnX = felixSpawn ? felixSpawn.x : 400;
    let spawnY = felixSpawn ? felixSpawn.y : 300;
    this.felix = this.physics.add.sprite(spawnX, spawnY, "Felix").setScale(0.1).setDepth(9999);
    this.felix.setCollideWorldBounds(true);

    // 调整 Felix 碰撞体
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

    // 创建相机 & 世界边界
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 相机跟随 Felix
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

    // 如果你想让 Ralph 在每个 Stage 都有自己单独的落点，需要在 resetFelixAndRalphForStage() 中处理

    // StoneDropPosition => 全局
    this.stoneDrops = [];
    let stoneDropLayer = map.getObjectLayer("StoneDropPosition");
    if (stoneDropLayer) {
      stoneDropLayer.objects.forEach(o => {
        let sx = o.x + (o.width || 0) / 2;
        let sy = o.y + (o.height || 0) / 2;
        this.stoneDrops.push({ x: sx, y: sy });
      });
    }

    // 物理组：石头
    this.stones = this.physics.add.group();
    this.physics.add.overlap(this.felix, this.stones, () => {
      if (!this.levelTransitioning) {
        // 播放 failure 音效
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

    // 读输入
    this.cursors = this.input.keyboard.createCursorKeys();

    // Felix Positions
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

    // 加载 Stage 1 玻璃
    this.loadGlassForStage(this.currentStage);

    this.levelTransitioning = false;
  }

  // 随机给玻璃 1/2 帧 => 表示破损，需要修复
  loadGlassForStage(stage) {
    let range = this.stageRanges[stage];
    if (!range) return;
    for (let num = range.start; num <= range.end; num += 2) {
      let windowId = Math.floor((num - range.start) / 2) + 1;
      let key = `${stage}_${windowId}`;
      let lowerLayer = this.map.getObjectLayer("Glass " + num);
      let upperLayer = this.map.getObjectLayer("Glass " + (num + 1));

      if (!lowerLayer || lowerLayer.objects.length === 0) continue;
      if (!upperLayer || upperLayer.objects.length === 0) continue;

      let objLower = lowerLayer.objects[0];
      let objUpper = upperLayer.objects[0];
      let gxLower = objLower.x + objLower.width / 2;
      let gyLower = objLower.y + objLower.height / 2;
      let gxUpper = objUpper.x + objUpper.width / 2;
      let gyUpper = objUpper.y + objUpper.height / 2;

      let lowerSprite = this.add.sprite(gxLower, gyLower, "glassSheet").setDepth(this.windowLayerRef.depth + 1);
      let upperSprite = this.add.sprite(gxUpper, gyUpper, "glassSheet").setDepth(this.windowLayerRef.depth + 1);

      // 若你想 0/1/2 随机 => 改成 Phaser.Math.Between(0,2)
      let rndFrameL = Phaser.Math.Between(1, 2);
      let rndFrameU = Phaser.Math.Between(1, 2);

      lowerSprite.setFrame(rndFrameL);
      upperSprite.setFrame(rndFrameU);

      this.windowsById[key] = {
        stage: stage,
        glasses: [
          { sprite: lowerSprite, isBroken: true, repairTimer: 0 },
          { sprite: upperSprite, isBroken: true, repairTimer: 0 }
        ]
      };
    }
  }

  // Ralph 投石逻辑
  throwStones() {
    // 先找与 Ralph 足够接近的投石点
    let closeDrops = this.stoneDrops.filter(pos => {
      return (Math.abs(pos.x - this.ralph.x) < 5 && Math.abs(pos.y - this.ralph.y) < 5);
    });

    let pos;
    if (closeDrops.length > 0) {
      // 避免连续同一个点
      let idx, tries = 0;
      do {
        idx = Phaser.Math.Between(0, closeDrops.length - 1);
        tries++;
      } while (idx === this.lastStoneDropIndex && closeDrops.length > 1 && tries < 10);

      this.lastStoneDropIndex = idx;
      pos = closeDrops[idx];

    } else {
      // 没有重合 => 退化
      pos = { x: this.ralph.x, y: this.ralph.y };
    }

    // 连续扔3块石头
    const stoneVelocity = 150;
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 200, () => {
        this.createStone(pos.x, pos.y, stoneVelocity);
      });
    }

    // 扔完石头后，move
    this.time.delayedCall(3 * 200 + 500, () => {
      this.moveRalphRandom();
    });
  }

  createStone(x, y, velocity = 150) {
    let stone = this.stones.create(x, y, "stone");
    stone.setScale(0.05).setDepth(9998);
    stone.setVelocityY(velocity);
  }

  // Ralph 在当前 Stage 内随机左右移动
  moveRalphRandom() {
    // 这里仅仅演示 => 全局 ralphMovements
    // 若要限制在当前 Stage，可再做判断
    if (!this.ralphMovements.length) return;

    let idx = Phaser.Math.Between(0, this.ralphMovements.length - 1);
    let targetX = this.ralphMovements[idx];
    let currentY = this.ralph.y;

    this.tweens.killTweensOf(this.ralph);
    this.tweens.add({
      targets: this.ralph,
      x: targetX,
      y: currentY,
      duration: 500,
      ease: "Linear"
    });
  }

  // 判断当前关卡的玻璃是否全部修好
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

  // 关卡切换 + Final Stage
  levelTransition() {
    this.levelTransitioning = true;

    let nextStage = this.currentStage + 1;
    // 如果超出 maxStage => Final Stage
    if (nextStage > this.maxStage) {
      // 检查是否有 Final Space
      let finalArea = this.stageAreas["final"];
      if (!finalArea) {
        console.warn("No Final Stage Space found. Stop transition.");
        this.levelTransitioning = false;
        return;
      }
      console.log("All normal stages done => go to Final Stage.");

      // 暂停 5 秒
      this.time.delayedCall(5000, () => {
        // 相机滚动到 finalArea.topY + 400
        let cam = this.cameras.main;
        cam.stopFollow();

        let fromX = cam.midPoint.x;
        let fromY = cam.midPoint.y;
        let targetX = fromX;
        let targetY = finalArea.topY + 400; // 你可调

        cam.pan(targetX, targetY, 2000, "Linear", false, () => {
          console.log("Arrived Final Stage, you can load final cutscene, etc.");
          this.levelTransitioning = false;
        });
      });
      return;
    }

    // 否则，切到普通 Stage
    console.log(`All windows in Stage ${this.currentStage} repaired => stage ${nextStage}`);
    let currentArea = this.stageAreas[this.currentStage];
    let nextArea = this.stageAreas[nextStage];
    if (!nextArea) {
      console.error(`No stage area for stage ${nextStage}`);
      this.levelTransitioning = false;
      return;
    }

    // 暂停 5 秒
    this.time.delayedCall(5000, () => {
      // 相机滚动
      this.cameras.main.stopFollow();
      let cam = this.cameras.main;
      let fromX = cam.midPoint.x;
      let fromY = cam.midPoint.y;

      let targetX = fromX;
      let targetY = nextArea.topY + 400; // 视情况调整

      cam.pan(targetX, targetY, 2000, "Linear", false, () => {
        // 滚动结束 => 清理旧玻璃
        for (let key in this.windowsById) {
          let wObj = this.windowsById[key];
          if (wObj.stage === this.currentStage) {
            wObj.glasses.forEach(g => g.sprite.destroy());
            delete this.windowsById[key];
          }
        }

        // 切换 stage
        this.currentStage = nextStage;
        this.loadGlassForStage(nextStage);

        // 重置角色位置
        this.resetFelixAndRalphForStage(nextStage);

        // 重新跟随
        cam.startFollow(this.felix, true, 0.25, 0);
        this.levelTransitioning = false;
      });
    });
  }

  /**
   * 根据 "FelixStageN" / "RalphStageN" 对象层随机放置角色
   */
  resetFelixAndRalphForStage(stage) {
    // Felix
    let felixLayerName = `FelixStage${stage}`;
    let felixLayer = this.map.getObjectLayer(felixLayerName);
    if (felixLayer && felixLayer.objects.length > 0) {
      let randF = Phaser.Math.Between(0, felixLayer.objects.length - 1);
      let fObj = felixLayer.objects[randF];
      this.felix.setPosition(fObj.x + (fObj.width || 0)/2, fObj.y + (fObj.height || 0)/2);
      console.log(`Felix => stage${stage}: (${this.felix.x}, ${this.felix.y})`);
    }

    // Ralph
    let ralphLayerName = `RalphStage${stage}`;
    let spawnLayer = this.map.getObjectLayer(ralphLayerName);
    if (spawnLayer && spawnLayer.objects.length > 0) {
      let randR = Phaser.Math.Between(0, spawnLayer.objects.length - 1);
      let rObj = spawnLayer.objects[randR];
      this.ralph.setPosition(rObj.x + (rObj.width || 0)/2, rObj.y + (rObj.height || 0)/2);
      console.log(`Ralph => stage${stage}: (${this.ralph.x}, ${this.ralph.y})`);
    }
  }

  update(time, delta) {
    if (!this.cursors) return;
    if (this.levelTransitioning || this.isWindowJumping) return;

    // 检测修复
    this.checkAndRepairWindows(delta);

    // 若本关全部修好 => 切关
    if (this.allWindowsRepairedForStage()) {
      this.levelTransition();
      return;
    }

    // Felix 移动
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
    const REPAIR_INTERVAL = 100; // 0.1秒就修好 => 你可改成1000
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
            // 若想直接从帧2/1 => 0，可注释下面判断
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

  // Felix 移动 / 跳跃
  doWindowMoveTween(targetIndex) {
    this.isWindowJumping = true;
    // 播放音效
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

  // 找到与 Felix 最近的平台
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
