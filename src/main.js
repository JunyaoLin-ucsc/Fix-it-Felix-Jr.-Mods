let config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 832,
    render: {
        pixelArt: true
    },
    physics: {
        default: "arcade",
        arcade: {
            debug: true,
            gravity: { y: 0 }
        }
    },
    scene: [MainMenu, Tutorial, Gameplay, Gameover ]
};

const game = new Phaser.Game(config);
