class Gameplay extends Phaser.Scene {
    constructor() {
      super("Gameplay");
    }
  
    preload() {
      this.load.path = "./assets/";
      // 两个tileset对应图像
      this.load.tilemapTiledJSON("gameplayMap", "Gameplay.json");
      this.load.image("tilesetImage", "tileset.png");
      this.load.image("tileset2Image", "tileset2.png");
  
      // Felix / Ralph / stone
      this.load.image("Felix", "Felix.png");
      this.load.image("Ralph", "Ralph.png");
      this.load.image("stone", "stone.png");
    }
  
    create() {
      const map = this.make.tilemap({ key: "gameplayMap" });
      // 注意：名字要和Tiled里的Tileset名称对应
      const tilesetA = map.addTilesetImage("tileset", "tilesetImage");
      const tilesetB = map.addTilesetImage("tileset2", "tileset2Image");
  
      // 假设 Tiled 里层名称: MainBackground, Floor, Door, etc.
      let bgLayer = map.createLayer("MainBackground", [tilesetA, tilesetB], 0, 0);
      let floorLayer = map.createLayer("Floor", [tilesetA, tilesetB], 0, 0);
      let doorLayer  = map.createLayer("Door", [tilesetA, tilesetB], 0, 0);
      // 更多图层请自行 createLayer("Window", [tilesetA, tilesetB], ...)
  
      // 碰撞
      [floorLayer, doorLayer].forEach(layer => {
        if (layer) {
          layer.setCollisionByProperty({ collides: true });
        }
      });
  
      // 查找 Tiled 对象层中Felix出生点
      let felixSpawn = map.findObject("Spawns", obj => obj.name === "FelixSpawn");
      if(!felixSpawn) felixSpawn = { x:100, y:100 };
  
      // 创建Felix
      this.felix = this.physics.add.sprite(felixSpawn.x, felixSpawn.y, "Felix");
      this.felix.setScale(0.1);
      const w = this.felix.displayWidth;
      const h = this.felix.displayHeight;
      this.felix.body.setSize(w, h).setOffset(0,0);
      this.felix.setCollideWorldBounds(true);
  
      // 与图层碰撞
      if (floorLayer) this.physics.add.collider(this.felix, floorLayer);
      if (doorLayer)  this.physics.add.collider(this.felix, doorLayer);
  
      // Ralph
      let ralphSpawn = map.findObject("Spawns", obj => obj.name === "RalphSpawn");
      if(!ralphSpawn) ralphSpawn = { x: map.widthInPixels/2, y: 50 };
      this.ralph = this.add.sprite(ralphSpawn.x, ralphSpawn.y, "Ralph").setDepth(1000);
  
      // 投石 - 延迟2秒开始
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
  
      // 被石头砸中 -> Gameover
      this.physics.add.overlap(this.felix, this.stones, () => {
        this.scene.start("Gameover");
      });
  
      // 摄像机滚动
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      this.cameras.main.startFollow(this.felix, true, 0.25, 0.25);
      this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  
      // 输入
      this.cursors = this.input.keyboard.createCursorKeys();
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
  