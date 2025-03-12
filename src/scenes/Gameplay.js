class Gameplay extends Phaser.Scene {
  constructor() {
    super("Gameplay");
  }

  init() {
    this.currentStage = 1;
    this.maxStage = 5;            // 正常关卡数量
    this.levelTransitioning = false;
    this.windowsById = {};
    this.lastStoneDropIndex = null; // 防止Ralph连续选同一扔石点

    // 每个关卡对应玻璃编号区间
    this.stageRanges = {
      1: { start: 1, end: 26 },
      2: { start: 27, end: 56 },
      3: { start: 57, end: 86 },
      4: { start: 87, end: 116 },
      5: { start: 117, end: 146 }
    };

    // 记录每个 Stage 的 topY（来自 "Stage X Space" 对象层）
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

    // 音效
    this.load.audio("movement", "movement.wav");
    this.load.audio("failure", "failure.wav");
  }

  create() {
    // ========== 加载 Tilemap 与图层 ==========
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

    // 碰撞
    if (floorLayer) floorLayer.setCollisionByProperty({ collides: true });
    if (this.windowLayerRef) this.windowLayerRef.setCollisionByProperty({ collides: true });

    // ========== 读取每个Stage的 topY ==========
    for (let s = 1; s <= this.maxStage; s++) {
      let layerName = `Stage ${s} Space`;
      let spaceLayer = map.getObjectLayer(layerName);
      if (spaceLayer && spaceLayer.objects.length > 0) {
        let obj = spaceLayer.objects[0];
        this.stageAreas[s] = { topY: obj.y };
        console.log(`Stage ${s}: topY=${obj.y}`);
      } else {
        console.warn(`Stage ${s} Space missing or empty.`);
      }
    }

    // 如果你还有Final Stage Space，也可在此同理读取
    let finalLayer = map.getObjectLayer("Final Stage Space");
    if (finalLayer && finalLayer.objects.length > 0) {
      let obj = finalLayer.objects[0];
      this.stageAreas["final"] = { topY: obj.y };
      console.log(`Final Stage topY=${obj.y}`);
    }

    // ========== 创建 Felix ==========
    let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawns");
    let fx = 300, fy = 300;
    if (felixSpawn) {
      fx = felixSpawn.x; fy = felixSpawn.y;
    }
    this.felix = this.physics.add.sprite(fx, fy, "Felix").setScale(0.1);
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

    // ========== 创建相机 & 世界边界 ==========
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 让相机初始对准 Stage 1
    if (this.stageAreas[1]) {
      let stage1TopY = this.stageAreas[1].topY;
      // 将相机的 scrollY 设置到 stage1TopY
      // 若 stage1TopY 是地图下方，可视需求微调
      this.cameras.main.scrollY = stage1TopY;
    }

    // ========== 创建 Ralph ==========
    const ralphLayer = map.getObjectLayer("RalphSpawns");
    let ralphX = 400, ralphY = 100;
    if (ralphLayer && ralphLayer.objects.length > 0) {
      let obj = ralphLayer.objects[0];
      ralphX = obj.x + (obj.width || 0) / 2;
      ralphY = obj.y + (obj.height || 0) / 2;
    }
    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph").setDepth(1000).setScale(0.2);

    // ========== 加载本关Felix Positions / StoneDropPosition ==========
    this.windowPlatforms = [];
    let felixPos1 = map.getObjectLayer("Felix Positions 1");
    if (felixPos1) {
      felixPos1.objects.forEach(o => {
        let px = o.x + o.width/2;
        let py = o.y + o.height/2;
        this.windowPlatforms.push({ x:px, y:py });
      });
    }
    this.stoneDrops = [];
    let stoneDrop1 = map.getObjectLayer("StoneDropPosition 1");
    if (stoneDrop1) {
      stoneDrop1.objects.forEach(o => {
        let sx = o.x + o.width/2;
        let sy = o.y + o.height/2;
        this.stoneDrops.push({ x:sx, y:sy });
      });
    }

    // ========== 投石逻辑 ==========
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

    // ========== 输入 & 玻璃加载 ==========
    this.cursors = this.input.keyboard.createCursorKeys();
    this.isWindowJumping = false;
    this.loadGlassForStage(this.currentStage);
    this.levelTransitioning = false;
  }

  // 加载指定stage的玻璃；Stage 1可随机0～2，其它stage随机1～2
  loadGlassForStage(stage) {
    let range = this.stageRanges[stage];
    if (!range) return;
    for (let num = range.start; num <= range.end; num += 2) {
      let windowId = Math.floor((num - range.start) / 2) + 1;
      let key = `${stage}_${windowId}`;
      let lowerLayer = this.map.getObjectLayer("Glass " + num);
      let upperLayer = this.map.getObjectLayer("Glass " + (num + 1));
      if (!lowerLayer || !lowerLayer.objects.length) continue;
      if (!upperLayer || !upperLayer.objects.length) continue;
      let objLower = lowerLayer.objects[0];
      let objUpper = upperLayer.objects[0];
      let gxLower = objLower.x + objLower.width/2;
      let gyLower = objLower.y + objLower.height/2;
      let gxUpper = objUpper.x + objUpper.width/2;
      let gyUpper = objUpper.y + objUpper.height/2;

      let lowerSprite = this.add.sprite(gxLower, gyLower, "glassSheet").setDepth(this.windowLayerRef.depth+1);
      let upperSprite = this.add.sprite(gxUpper, gyUpper, "glassSheet").setDepth(this.windowLayerRef.depth+1);

      if (stage === 1) {
        lowerSprite.setFrame(Phaser.Math.Between(0, 2));
        upperSprite.setFrame(Phaser.Math.Between(0, 2));
      } else {
        lowerSprite.setFrame(Phaser.Math.Between(1, 2));
        upperSprite.setFrame(Phaser.Math.Between(1, 2));
      }
      let lowerF = parseInt(lowerSprite.frame.name, 10);
      let upperF = parseInt(upperSprite.frame.name, 10);

      this.windowsById[key] = {
        stage: stage,
        glasses: [
          { sprite: lowerSprite, isBroken: (lowerF!==0), repairTimer: 0 },
          { sprite: upperSprite, isBroken: (upperF!==0), repairTimer: 0 }
        ]
      };
    }
  }

  // Ralph扔石头；石头从Ralph当前贴图位置产生
  throwStones() {
    const pos = { x: this.ralph.x, y: this.ralph.y };
    const stoneVelocity = 150;
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i*200, () => {
        this.createStone(pos.x, pos.y, stoneVelocity);
      });
    }
    // 扔完后移动
    this.time.delayedCall(3*200+500, () => {
      this.moveRalphRandom();
    });
  }

  createStone(x, y, velocity=150) {
    let stone = this.stones.create(x, y, "stone");
    stone.setScale(0.05).setDepth(9998);
    stone.setVelocityY(velocity);
  }

  // Ralph仅在当前this.stoneDrops内移动
  moveRalphRandom() {
    if (!this.stoneDrops.length) return;
    let idx, tries=0;
    do {
      idx = Phaser.Math.Between(0, this.stoneDrops.length-1);
      tries++;
    } while (idx===this.lastStoneDropIndex && this.stoneDrops.length>1 && tries<10);
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

  // 切换关卡 + 处理Final Stage
  levelTransition() {
    this.levelTransitioning = true;
    let nextStage = this.currentStage + 1;

    // 若超过最后一关 => 进入Final Stage
    if (nextStage > this.maxStage) {
      console.log("All normal stages done => go to Final Stage.");
      let finalLayer = this.map.getObjectLayer("Final Stage Space");
      if (!finalLayer || finalLayer.objects.length===0) {
        console.warn("No Final Stage Space found. Stop transition.");
        this.levelTransitioning=false;
        return;
      }
      let finalTopY = finalLayer.objects[0].y;
      let finalCenterY = finalTopY + this.cameras.main.height/2;
      let curC = this.cameras.main.midPoint;
      this.cameras.main.stopFollow();
      console.log(`Pan from y=${curC.y} to y=${finalCenterY} for Final Stage.`);
      this.cameras.main.pan(curC.x, finalCenterY, 2000, "Linear", false, () => {

        // 滚动结束后，Felix => "FelixFinal" layer
        let felixFinalLayer = this.map.getObjectLayer("FelixFinal");
        if (felixFinalLayer && felixFinalLayer.objects.length>0) {
          let ffObj = felixFinalLayer.objects[0];
          let ffX = ffObj.x + (ffObj.width||0)/2;
          let ffY = ffObj.y + (ffObj.height||0)/2;
          this.felix.setPosition(ffX, ffY);
          console.log(`Felix => FinalStage: (${ffX}, ${ffY})`);
        }
        // Ralph => "RalphFinal" layer
        let ralphFinalLayer = this.map.getObjectLayer("RalphFinal");
        if (ralphFinalLayer && ralphFinalLayer.objects.length>0) {
          let rfObj = ralphFinalLayer.objects[0];
          let rx = rfObj.x + (rfObj.width||0)/2;
          let ry = rfObj.y + (rfObj.height||0)/2;
          this.ralph.setPosition(rx, ry);
          console.log(`Ralph => FinalStage: (${rx}, ${ry})`);
        }

        console.log("Reached Final Stage => End of game or show cutscene...");
        this.levelTransitioning=false;
      });
      return;
    }

    // 若还有正常关卡 => 切换到Stage (nextStage)
    let currentArea = this.stageAreas[this.currentStage];
    let nextArea = this.stageAreas[nextStage];
    if (!currentArea || !nextArea) {
      console.error(`Stage area missing: current=${this.currentStage}, next=${nextStage}`);
      this.levelTransitioning = false;
      return;
    }

    console.log(`Transition from stage=${this.currentStage} to stage=${nextStage}`);

    let stageHeight = 750;
    this.physics.world.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);
    this.cameras.main.setBounds(0, nextArea.topY, this.map.widthInPixels, stageHeight);

    // 平滑滚动到 nextArea
    let newCenterY = nextArea.topY + this.cameras.main.height/2;
    let currentCenter = this.cameras.main.midPoint;
    console.log(`Camera pan from y=${currentCenter.y} to y=${newCenterY}`);
    this.cameras.main.stopFollow();
    this.cameras.main.pan(currentCenter.x, newCenterY, 2000, "Linear", false, () => {

      // 平滑滚动结束 => 更新Felix & Ralph
      let felixLayerName = `FelixStage${nextStage}`;
      let felixLayer = this.map.getObjectLayer(felixLayerName);
      let newX = this.felix.x;
      let newY = nextArea.topY + 200;
      if (felixLayer && felixLayer.objects.length>0) {
        let randF = Phaser.Math.Between(0, felixLayer.objects.length-1);
        let fObj = felixLayer.objects[randF];
        newX = fObj.x + (fObj.width||0)/2;
        newY = fObj.y + (fObj.height||0)/2;
        console.log(`Felix => stage${nextStage}: (${newX}, ${newY})`);
      }
      this.felix.setPosition(newX, newY);

      this.tweens.killTweensOf(this.ralph);
      let ralphLayerName = `RalphStage${nextStage}`;
      let spawnLayer = this.map.getObjectLayer(ralphLayerName);
      if (spawnLayer && spawnLayer.objects.length>0) {
        let randR = Phaser.Math.Between(0, spawnLayer.objects.length-1);
        let rObj = spawnLayer.objects[randR];
        let rx = rObj.x + (rObj.width||0)/2;
        let ry = rObj.y + (rObj.height||0)/2;
        this.ralph.setPosition(rx, ry);
        console.log(`Ralph => stage${nextStage}: (${rx}, ${ry})`);
      }

      // 清除上一关玻璃 => 加载下一关玻璃
      for (let key in this.windowsById) {
        let wObj = this.windowsById[key];
        if (wObj.stage === this.currentStage) {
          wObj.glasses.forEach(g => g.sprite.destroy());
          delete this.windowsById[key];
        }
      }
      this.currentStage = nextStage;
      this.loadGlassForStage(nextStage);

      // 重新加载Felix Positions X & StoneDropPosition X
      this.windowPlatforms = [];
      let fPosLayer = this.map.getObjectLayer(`Felix Positions ${nextStage}`);
      if (fPosLayer && fPosLayer.objects.length>0) {
        fPosLayer.objects.forEach(o => {
          let px = o.x + o.width/2;
          let py = o.y + o.height/2;
          this.windowPlatforms.push({ x:px, y:py });
        });
      } else {
        console.warn(`Felix Positions ${nextStage} missing/empty.`);
      }

      this.stoneDrops = [];
      let dropLayer = this.map.getObjectLayer(`StoneDropPosition ${nextStage}`);
      if (dropLayer && dropLayer.objects.length>0) {
        dropLayer.objects.forEach(o => {
          let sx = o.x + o.width/2;
          let sy = o.y + o.height/2;
          this.stoneDrops.push({ x:sx, y:sy });
        });
      } else {
        console.warn(`StoneDropPosition ${nextStage} missing/empty.`);
      }

      // 再次跟随Felix
      this.cameras.main.startFollow(this.felix, true, 0.25, 0);
      this.levelTransitioning = false;
    });
  }

  update(time, delta) {
    if (this.levelTransitioning || this.isWindowJumping) return;

    this.checkAndRepairWindows(delta);

    if (this.allWindowsRepairedForStage()) {
      console.log(`All windows in Stage ${this.currentStage} repaired => levelTransition().`);
      this.levelTransition();
      return;
    }

    if (!this.cursors) return;
    let currentIndex = this.findClosestPlatformIndex(this.felix.x, this.felix.y);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      let aboveIdx = this.findPlatformAbove(currentIndex);
      if (aboveIdx!==null) this.doWindowMoveTween(aboveIdx);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      let belowIdx = this.findPlatformBelow(currentIndex);
      if (belowIdx!==null) this.doWindowMoveTween(belowIdx);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      let leftIdx = this.findPlatformLeft(currentIndex);
      if (leftIdx!==null) this.doWindowJumpAnimation(currentIndex, leftIdx);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      let rightIdx = this.findPlatformRight(currentIndex);
      if (rightIdx!==null) this.doWindowJumpAnimation(currentIndex, rightIdx);
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
            // 一次修复到 frame 0
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
    this.movementSnd.play({ restart:true });

    let targetPos = this.windowPlatforms[targetIndex];
    this.tweens.add({
      targets: this.felix,
      x: targetPos.x,
      y: targetPos.y,
      duration: 300,
      ease: "Linear",
      onComplete: () => {
        this.isWindowJumping=false;
        this.felix.setVelocity(0,0);
      }
    });
  }

  doWindowJumpAnimation(fromIndex, toIndex) {
    this.isWindowJumping = true;
    this.movementSnd.play({ restart:true });

    let fromPos = this.windowPlatforms[fromIndex];
    let toPos = this.windowPlatforms[toIndex];
    this.felix.setPosition(fromPos.x, fromPos.y);
    let midX = (fromPos.x+toPos.x)/2;
    let midY = (fromPos.y+toPos.y)/2 - 50;
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
            this.isWindowJumping=false;
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
      let d = Phaser.Math.Distance.Between(x,y,p.x,p.y);
      if (d<minDist) {
        minDist=d; 
        closest=i;
      }
    });
    return closest;
  }

  findPlatformAbove(idx) {
    if (idx==null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate=null;
    let minDist=Infinity;
    this.windowPlatforms.forEach((p,i) => {
      if (p.y<cur.y && Math.abs(p.x-cur.x)<40) {
        let dist = cur.y - p.y;
        if (dist<minDist) {
          minDist=dist;
          candidate=i;
        }
      }
    });
    return candidate;
  }

  findPlatformBelow(idx) {
    if (idx==null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate=null;
    let minDist=Infinity;
    this.windowPlatforms.forEach((p,i) => {
      if (p.y>cur.y && Math.abs(p.x-cur.x)<40) {
        let dist = p.y - cur.y;
        if (dist<minDist) {
          minDist=dist;
          candidate=i;
        }
      }
    });
    return candidate;
  }

  findPlatformLeft(idx) {
    if (idx==null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate=null;
    let minDist=Infinity;
    this.windowPlatforms.forEach((p,i) => {
      if (p.x<cur.x && Math.abs(p.y-cur.y)<40) {
        let dist = cur.x - p.x;
        if (dist<minDist) {
          minDist=dist;
          candidate=i;
        }
      }
    });
    return candidate;
  }

  findPlatformRight(idx) {
    if (idx==null) return null;
    let cur = this.windowPlatforms[idx];
    let candidate=null;
    let minDist=Infinity;
    this.windowPlatforms.forEach((p,i) => {
      if (p.x>cur.x && Math.abs(p.y-cur.y)<40) {
        let dist = p.x - cur.x;
        if (dist<minDist) {
          minDist=dist;
          candidate=i;
        }
      }
    });
    return candidate;
  }
}

window.Gameplay = Gameplay;
