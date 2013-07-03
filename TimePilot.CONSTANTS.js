define("TimePilot.CONSTANTS", function () {

    var CONSTS = {
        player: {
            src: "./sprites/player.png",
            height: 32,
            width: 32,
            hitRadius: 8,
            levels: {
                1: {
                    velocity: 6,
                    turnInterval: 5
                }
            }
        },
        enemies: {
            basic: {
                1: {
                    src: "./sprites/enemy_level1.png",
                    velocity: 3,
                    turn: 5,
                    height: 32,
                    width: 32,
                    firingChance: 0.2,
                    hitRadius: 8,
                    canRotate: true
                }
            }
        },
        bullets: {
            player: {
                1: {
                    velocity: 7,
                    size: 2,
                    color: "#FFF"
                }
            },
            basicEnemies: {
                1: {
                    velocity: 7,
                    size: 2,
                    color: "#FF9"
                }
            },
            heavyEnemies: {
                2: {

                }
            }
        }
    };

    return CONSTS;
});
