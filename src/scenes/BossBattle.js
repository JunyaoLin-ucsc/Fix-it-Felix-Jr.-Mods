class BossBattle extends Phaser.Scene {
  constructor() {
    super("BossBattle");
  }

  preload() {
    this.load.path = "./assets/";
    // 加载 BossBattle 场景的 JSON 地图
    this.load.tilemapTiledJSON("bossBattleMap", "BossBattle.json");

    // 加载两张 tileset 对应的图像
    // 注意这里 "morningAdventuresImage" / "layoutHelpImage" 是 Phaser 用的 key
    // "morning_adventures_tileset_16x16.png" / "layout_help.png" 是你项目里的实际文件名
    this.load.image("morningAdventuresImage", "morning_adventures_tileset_16x16.png");
    this.load.image("layoutHelpImage", "layout_help.png");

    // 若有其他资源（比如 Felix、Boss 角色的 spritesheet 等），在此继续 load...
    // this.load.spritesheet("Felix", "Felix.png", { frameWidth: 32, frameHeight: 32 });
  }

  create(data) {
    // 创建 Tilemap
    const map = this.make.tilemap({ key: "bossBattleMap" });

    // 假设在 Tiled 中的 tileset 名称分别是 "morning_adventures_tileset_16x16" 和 "layout_help"
    // 对应的第二个参数要与 preload() 里 this.load.image(...) 的 key 保持一致
    const morningTileset = map.addTilesetImage("morning_adventures_tileset_16x16", "morningAdventuresImage");
    const layoutTileset   = map.addTilesetImage("layout_help", "layoutHelpImage");

    // 将两个 tileset 打包到同一个数组里传给 createLayer
    // 假设你在 Tiled 中有三个图层：Background、Floor、Real Floor
    // 并且都要使用这两张 tileset
    const backgroundLayer = map.createLayer("Background", [morningTileset, layoutTileset], 0, 0).setDepth(0);
    const floorLayer      = map.createLayer("Floor",      [morningTileset, layoutTileset], 0, 0).setDepth(1);
    const realFloorLayer  = map.createLayer("Real Floor", [morningTileset, layoutTileset], 0, 0).setDepth(2);

    // 如果需要物理碰撞，可设置对应图层的 collision
    // floorLayer.setCollisionByProperty({ collides: true });
    // realFloorLayer.setCollisionByProperty({ collides: true });
    // ...

    // 从对象层 "FelixSpawns" 中读取 Felix 的生成点
    const spawnLayer = map.getObjectLayer("FelixSpawns");
    let spawnX = 100, spawnY = 100;
    if (spawnLayer && spawnLayer.objects.length > 0) {
      const spawnObj = spawnLayer.objects[0];
      spawnX = spawnObj.x + (spawnObj.width || 0) / 2;
      spawnY = spawnObj.y + (spawnObj.height || 0) / 2;
    }

    // 这里仅示例：创建一个 Felix，放在 BossBattle 里
    // 实际上你也可以做别的，比如加载 Boss、添加战斗逻辑等
    this.felix = this.physics.add.sprite(spawnX, spawnY, "Felix", 0).setScale(0.1);
    this.felix.setCollideWorldBounds(true);

    // 设置相机与物理世界边界
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 可选：如果需要让相机跟随 Felix
    // this.cameras.main.startFollow(this.felix);

    // 显示一个标题文本
    this.add.text(
      map.widthInPixels / 2, 
      50, 
      "Boss Battle", 
      { fontSize: "48px", fill: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);

    // 例如，你在这里加一个临时按钮，让玩家点击后返回主菜单
    const returnBtn = this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels - 100,
      "Victory! Return to Main Menu",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x: 10, y: 5 } }
    ).setOrigin(0.5).setInteractive();

    returnBtn.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });

    // ... 在这里继续写 Boss 的创建、战斗逻辑等 ...
  }

  update(time, delta) {
    // 若需要在 BossBattle 中处理 Felix 的移动、Boss AI 等，可在此实现
  }
}

window.BossBattle = BossBattle;
