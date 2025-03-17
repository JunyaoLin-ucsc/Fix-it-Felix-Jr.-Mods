class Credit extends Phaser.Scene {
    constructor() {
      super("Credit");
    }
  
    preload() {
      this.load.path = "./assets/";
      // 使用与 MainMenu 相同的地图 JSON 和 tileset，确保风格一致
      this.load.tilemapTiledJSON("mainMenuMap", "MainMenu.json");
      this.load.image("tilesetImage", "tileset.png");
  
      // 加载音效（确认、选择）
      this.load.audio("confirm", "confirm.wav");
      this.load.audio("selection", "selection.wav");
  
      // 加载位图字体
      this.load.bitmapFont("pixelFont", "Unnamed.png", "Unnamed.xml");
    }
  
    create() {
      // 不停止主菜单BGM，这里继续播放（主菜单和 Tutorial 共用）
      const map = this.make.tilemap({ key: "mainMenuMap" });
      const tileset = map.addTilesetImage("tileset", "tilesetImage");
      // 加载所有背景图层
      map.createLayer("Background", tileset, 0, 0);
      map.createLayer("Grass", tileset, 0, 0);
      map.createLayer("Trees", tileset, 0, 0);
      map.createLayer("Street Lamp", tileset, 0, 0);
      map.createLayer("Moon", tileset, 0, 0);
      map.createLayer("Stars", tileset, 0, 0);
  
      // 创建确认和选择音效对象，音量70%
      this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
      this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
  
      // 使用位图字体显示 Credit 标题
      this.add.bitmapText(
        map.widthInPixels / 2,
        50,
        "pixelFont",
        "Credits",
        48
      ).setOrigin(0.5, 0);
  
      // Credit 内容，感谢以下网站
      let creditsContent = "Special thanks to:\n" +
        "Pixilart: https://www.pixilart.com/art/fix-it-felix-jr-sr2cdafb5b7dfdc\n" +
        "Spriters Resource: https://www.spriters-resource.com/pc_computer/fixitfelixjr/sheet/60053/\n" +
        "Pixel Digivolve Font: https://www.dafont.com/pixel-digivolve.font";
      this.add.bitmapText(
        map.widthInPixels / 2,
        150,
        "pixelFont",
        creditsContent,
        24
      ).setOrigin(0.5);
  
      // 添加 Back 按钮返回 MainMenu
      let backButton = this.add.bitmapText(
        map.widthInPixels / 2,
        map.heightInPixels - 80,
        "pixelFont",
        "Back",
        36
      ).setOrigin(0.5).setInteractive();
  
      backButton.on("pointerover", () => {
        if (this.selectionSnd.isPlaying) {
          this.selectionSnd.stop();
        }
        this.selectionSnd.play();
      });
      backButton.on("pointerdown", () => {
        if (this.confirmSnd.isPlaying) {
          this.confirmSnd.stop();
        }
        this.confirmSnd.play();
        this.time.delayedCall(200, () => {
          this.scene.start("MainMenu");
        });
      });
    }
  }
  
  window.Credit = Credit;
  