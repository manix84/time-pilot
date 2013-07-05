define("TimePilot.CONSTANTS", function () {

    var CONSTS = {
        player: {
            src: "./sprites/player.png",
            width: 32,
            height: 32,
            hitRadius: 8,
            explosion: {
                src: "./sprites/player_explosion.png",
                width: 64,
                height: 32,
                frames: 4,
                frameLimiter: 8
            }
        },
        levels: {
            1: {
                arena: {
                    introText: "A.D 1910",
                    backgroundColor: "#007",
                    spawningArc: 90,
                    spawningRadius: 450,
                    despawnRadius: 500
                },
                player: {
                    velocity: 4,
                    turnInterval: 5,
                    projectile: {
                        velocity: 7,
                        size: 4,
                        color: "#FFF"
                    }
                },
                enemies: {
                    basic: {
                        src: "./sprites/enemy_level1.png",
                        velocity: 3,
                        turnLimiter: 25,
                        width: 32,
                        height: 32,
                        firingChance: 0.2,
                        hitRadius: 8,
                        canRotate: true,
                        projectile: {
                            velocity: 4,
                            size: 4,
                            color: "#FF9"
                        },
                        explosion: {
                            src: "./sprites/enemy_explosion.png",
                            width: 32,
                            height: 32,
                            frames: 4,
                            frameLimiter: 5
                        }
                    }
                },
                backgroundProps: [
                    {
                        src: "./sprites/cloud1.png",
                        width: 32,
                        height: 18,
                        speed: 0.1
                    },
                    {
                        src: "./sprites/cloud2.png",
                        width: 60,
                        height: 28,
                        speed: 0.5
                    },
                    {
                        src: "./sprites/cloud3.png",
                        width: 92,
                        height: 32,
                        speed: 1
                    }
                ]
            }
        }
    };

    return CONSTS;
});
