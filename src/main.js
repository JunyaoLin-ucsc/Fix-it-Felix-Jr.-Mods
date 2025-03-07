let config = {
    type: Phaser.AUTO,
    render: {
        pixelArt: true
    },
    width: 1280,
    height: 720,
    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },
    scene: [ MainMenu, Tutorial, Gameplay, Gameover ]
};

const game = new Phaser.Game(config);

let borderUISize = game.config.height / 15;
let borderPadding = borderUISize / 3;
