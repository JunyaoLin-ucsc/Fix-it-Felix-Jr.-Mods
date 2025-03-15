class BossBattle extends Phaser.Scene {
  constructor() {
    super("BossBattle");
  }

  preload() {
    this.load.path = "./assets/";
    // 加载 BossBattle 场景的 JSON 地图
    this.load.tilemapTiledJSON("bossBattleMap", "BossBattle.json");

    // 加载两张 tileset 对应的图像
    this.load.image("morningAdventuresImage", "morning_adventures_tileset_16x16.png");
    this.load.image("layoutHelpImage", "layout_help.png");

    // 示例：若需要 Felix 的 spritesheet，可以在此加载
    // this.load.spritesheet("Felix", "Felix.png", { frameWidth: 32, frameHeight: 32 });
  }

  create(data) {
    const map = this.make.tilemap({ key: "bossBattleMap" });

    const morningTileset = map.addTilesetImage("morning_adventures_tileset_16x16", "morningAdventuresImage");
    const layoutTileset   = map.addTilesetImage("layout_help", "layoutHelpImage");

    // 创建图层：Background、Floor、Real Floor
    const backgroundLayer = map.createLayer("Background", [morningTileset, layoutTileset], 0, 0).setDepth(0);
    const floorLayer      = map.createLayer("Floor",      [morningTileset, layoutTileset], 0, 0).setDepth(1);
    const realFloorLayer  = map.createLayer("Real Floor", [morningTileset, layoutTileset], 0, 0).setDepth(2);

    // 【新增/修改】如果需要物理碰撞，让 floorLayer 或 realFloorLayer 可碰撞
    floorLayer.setCollisionByProperty({ collides: true });
    realFloorLayer.setCollisionByProperty({ collides: true });

    // 从对象层 "FelixSpawns" 中读取 Felix 的生成点
    const spawnLayer = map.getObjectLayer("FelixSpawns");
    let spawnX = 100, spawnY = 100;
    if (spawnLayer && spawnLayer.objects.length > 0) {
      const spawnObj = spawnLayer.objects[0];
      spawnX = spawnObj.x + (spawnObj.width || 0) / 2;
      spawnY = spawnObj.y + (spawnObj.height || 0) / 2;
    }

    // 创建 Felix
    this.felix = this.physics.add.sprite(spawnX, spawnY, "Felix", 0).setScale(0.1);
    this.felix.setCollideWorldBounds(true);

    // 【新增/修改】让 Felix 与地面图层碰撞
    this.physics.add.collider(this.felix, floorLayer);
    this.physics.add.collider(this.felix, realFloorLayer);

    // 若场景里需要重力，可在物理配置里加 gravity，或者在这里设置
    // 例如：
    this.physics.world.gravity.y = 800;  // 或你想要的数值

    // 设置相机与物理世界边界
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 标题文本
    this.add.text(
      map.widthInPixels / 2, 
      50, 
      "Boss Battle", 
      { fontSize: "48px", fill: "#ffffff", fontFamily: "Arial" }
    ).setOrigin(0.5);

    // 临时按钮：点击后返回主菜单
    const returnBtn = this.add.text(
      map.widthInPixels / 2,
      map.heightInPixels - 100,
      "Victory! Return to Main Menu",
      { fontSize: "36px", backgroundColor: "#000", color: "#fff", padding: { x: 10, y: 5 } }
    ).setOrigin(0.5).setInteractive();

    returnBtn.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });

    // 【新增】创建光标键
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update(time, delta) {
    // 【新增】Felix 左右移动与跳跃逻辑
    if (!this.felix) return;  // 如果还没创建完就返回

    const speed = 200;        // 走/跑速度
    const jumpVelocity = -400;  // 跳跃向上速度

    // 左右移动
    if (this.cursors.left.isDown) {
      this.felix.setVelocityX(-speed);
      // 可在此设置动画：this.felix.anims.play("walk-left", true);
    }
    else if (this.cursors.right.isDown) {
      this.felix.setVelocityX(speed);
      // 可在此设置动画：this.felix.anims.play("walk-right", true);
    }
    else {
      // 无按键时水平速度归零
      this.felix.setVelocityX(0);
      // 可在此设置 idle 动画：this.felix.anims.play("idle", true);
    }

    // 上方向键跳跃（需要角色与地面接触）
    // 这里用 body.blocked.down 来判断角色是否在地面
    if (this.cursors.up.isDown && this.felix.body.blocked.down) {
      this.felix.setVelocityY(jumpVelocity);
      // 可在此设置跳跃动画：this.felix.anims.play("jump", true);
    }

    // 若需要更多 Boss AI 或其他逻辑，可在此继续实现
  }
}

window.BossBattle = BossBattle;
