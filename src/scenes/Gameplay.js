class Gameplay extends Phaser.Scene {
  constructor() {
    super("Gameplay");
  }

  preload() {
    this.load.path = "./assets/";

    // 加载地图 JSON + 两个 tileset
    this.load.tilemapTiledJSON("gameplayMap", "Gameplay.json");
    this.load.image("tilesetImage", "tileset.png");
    this.load.image("tileset2Image", "tileset2.png");

    // 加载角色和物体
    this.load.image("Felix", "Felix.png");
    this.load.image("Ralph", "Ralph.png");
    this.load.image("stone", "stone.png");

    // 请按实际帧大小调整，此处假设每帧32x32
    this.load.spritesheet("glassSheet", "Glass-Sheet.png", {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    // ========== 你已有的逻辑 ==========

    const map = this.make.tilemap({ key: "gameplayMap" });
    const tilesetA = map.addTilesetImage("tileset", "tilesetImage");
    const tilesetB = map.addTilesetImage("tileset2", "tileset2Image");

    const mainBackgroundLayer = map.createLayer("MainBackground", [tilesetA, tilesetB], 0, 0).setDepth(0);
    const grassLayer = map.createLayer("Grass", [tilesetA, tilesetB], 0, -32).setDepth(1);
    const houseLayer = map.createLayer("House", [tilesetA, tilesetB], 0, -32).setDepth(2);
    const streetLampLayer = map.createLayer("Street Lamp", [tilesetA, tilesetB], 0, -32).setDepth(3);

    const floorLayer = map.createLayer("Floor", [tilesetA, tilesetB], 0, 0).setDepth(4);
    const ladderLayer = map.createLayer("Ladder", [tilesetA, tilesetB], 0, 0).setDepth(5);
    const pillerLayer = map.createLayer("Pillar", [tilesetA, tilesetB], 0, 0).setDepth(6);
    const wallPaintLayer = map.createLayer("Wall Paint", [tilesetA, tilesetB], 0, 0).setDepth(7);
    const redBrickLayer = map.createLayer("Red Brick", [tilesetA, tilesetB], 0, 0).setDepth(8);
    const supportLayer = map.createLayer("Support", [tilesetA, tilesetB], 0, 0).setDepth(9);

    const floorGrassLayer = map.createLayer("Floor Grass", [tilesetA, tilesetB], 0, 0).setDepth(13);
    const windowLayer = map.createLayer("Window", [tilesetA, tilesetB], 0, 0).setDepth(12);
    const doorLayer = map.createLayer("Door", [tilesetA, tilesetB], 0, 0).setDepth(11);

    if (floorLayer) floorLayer.setCollisionByProperty({ collides: true });
    if (windowLayer) windowLayer.setCollisionByProperty({ collides: true });

    // === 创建 Felix ===
    let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawns");
    this.felix = this.physics.add.sprite(felixSpawn.x, felixSpawn.y, "Felix").setScale(0.1);

    this.time.delayedCall(0, () => {
      const displayW = this.felix.displayWidth;
      const displayH = this.felix.displayHeight;
      const bodyW = displayW * 10;
      const bodyH = displayH * 10;
      const offsetX = bodyW * 0.08;
      const offsetY = bodyH * 0.02;
      this.felix.body.setSize(bodyW, bodyH);
      this.felix.body.setOffset(offsetX, offsetY);
    });
    this.felix.setCollideWorldBounds(true);
    this.felix.setDepth(9999);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.felix, true, 0.25, 0);

    this.physics.add.collider(this.felix, floorLayer);
    this.physics.add.collider(this.felix, doorLayer);
    this.physics.add.collider(this.felix, floorGrassLayer);
    this.physics.add.collider(this.felix, windowLayer);

    // === Ralph
    const ralphLayer = map.getObjectLayer("RalphSpawns");
    let ralphX = 400, ralphY = 100;
    if (ralphLayer && ralphLayer.objects.length > 0) {
      let obj = ralphLayer.objects[0];
      ralphX = obj.x + (obj.width || 0)/2;
      ralphY = obj.y + (obj.height || 0)/2;
    }
    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph").setDepth(1000).setScale(0.20);

    // =========== "RalphMovement" 只存X坐标(保持Y不变) ===========
    this.ralphMovements = [];
    let ralphMoveLayer = map.getObjectLayer("RalphMovement");
    if (ralphMoveLayer) {
      ralphMoveLayer.objects.forEach(o => {
        let rx = o.x + (o.width || 0)/2;
        this.ralphMovements.push(rx);
      });
    }

    // =========== "StoneDropPosition" => 石头下落点 ===========
    this.stoneDrops = [];
    let stoneDropLayer = map.getObjectLayer("StoneDropPosition");
    if (stoneDropLayer) {
      stoneDropLayer.objects.forEach(o => {
        let sx = o.x + (o.width || 0)/2;
        let sy = o.y + (o.height || 0)/2;
        this.stoneDrops.push({ x: sx, y: sy });
      });
    }

    // === 投石逻辑
    this.stones = this.physics.add.group({});
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        let closeDrops = this.stoneDrops.filter(pos => {
          return (Math.abs(pos.x - this.ralph.x) < 5 && Math.abs(pos.y - this.ralph.y) < 5);
        });
        if (closeDrops.length > 0) {
          let idx = Phaser.Math.Between(0, closeDrops.length - 1);
          let pos = closeDrops[idx];
          this.createStone(pos.x, pos.y);
        } else {
          let stoneX = this.ralph.x + Phaser.Math.Between(-30, 30);
          let stoneY = this.ralph.y + 20;
          this.createStone(stoneX, stoneY);
        }
      }
    });
    this.physics.add.overlap(this.felix, this.stones, () => {
      this.scene.start("Gameover");
    });

    if (this.ralphMovements.length > 0) {
      this.time.addEvent({
        delay: 3000,
        loop: true,
        callback: this.moveRalphRandom,
        callbackScope: this
      });
    }

    // === 捕获方向键
    this.cursors = this.input.keyboard.createCursorKeys();

    // === 读取“Felix Positions”层 => Felix移动
    this.windowPlatforms = [];
    const layerObj = map.getObjectLayer("Felix Positions");
    if (layerObj) {
      layerObj.objects.forEach(obj => {
        let px = obj.x + obj.width / 2;
        let py = obj.y + obj.height / 2;
        this.windowPlatforms.push({ x: px, y: py });
      });
    }
    this.isWindowJumping = false;

    // =========== 读取 "GlassPosition" => 多个窗口，每窗2块玻璃 ===========
    // 建立一个 Map: windowId => { windowId, glasses:[], centerX, centerY, repairTimer }
    this.windowsById = {};
    let glassLayer = map.getObjectLayer("GlassPosition");
    if (glassLayer) {
      glassLayer.objects.forEach(obj => {
        let gx = obj.x + obj.width / 2;
        let gy = obj.y + obj.height / 2;
        // 读取 windowId (假设在 Tiled 中，每个玻璃对象都有 property "windowId")
        let wId = 0;
        if (obj.properties) {
          let prop = obj.properties.find(p => p.name === "windowId");
          if (prop) {
            wId = prop.value;
          }
        }
        if (!this.windowsById[wId]) {
          this.windowsById[wId] = {
            windowId: wId,
            glasses: [],
            repairTimer: 0
          };
        }
        let wObj = this.windowsById[wId];
        let glassSprite = this.add.sprite(gx, gy, "glassSheet");
        // 让玻璃显示在 windowLayer 上方
        glassSprite.setDepth(windowLayer.depth + 1);
        // 随机帧：0完好，1或2破损
        let rndFrame = Phaser.Math.Between(0, 2);
        glassSprite.setFrame(rndFrame);
        glassSprite.isBroken = (rndFrame > 0);
        wObj.glasses.push(glassSprite);
      });
    }
    // 计算每个窗户的 centerX, centerY（所有玻璃的平均值）
    for (let wId in this.windowsById) {
      let wObj = this.windowsById[wId];
      let sumX = 0, sumY = 0, count = 0;
      wObj.glasses.forEach(gspr => {
        sumX += gspr.x;
        sumY += gspr.y;
        count++;
      });
      wObj.centerX = sumX / count;
      wObj.centerY = sumY / count;
    }
  }

  // ============== 生成石头 ==============
  createStone(x, y) {
    let stone = this.stones.create(x, y, "stone");
    stone.setScale(0.05);
    stone.setDepth(9998);
    stone.setVelocityY(Phaser.Math.Between(100, 200));
  }

  // ============== Ralph移动(左右) ==============
  moveRalphRandom() {
    let idx = Phaser.Math.Between(0, this.ralphMovements.length - 1);
    let targetX = this.ralphMovements[idx];
    let currentY = this.ralph.y;
    this.tweens.add({
      targets: this.ralph,
      x: targetX,
      y: currentY,
      duration: 500,
      ease: "Linear"
    });
  }

  // ============== update：Felix移动逻辑 + 检测修理 ==============
  update(time, delta) {
    if (this.isWindowJumping) {
      return;
    }

    let currentIndex = this.findClosestPlatformIndex(this.felix.x, this.felix.y);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      let aboveIdx = this.findPlatformAbove(currentIndex);
      if (aboveIdx !== null) {
        this.doWindowMoveTween(aboveIdx);
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      let belowIdx = this.findPlatformBelow(currentIndex);
      if (belowIdx !== null) {
        this.doWindowMoveTween(belowIdx);
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      let leftIdx = this.findPlatformLeft(currentIndex);
      if (leftIdx !== null) {
        this.doWindowJumpAnimation(currentIndex, leftIdx);
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      let rightIdx = this.findPlatformRight(currentIndex);
      if (rightIdx !== null) {
        this.doWindowJumpAnimation(currentIndex, rightIdx);
      }
    }

    // 检测并修理窗户：如果 Felix 靠近一个窗户且该窗户中任一玻璃破损，则每累计1秒修复一块玻璃
    this.checkAndRepairWindows(delta);
  }

  // ============== 检测 & 修理破损窗户 ==============
  // 新逻辑：若窗户内有损坏玻璃，且 Felix 靠近窗户中心（距离 < REPAIR_DISTANCE），每累计1秒修复一块破损玻璃
  checkAndRepairWindows(delta) {
    const REPAIR_DISTANCE = 50;      // Felix 与窗户中心距离 < 50 视为在该窗户上
    const REPAIR_INTERVAL = 1000;    // 每1秒修复一块玻璃

    for (let wId in this.windowsById) {
      let wObj = this.windowsById[wId];
      // 筛选出破损玻璃
      let brokenGlasses = wObj.glasses.filter(gspr => gspr.isBroken);
      if (brokenGlasses.length === 0) {
        wObj.repairTimer = 0;
        continue;
      }
      // 计算 Felix 与窗户中心的距离
      let dist = Phaser.Math.Distance.Between(this.felix.x, this.felix.y, wObj.centerX, wObj.centerY);
      if (dist < REPAIR_DISTANCE) {
        wObj.repairTimer += delta;
        if (wObj.repairTimer >= REPAIR_INTERVAL) {
          // 修复一块破损玻璃（取第一个破损的）
          let glassToRepair = wObj.glasses.find(gspr => gspr.isBroken);
          if (glassToRepair) {
            glassToRepair.setFrame(0); // 修复为完整玻璃
            glassToRepair.isBroken = false;
          }
          wObj.repairTimer -= REPAIR_INTERVAL;
        }
      } else {
        wObj.repairTimer = 0;
      }
    }
  }

  // ============== Felix的移动/跳跃Tween逻辑 ==============
  doWindowMoveTween(targetIndex) {
    this.isWindowJumping = true;
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
    let fromPos = this.windowPlatforms[fromIndex];
    let toPos = this.windowPlatforms[toIndex];
    this.felix.x = fromPos.x;
    this.felix.y = fromPos.y;

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

  // ============== 查找Felix相邻平台函数 ==============
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
