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
  }

  create() {
    // 保留一定重力，让 Felix 可以掉回地面 (如果你真的不需要碰撞掉落，可设为0)

    // 创建 Tilemap
    const map = this.make.tilemap({ key: "gameplayMap" });
    const tilesetA = map.addTilesetImage("tileset", "tilesetImage");
    const tilesetB = map.addTilesetImage("tileset2", "tileset2Image");

    // （你的各图层创建逻辑，不做删改）
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

    // 让需要碰撞的图层启用碰撞（原封不动）
    if (floorLayer) floorLayer.setCollisionByProperty({ collides: true });
    if (doorLayer) doorLayer.setCollisionByProperty({ collides: true });
    if (floorGrassLayer) floorGrassLayer.setCollisionByProperty({ collides: true });
    if (windowLayer) windowLayer.setCollisionByProperty({ collides: true });

    // === 创建 Felix ===
    let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawns");
    this.felix = this.physics.add.sprite(felixSpawn.x, felixSpawn.y, "Felix").setScale(0.1);

    // 调整碰撞盒（原封不动）
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

    // 相机只跟随 X，不跟随 Y（原封不动）
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.felix, true, 0.25, 0);

    // 与图层碰撞（保持不变）
    this.physics.add.collider(this.felix, floorLayer);
    this.physics.add.collider(this.felix, doorLayer);
    this.physics.add.collider(this.felix, floorGrassLayer);
    this.physics.add.collider(this.felix, windowLayer);

    const ralphLayer = map.getObjectLayer("RalphSpawns");
    let ralphX = 400; 
    let ralphY = 100; // 设个默认坐标，以防对象层里没有
    if (ralphLayer && ralphLayer.objects.length > 0) {
      // 取第一个对象(或可加判断name)
      let obj = ralphLayer.objects[0];
      ralphX = obj.x + (obj.width  || 0)/2;
      ralphY = obj.y + (obj.height || 0)/2;
    }

    // === 创建 Ralph
    this.ralph = this.add.sprite(ralphX, ralphY, "Ralph").setDepth(1000);
    this.ralph.setScale(0.20);

    // === 投石逻辑（仅此处做小改动，让石头能掉出游戏窗口）
    this.stones = this.physics.add.group({});
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        let stoneX = this.ralph.x + Phaser.Math.Between(-30, 30);
        let stone = this.stones.create(stoneX, this.ralph.y + 20, "stone");
        stone.setScale(0.05);
        stone.setDepth(9998);

        // 设置初速度
        stone.setVelocityY(Phaser.Math.Between(100, 200));

        // === 修改: 不再碰撞世界边界 => 可以自由掉出游戏窗口
        // stone.body.setCollideWorldBounds(true); // 移除该行
        // stone.body.onWorldBounds = true;       // 移除该行
      }
    });
    this.physics.add.overlap(this.felix, this.stones, () => {
      this.scene.start("Gameover");
    });

    // === 捕获方向键（保持不变）
    this.cursors = this.input.keyboard.createCursorKeys();

    // === 读取“Felix Positions”对象层存入数组（保持）
    this.windowPlatforms = [];
    const layerObj = map.getObjectLayer("Felix Positions"); // 名字必须和Tiled里一致
    if (layerObj) {
      layerObj.objects.forEach(obj => {
        let px = obj.x + obj.width / 2;
        let py = obj.y + obj.height / 2;
        this.windowPlatforms.push({ x: px, y: py });
      });
    }

    // 是否在跳跃动画中
    this.isWindowJumping = false;
  }

  update() {
    // 如果正在做跳跃动画，就不接受新的方向键指令
    if (this.isWindowJumping) {
      return;
    }

    // 找到 Felix 当前最接近的平台索引
    let currentIndex = this.findClosestPlatformIndex(this.felix.x, this.felix.y);

    // === 上/下 => 做小Tween移动（代替瞬移） ===
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      let aboveIdx = this.findPlatformAbove(currentIndex);
      if (aboveIdx !== null) {
        this.doWindowMoveTween(aboveIdx);  // 小Tween垂直移动
      }
    }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      let belowIdx = this.findPlatformBelow(currentIndex);
      if (belowIdx !== null) {
        this.doWindowMoveTween(belowIdx);  // 小Tween垂直移动
      }
    }
    // === 左/右 => 做抛物线二段跳 ===
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      let leftIdx = this.findPlatformLeft(currentIndex);
      if (leftIdx !== null) {
        this.doWindowJumpAnimation(currentIndex, leftIdx);
      }
    }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      let rightIdx = this.findPlatformRight(currentIndex);
      if (rightIdx !== null) {
        this.doWindowJumpAnimation(currentIndex, rightIdx);
      }
    }
  }

  // ============ 1) 上/下键：单段Tween移动 ============
  doWindowMoveTween(targetIndex) {
    // 让我们在0.3秒内，从Felix现位置移动到target位置
    let targetPos = this.windowPlatforms[targetIndex];
    // 创建Tween
    this.isWindowJumping = true; // 临时锁定输入
    this.tweens.add({
      targets: this.felix,
      x: targetPos.x,
      y: targetPos.y,
      duration: 300,
      ease: "Linear",
      onComplete: () => {
        this.isWindowJumping = false;
        // 清除速度
        this.felix.setVelocity(0, 0);
      }
    });
  }

  // ============ 2) 左/右键：二段Tween => 抛物线跳跃 ============
  doWindowJumpAnimation(fromIndex, toIndex) {
    this.isWindowJumping = true;

    let fromPos = this.windowPlatforms[fromIndex];
    let toPos   = this.windowPlatforms[toIndex];

    // 确保Felix起点对齐
    this.felix.x = fromPos.x;
    this.felix.y = fromPos.y;

    // 计算中点
    let midX = (fromPos.x + toPos.x) / 2;
    let midY = (fromPos.y + toPos.y) / 2 - 50;

    // 用"嵌套Tween"代替 timeline
    // 第1段: from => mid
    this.tweens.add({
      targets: this.felix,
      x: midX,
      y: midY,
      duration: 200,
      ease: "Quad.easeOut",
      onComplete: () => {
        // 第2段: mid => to
        this.tweens.add({
          targets: this.felix,
          x: toPos.x,
          y: toPos.y,
          duration: 200,
          ease: "Quad.easeIn",
          onComplete: () => {
            this.isWindowJumping = false;
            // 停止速度
            this.felix.setVelocity(0,0);
          }
        });
      }
    });
  }

  // ============= 查找与Felix上下左右相邻的平台 =============
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
