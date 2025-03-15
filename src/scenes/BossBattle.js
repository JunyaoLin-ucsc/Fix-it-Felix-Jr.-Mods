class BossBattle extends Phaser.Scene {
    constructor() {
      super("BossBattle");
    }
  
    preload() {
      this.load.path = "./assets/";
      // 加载 BossBattle 场景的 tilemap（Tiled 生成的 JSON 文件）
      this.load.tilemapTiledJSON("bossBattleMap", "BossBattle.json");
      // 加载 tileset 图像（假设使用相同的 tileset）
      this.load.image("tilesetImage", "tileset.png");
      // 如有需要，加载 Boss 图片、音效等其他资源
    }
  
    create() {
      const map = this.make.tilemap({ key: "bossBattleMap" });
      const tileset = map.addTilesetImage("tileset", "tilesetImage");
      // 创建各个 tile layer（假设名称为 Background, Floor, Real Floor）
      map.createLayer("Background", tileset, 0, 0).setDepth(0);
      map.createLayer("Floor", tileset, 0, 0).setDepth(1);
      map.createLayer("Real Floor", tileset, 0, 0).setDepth(2);
  
      // 从对象层 "FelixSpawns" 中获取 Felix 的生成点
      const spawnLayer = map.getObjectLayer("FelixSpawns");
      let spawnX = 100, spawnY = 100;
      if (spawnLayer && spawnLayer.objects.length > 0) {
        const spawnObj = spawnLayer.objects[0];
        spawnX = spawnObj.x + (spawnObj.width || 0) / 2;
        spawnY = spawnObj.y + (spawnObj.height || 0) / 2;
      }
  
      // 创建 Felix（这里仅作为示例，实际 Boss Battle 可能需要更多逻辑）
      this.felix = this.physics.add.sprite(spawnX, spawnY, "Felix", 0).setScale(0.1);
      this.felix.setCollideWorldBounds(true);
  
      // 设置相机与物理世界边界
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  
      // 显示 Boss Battle 提示文字
      this.add.text(map.widthInPixels / 2, 50, "Boss Battle", {
        fontSize: "48px",
        fill: "#ffffff",
        fontFamily: "Arial"
      }).setOrigin(0.5);
  
      // 此处可添加 Boss 的创建以及战斗逻辑…
      // 为示例，添加一个按钮，点击后返回主菜单
      const returnBtn = this.add.text(
        map.widthInPixels / 2,
        map.heightInPixels - 100,
        "Victory! Return to Main Menu",
        { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x: 10, y: 5 } }
      ).setOrigin(0.5).setInteractive();
  
      returnBtn.on("pointerover", () => {
        // 可添加悬停音效
      });
  
      returnBtn.on("pointerdown", () => {
        this.scene.start("MainMenu");
      });
    }
  }
  
  window.BossBattle = BossBattle;
  