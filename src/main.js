// Name: Junyao Lin

// Make A Fake Game: Fix it Felix Jr. Mods (somewhat with my own ideas)

// Approximate completion time: 230 hrs, almost I work on this game 10 hours everyday.

// Things I'm proud of about this Project: I really did Fix It Felix Jr, the core of the arcade game, 
// and made it possible for the camera to roll without following any character. 
// In addition, I think the actions of Ralph and Felix repairing glass that I modified by myself also made me feel difficult. 
// I had no skills in pixel painting, and I hated to use mouse to draw, but I persisted. Then I used my own bgm and sound effects, 
// so I didn't have to credit anyone else with the music. I also admire the fact that I created three different buffs: watermelon, strawberry and gold. 
// In particular, gold restores a life, which I think makes the game even more gone.

// Phaser Components I used: Arcade, Camera, Tween Manager, Tilemaps, Animation Managers and Text Objects.

// Finally, I just want to say it is very hard to finish the game solo because I need to handle all the work, I have to start early and spend more time on this work, very difficult and even though sometimes I really doubt myself am I really like game design, that's very awful.

// Some commits message called "ceshi or test" means I am testing something really fast, "ceshi" means test in Chinese. Also, I need to thanks for my rommate Hengyang, he finished this course and helped me a lot to build the stage and the camera switch to different stage, he is a very nice guy.
// So, I am not the only one contributor for this repository.

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
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: [MainMenu, Credit, Tutorial, Gameplay, Continue, Gameover ]
};

const game = new Phaser.Game(config);
