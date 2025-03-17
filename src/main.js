// Name: Junyao Lin
// Make A Fake Game: Fix it Felix Jr. Mods (somewhat with my own ideas)
// Approximate completion time: 230 hrs, almost I work on this game 10 hours everyday.
// Things I'm proud of about this Project: I really did Fix It Felix Jr, the core of the arcade game, 
// and made it possible for the camera to roll without following any character. 
// In addition, I think the actions of Ralph and Felix repairing glass that I modified by myself also made me feel difficult. 
// I had no skills in pixel painting, and I hated to use mouse to draw, but I persisted. Then I used my own bgm and sound effects, 
// so I didn't have to credit anyone else with the music. I also admire the fact that I created three different buffs: watermelon, strawberry and gold. 
// In particular, gold restores a life, which I think makes the game even more gone.
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
    scene: [MainMenu, Credit, Tutorial, Gameplay, Continue, Gameover ]
};

const game = new Phaser.Game(config);
