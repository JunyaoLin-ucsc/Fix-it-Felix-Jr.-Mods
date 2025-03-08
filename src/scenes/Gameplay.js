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
    // 让世界有重力（用于平台跳跃）
    this.physics.world.gravity.y = 800;

    // 创建 Tilemap
    const map = this.make.tilemap({ key: "gameplayMap" });
    const tilesetA = map.addTilesetImage("tileset", "tilesetImage");
    const tilesetB = map.addTilesetImage("tileset2", "tileset2Image");

    // （你的各图层创建逻辑）
    const mainBackgroundLayer = map.createLayer("MainBackground", [tilesetA, tilesetB], 0, 0);
    mainBackgroundLayer.setDepth(0);

    const grassLayer = map.createLayer("Grass", [tilesetA, tilesetB], 0, -32).setDepth(1);
    const houseLayer = map.createLayer("House", [tilesetA, tilesetB], 0, -32).setDepth(2);
    const streetLampLayer = map.createLayer("Street Lamp", [tilesetA, tilesetB], 0, -32).setDepth(3);

    const floorLayer = map.createLayer("Floor", [tilesetA, tilesetB], 0, 0).setDepth(4);
    const ladderLayer = map.createLayer("Ladder", [tilesetA, tilesetB], 0, 0).setDepth(5);
    const pillerLayer = map.createLayer("Pillar", [tilesetA, tilesetB], 0, 0).setDepth(6);
    const wallPaintLayer = map.createLayer("Wall Paint", [tilesetA, tilesetB], 0, 0).setDepth(7);
    const redBrickLayer = map.createLayer("Red Brick", [tilesetA, tilesetB], 0, 0).setDepth(8);
    const supportLayer = map.createLayer("Support", [tilesetA, tilesetB], 0, 0).setDepth(9);

    const windowLayer = map.createLayer("Window", [tilesetA, tilesetB], 0, 0).setDepth(12);
    const floorGrassLayer = map.createLayer("Floor Grass", [tilesetA, tilesetB], 0, 0).setDepth(10);
    const doorLayer = map.createLayer("Door", [tilesetA, tilesetB], 0, 0).setDepth(11);

    // 让需要碰撞的图层启用碰撞
    if (floorLayer) floorLayer.setCollisionByProperty({ collides: true });
    if (doorLayer) doorLayer.setCollisionByProperty({ collides: true });
    if (floorGrassLayer) floorGrassLayer.setCollisionByProperty({ collides: true });
    if (windowLayer) windowLayer.setCollisionByProperty({ collides: true });

    // === 创建 Felix ===
    let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawns");
    if(!felixSpawn) {
      felixSpawn = { x: 100, y: 100 };
    }

    // 1) 调整 Felix 碰撞盒 & 2) 提高移动速度
    // 创建 Felix 并缩放
    this.felix = this.physics.add.sprite(felixSpawn.x, felixSpawn.y, "Felix");
    this.felix.setScale(0.1);

    // 当贴图加载完成后，再计算最终的 displayWidth / displayHeight
    this.time.delayedCall(0, () => {
      const displayW = this.felix.displayWidth;
    const displayH = this.felix.displayHeight;

    // 将碰撞框设为贴图的 70% 宽、80% 高（仅供示例，可自行调试 0.6 ~ 0.9）
    const bodyW = displayW * 3.3;
    const bodyH = displayH * 4.9;     

    // 让碰撞框居中
    const offsetX = (bodyW) * 0.82;
    const offsetY = (bodyH) * 0.88;
    this.felix.body.setSize(bodyW, bodyH);
    this.felix.body.setOffset(offsetX, offsetY);
    //console.log(displayW);
  
});

// 确保允许与世界边界碰撞、深度等保持不变
    this.felix.setCollideWorldBounds(true);
    this.felix.setDepth(9999);


    // 相机 & 边界
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.felix, true, 0.25, 0.25);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 与图层碰撞
    this.physics.add.collider(this.felix, floorLayer);
    this.physics.add.collider(this.felix, doorLayer);
    this.physics.add.collider(this.felix, floorGrassLayer);
    this.physics.add.collider(this.felix, windowLayer);

    // === 创建 Ralph ===
    let ralphSpawn = map.findObject("Spawns", obj => obj.name === "RalphSpawn");
    if(!ralphSpawn) {
      ralphSpawn = { x: map.widthInPixels / 2, y: 50 };
    }
    this.ralph = this.add.sprite(ralphSpawn.x, ralphSpawn.y, "Ralph").setDepth(1000);
    this.ralph.setScale(0.25);

    // === 3) 缩小 Stone 大小
    this.stones = this.physics.add.group({
      // 可以在 group 的 defaultKey 或 setXY 里加一些通用设置
      // 不过，这里示例用回调的方式，在生成石头后再 setScale
    });

    // 投石逻辑
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        let stoneX = this.ralph.x + Phaser.Math.Between(-30, 30);
        let stone = this.stones.create(stoneX, this.ralph.y + 20, "stone");

        // 缩小石头
        stone.setScale(0.05);
        stone.setDepth(9998);

        // 若要更精细的碰撞盒：
        // stone.body.setSize(stone.displayWidth * 0.8, stone.displayHeight * 0.8);

        stone.setVelocityY(Phaser.Math.Between(100, 200));
        stone.body.setCollideWorldBounds(true);
        stone.body.onWorldBounds = true;
      }
    });

    // 石头砸中 Felix -> Gameover
    this.physics.add.overlap(this.felix, this.stones, () => {
      this.scene.start("Gameover");
    });

    // === 捕获方向键 ===
    this.cursors = this.input.keyboard.createCursorKeys();

    // 打印 Spawns 对象层里所有对象（调试用）
    const objects = map.getObjectLayer("Spawns").objects;
    console.log(objects);
    
    
  }

  update() {
    // 调大移动速度
    const speed = 300;       // 原来是 160，这里改成 300，更快
    const jumpSpeed = 420;   // 原来是 320，这里也略调高

    // 左右移动
    this.felix.setVelocityX(0);
    if (this.cursors.left.isDown) {
      this.felix.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.felix.setVelocityX(speed);
    }

    // 跳跃 (只有脚踩实地时才能跳)
    if (this.cursors.up.isDown && this.felix.body.blocked.down) {
      this.felix.setVelocityY(-jumpSpeed);
    }
  }
}

window.Gameplay = Gameplay;
