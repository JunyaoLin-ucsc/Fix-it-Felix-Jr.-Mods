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
    // 创建 Tilemap
    const map = this.make.tilemap({ key: "gameplayMap" });
    const tilesetA = map.addTilesetImage("tileset", "tilesetImage");
    const tilesetB = map.addTilesetImage("tileset2", "tileset2Image");

    // === 依照你在 Tiled 里的图层名称，一一 createLayer 并设置 depth ===
    const mainBackgroundLayer = map.createLayer("MainBackground", [tilesetA, tilesetB], 0, 0);
    mainBackgroundLayer.setDepth(0);

    const grassLayer = map.createLayer("Grass", [tilesetA, tilesetB], 0, -32);
    grassLayer.setDepth(1);

    const houseLayer = map.createLayer("House", [tilesetA, tilesetB], 0, -32);
    houseLayer.setDepth(2);

    const streetLampLayer = map.createLayer("Street Lamp", [tilesetA, tilesetB], 0, -32);
    streetLampLayer.setDepth(3);

    const floorLayer = map.createLayer("Floor", [tilesetA, tilesetB], 0, 0);
    floorLayer.setDepth(4);

    const ladderLayer = map.createLayer("Ladder", [tilesetA, tilesetB], 0, 0);
    ladderLayer.setDepth(5);

    const pillerLayer = map.createLayer("Pillar", [tilesetA, tilesetB], 0, 0);
    pillerLayer.setDepth(6);

    const wallPaintLayer = map.createLayer("Wall Paint", [tilesetA, tilesetB], 0, 0);
    wallPaintLayer.setDepth(7);

    const redBrickLayer = map.createLayer("Red Brick", [tilesetA, tilesetB], 0, 0);
    redBrickLayer.setDepth(8);

    const supportLayer = map.createLayer("Support", [tilesetA, tilesetB], 0, 0);
    supportLayer.setDepth(9);

    const windowLayer = map.createLayer("Window", [tilesetA, tilesetB], 0, 0);
    windowLayer.setDepth(10);

    const floorGrassLayer = map.createLayer("Floor Grass", [tilesetA, tilesetB], 0, 0);
    floorGrassLayer.setDepth(11);

    const doorLayer = map.createLayer("Door", [tilesetA, tilesetB], 0, 0);
    doorLayer.setDepth(12);

    // === 开启碰撞（若需要）===
    // 示例：Floor / Door / Floor Grass 可以让角色行走或阻挡
    if (floorLayer) {
      floorLayer.setCollisionByProperty({ collides: true });
    }
    if (doorLayer) {
      doorLayer.setCollisionByProperty({ collides: true });
    }
    if (floorGrassLayer) {
      floorGrassLayer.setCollisionByProperty({ collides: true });
    }

    // === 创建 Felix ===
    let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawns");
    if(!felixSpawn) {
      felixSpawn = { x:100, y:100 };
    }
    this.felix = this.physics.add.sprite(felixSpawn.x, felixSpawn.y, "Felix");
    this.felix.setScale(0.1);
    const w = this.felix.displayWidth;
    const h = this.felix.displayHeight;
    this.felix.body.setSize(w, h).setOffset(0,0);
    this.felix.setCollideWorldBounds(true);
    this.felix.setDepth(9999);

    // === 让相机和物理世界范围匹配地图大小 ===
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.felix, true, 0.25, 0.25);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // === 与需要碰撞的图层进行碰撞 ===
    if (floorLayer) {
      this.physics.add.collider(this.felix, floorLayer);
    }
    if (doorLayer) {
      this.physics.add.collider(this.felix, doorLayer);
    }
    if (floorGrassLayer) {
      this.physics.add.collider(this.felix, floorGrassLayer);
    }
    // 其他图层若也要碰撞，可同理加上

    // === 创建 Ralph ===
    let ralphSpawn = map.findObject("Spawns", obj => obj.name === "RalphSpawn");
    if(!ralphSpawn) {
      ralphSpawn = { x: map.widthInPixels / 2, y: 50 };
    }
    this.ralph = this.add.sprite(ralphSpawn.x, ralphSpawn.y, "Ralph").setDepth(1000);
    this.ralph.setScale(0.25);

    // === 投石逻辑：每隔2秒随机扔一个石头 ===
    this.stones = this.physics.add.group();
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        let stoneX = this.ralph.x + Phaser.Math.Between(-30, 30);
        let stone = this.stones.create(stoneX, this.ralph.y + 20, "stone");
        stone.setVelocityY(Phaser.Math.Between(100, 200));
        stone.body.setCollideWorldBounds(true);
        stone.body.onWorldBounds = true;
      }
    });

    // 石头砸中 Felix，切换到 Gameover 场景
    this.physics.add.overlap(this.felix, this.stones, () => {
      this.scene.start("Gameover");
    });

    // === 捕获方向键 ===
    this.cursors = this.input.keyboard.createCursorKeys();

    // 打印 Spawns 对象层里所有对象的信息（调试用）
    const objects = map.getObjectLayer("Spawns").objects;
    console.log(objects);
  }
  
    update() {
      const speed = 150;
      this.felix.setVelocity(0);
  
      if (this.cursors.left.isDown) {
        this.felix.setVelocityX(-speed);
      } else if (this.cursors.right.isDown) {
        this.felix.setVelocityX(speed);
      }
  
      if (this.cursors.up.isDown) {
        this.felix.setVelocityY(-speed);
      } else if (this.cursors.down.isDown) {
        this.felix.setVelocityY(speed);
      }
    }
  }


  
  window.Gameplay = Gameplay;
  