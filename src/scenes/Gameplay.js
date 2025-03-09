class Gameplay extends Phaser.Scene {
  constructor() {
    super("Gameplay");
  }

  preload() {
    this.load.path = "./assets/";
    // 加载地图 JSON + Tileset
    this.load.tilemapTiledJSON("gameplayMap", "Gameplay.json");
    this.load.image("tilesetImage", "tileset.png");
    this.load.image("tileset2Image", "tileset2.png");
    // 角色/物体
    this.load.image("Felix", "Felix.png");
    this.load.image("Ralph", "Ralph.png");
    this.load.image("stone", "stone.png");
    // 玻璃精灵图 0=完好,1=中破,2=重破
    this.load.spritesheet("glassSheet", "Glass-Sheet.png", {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    // ======== Tilemap & Layers ========
    const map = this.make.tilemap({ key: "gameplayMap" });
    const tilesetA = map.addTilesetImage("tileset", "tilesetImage");
    const tilesetB = map.addTilesetImage("tileset2", "tileset2Image");

    const mainBackgroundLayer = map.createLayer("MainBackground", [tilesetA, tilesetB], 0, 0).setDepth(0);
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
    const windowLayer = map.createLayer("Window", [tilesetA, tilesetB], 0, 0).setDepth(12);
    const doorLayer = map.createLayer("Door", [tilesetA, tilesetB], 0, 0).setDepth(11);

    if (floorLayer) floorLayer.setCollisionByProperty({ collides: true });
    if (windowLayer) windowLayer.setCollisionByProperty({ collides: true });

    // ======== Felix ========
    let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawns");
    this.felix = this.physics.add.sprite(felixSpawn.x, felixSpawn.y, "Felix").setScale(0.1);

    // 调整碰撞盒
    this.time.delayedCall(0, () => {
      const dw = this.felix.displayWidth;
      const dh = this.felix.displayHeight;
      const bodyW = dw * 10;
      const bodyH = dh * 10;
      const offsetX = bodyW * 0.08;
      const offsetY = bodyH * 0.02;
      this.felix.body.setSize(bodyW, bodyH);
      this.felix.body.setOffset(offsetX, offsetY);
    });
    this.felix.setCollideWorldBounds(true).setDepth(9999);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.felix, true, 0.25, 0);

    this.physics.add.collider(this.felix, floorLayer);
    this.physics.add.collider(this.felix, doorLayer);
    this.physics.add.collider(this.felix, floorGrassLayer);
    this.physics.add.collider(this.felix, windowLayer);

    // ======== Ralph & 石头 ========
    const ralphLayer = map.getObjectLayer("RalphSpawns");
    let ralphX = 400, ralphY = 100;
    if (ralphLayer && ralphLayer.objects.length > 0) {
      let obj = ralphLayer.objects[0];
      ralphX = obj.x + (obj.width||0)/2;
      ralphY = obj.y + (obj.height||0)/2;
    }
    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph").setDepth(1000).setScale(0.2);

    this.ralphMovements = [];
    let ralphMoveLayer = map.getObjectLayer("RalphMovement");
    if (ralphMoveLayer) {
      ralphMoveLayer.objects.forEach(o => {
        let rx = o.x + (o.width||0)/2;
        this.ralphMovements.push(rx);
      });
    }

    this.stoneDrops = [];
    let stoneDropLayer = map.getObjectLayer("StoneDropPosition");
    if (stoneDropLayer) {
      stoneDropLayer.objects.forEach(o => {
        let sx = o.x + (o.width||0)/2;
        let sy = o.y + (o.height||0)/2;
        this.stoneDrops.push({ x:sx, y:sy });
      });
    }

    // 投石逻辑
    this.stones = this.physics.add.group();
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

    // ======== 输入 & Felix平台跳跃 ========
    this.cursors = this.input.keyboard.createCursorKeys();
    this.windowPlatforms = [];
    let layerObj = map.getObjectLayer("Felix Positions");
    if (layerObj) {
      layerObj.objects.forEach(obj => {
        let px = obj.x + obj.width/2;
        let py = obj.y + obj.height/2;
        this.windowPlatforms.push({ x:px, y:py });
      });
    }
    this.isWindowJumping = false;

    // ======== 读取 "GlassPosition"：每扇窗户含多块玻璃 ========
    // 但这次不会用"窗户中心"做修理检测，而是逐块玻璃
    this.windowsById = {};
    let glassLayer = map.getObjectLayer("GlassPosition");
    if (glassLayer) {
      glassLayer.objects.forEach(obj => {
        let gx = obj.x + obj.width / 2;
        let gy = obj.y + obj.height / 2;
        let wId = 0;
        if (obj.properties) {
          let prop = obj.properties.find(p => p.name === "windowId");
          if (prop) wId = prop.value;
        }
        if (!this.windowsById[wId]) {
          this.windowsById[wId] = { windowId:wId, glasses:[] };
        }
        let wObj = this.windowsById[wId];

        let glassSprite = this.add.sprite(gx, gy, "glassSheet").setDepth(windowLayer.depth+1);
        let rndFrame = Phaser.Math.Between(0,2); // 0=完好 1=中破 2=重破
        glassSprite.setFrame(rndFrame);

        wObj.glasses.push({
          sprite: glassSprite,
          isBroken: (rndFrame>0),
          repairTimer: 0 // 每块玻璃独立维护修理计时
        });
      });
    }
  }

  // ========== 投石 ==========
  createStone(x, y) {
    let stone = this.stones.create(x, y, "stone");
    stone.setScale(0.05).setDepth(9998);
    stone.setVelocityY(Phaser.Math.Between(100, 200));
  }

  // ========== Ralph 随机移动 ==========
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

  // ========== 主循环 ==========
  update(time, delta) {
    if (this.isWindowJumping) return;

    // 平台跳跃示例（上下左右）
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

    // === 玻璃修理（方法B：按“每块玻璃”的距离检测）
    this.checkAndRepairWindows(delta);
  }

  // ========== 逐块玻璃检测距离 + 修理 ==========
  checkAndRepairWindows(delta) {
    const REPAIR_DISTANCE = 50;   // Felix到玻璃< 50时开始修
    const REPAIR_INTERVAL = 1000; // 1秒修理1档

    for (let wId in this.windowsById) {
      let wObj = this.windowsById[wId];

      // 遍历此窗口下的每一块玻璃
      for (let gData of wObj.glasses) {
        if (!gData.isBroken) continue; // 已完好则忽略

        // 计算 Felix 与 该块玻璃 的距离
        let dist = Phaser.Math.Distance.Between(
          this.felix.x, this.felix.y,
          gData.sprite.x, gData.sprite.y
        );
       // console.log(`[GlassLog] dist=${dist.toFixed(2)}, repairTimer=${gData.repairTimer.toFixed(2)}`);
        
        // 若进入修理范围
        if (dist < REPAIR_DISTANCE) {
          gData.repairTimer += delta;
          // 若计时超过 REPAIR_INTERVAL => 修理1档
          if (gData.repairTimer >= REPAIR_INTERVAL) {
            let currentFrame = gData.sprite.frame.name; // 0/1/2
            if (currentFrame == 2) {
              // 重破 => 中破
              gData.sprite.setFrame(1);
            } else {
              // 中破 => 完好
              gData.sprite.setFrame(0);
              gData.isBroken = false;
            }
            // 用掉这1秒
            gData.repairTimer -= REPAIR_INTERVAL;
          }
        } else {
          // 不在范围，重置此块玻璃的修理计时
          gData.repairTimer = 0;
        }
      }
    }
  }

  // ========== Felix 窗口平台移动示例 ==========
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

    let midX = (fromPos.x + toPos.x)/2;
    let midY = (fromPos.y + toPos.y)/2 - 50;

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
            this.felix.setVelocity(0,0);
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
    if (idx==null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate=null, minDist=Infinity;
    this.windowPlatforms.forEach((p,i) => {
      if (p.y<cur.y && Math.abs(p.x-cur.x)<40) {
        let dist = cur.y-p.y;
        if(dist<minDist){ minDist=dist; candidate=i;}
      }
    });
    return candidate;
  }
  findPlatformBelow(idx) {
    if (idx==null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate=null, minDist=Infinity;
    this.windowPlatforms.forEach((p,i) => {
      if (p.y>cur.y && Math.abs(p.x-cur.x)<40) {
        let dist = p.y-cur.y;
        if(dist<minDist){ minDist=dist; candidate=i;}
      }
    });
    return candidate;
  }
  findPlatformLeft(idx) {
    if (idx==null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate=null, minDist=Infinity;
    this.windowPlatforms.forEach((p,i) => {
      if (p.x<cur.x && Math.abs(p.y-cur.y)<40) {
        let dist = cur.x-p.x;
        if(dist<minDist){ minDist=dist; candidate=i;}
      }
    });
    return candidate;
  }
  findPlatformRight(idx) {
    if (idx==null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate=null, minDist=Infinity;
    this.windowPlatforms.forEach((p,i) => {
      if (p.x>cur.x && Math.abs(p.y-cur.y)<40) {
        let dist = p.x-cur.x;
        if(dist<minDist){ minDist=dist; candidate=i;}
      }
    });
    return candidate;
  }
}

window.Gameplay = Gameplay;
