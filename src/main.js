// main.js
// 负责创建 Phaser.Game，开启 pixelArt，并包含全部场景

let config = {
    type: Phaser.AUTO,
    width: 1280,       // 可根据需要调整
    height: 832,
    render: {
        pixelArt: true  // 保持像素风格 (禁用插值模糊)
    },
    physics: {
        default: "arcade",
        arcade: {
            debug: true,         // 开发时可设 true 查看碰撞盒
            gravity: { y: 0 }    // 若要平台跳跃则改 y:300，并在地图中处理地板碰撞
        }
    },
    scene: [MainMenu, Tutorial, Gameplay, Gameover]
};

const game = new Phaser.Game(config);
