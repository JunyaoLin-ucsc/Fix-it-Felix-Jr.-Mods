let config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: [ MainMenu, Tutorial, Gameplay, Gameover ]
};

let game = new Phaser.Game(config);

let borderUISize = game.config.height / 15;
let borderPadding = borderUISize / 3;
