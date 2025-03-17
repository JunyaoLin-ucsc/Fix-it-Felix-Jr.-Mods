class Credit extends Phaser.Scene {
    constructor() {
      super("Credit");
    }
  
    preload() {
      this.load.path = "./assets/";
      // 使用与 MainMenu 相同的地图与 tileset，确保背景一致
      this.load.tilemapTiledJSON("mainMenuMap", "MainMenu.json");
      this.load.image("tilesetImage", "tileset.png");
      // 加载音效：确认、选择，以及主菜单背景音乐（MainMenu.wav）
      this.load.audio("confirm", "confirm.wav");
      this.load.audio("selection", "selection.wav");
      this.load.audio("mainMenuBGM", "MainMenu.wav");
      // 加载位图字体
      this.load.bitmapFont("pixelFont", "Unnamed.png", "Unnamed.xml");
    }
  
    create() {
      // 停止之前的所有声音，防止重叠
      this.sound.stopAll();
      // 播放主菜单背景音乐，音量50%，循环播放
      this.bgm = this.sound.add("mainMenuBGM", { volume: 0.5, loop: true });
      this.bgm.play();
  
      // 创建确认和选择音效对象，音量70%
      this.confirmSnd = this.sound.add("confirm", { volume: 0.7 });
      this.selectionSnd = this.sound.add("selection", { volume: 0.7 });
  
      // 创建背景图层（加载与 MainMenu 相同的地图）
      const map = this.make.tilemap({ key: "mainMenuMap" });
      const tileset = map.addTilesetImage("tileset", "tilesetImage");
      // 创建所有图层
      map.createLayer("Background", tileset, 0, 0);
      map.createLayer("Grass", tileset, 0, 0);
      map.createLayer("Trees", tileset, 0, 0);
      map.createLayer("Street Lamp", tileset, 0, 0);
      map.createLayer("Moon", tileset, 0, 0);
      map.createLayer("Stars", tileset, 0, 0);
  
      // 显示“Credits”标题（使用位图字体）
      this.add.bitmapText(
        map.widthInPixels / 2,
        50,
        "pixelFont",
        "Credits",
        60
      ).setOrigin(0.5, 0);
  
      // 显示借用资产的相关网址
      let creditText = 
        "Art: https://www.pixilart.com/art/fix-it-felix-jr-sr2cdafb5b7dfdc\n" +
        "Sprites: https://www.spriters-resource.com/pc_computer/fixitfelixjr/sheet/60053/\n" +
        "Font: https://www.dafont.com/pixel-digivolve.font";
      this.add.bitmapText(
        map.widthInPixels / 2,
        map.heightInPixels / 2,
        "pixelFont",
        creditText,
        24
      ).setOrigin(0.5);
  
      // 添加“Back”按钮，返回 MainMenu场景（使用位图字体，样式与 MainMenu 中一致）
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
          // 返回主菜单前停止所有声音
          this.sound.stopAll();
          this.scene.start("MainMenu");
        });
      });
    }
  }
  
  window.Credit = Credit;
  