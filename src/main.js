let config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 832,
    render: {
        pixelArt: true
    },
    physics: {
        default: "matter",
        matter: {
            debug: true,
            // gravity: { y: 1 }  // 根据需要调整重力（Matter 默认尺度不同于 Arcade）
        }
    },
    scene: [MainMenu, Tutorial, Gameplay, Gameover, BossBattle]
};

const game = new Phaser.Game(config);
