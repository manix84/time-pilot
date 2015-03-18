/* global define */
define("TimePilot.CONSTANTS", function () {

    var CONSTS = {
        player: {
            sprite: {
                src: "./sprites/player/player.png"
            },
            width: 32,
            height: 32,
            hitRadius: 8,
            rotationFrameCount: 16,
            explosion: {
                sprite: {
                    src: "./sprites/player/explosion.png"
                },
                width: 64,
                height: 32,
                frames: 4,
                frameLimiter: 8
            },
            projectile: {
                velocity: 7,
                size: 4,
                color: "#FFF",
                sound: {
                    src: "./sounds/player/bullet.mp3"
                }
            }
        },
        limits: {
            props: 20,
            spawningRadius: 450,
            despawnRadius: 500
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
                    velocity: 5,
                    turnInterval: 5
                },
                enemies: {
                    basic: {
                        sprite: {
                            src: "./sprites/enemies/basic/level1.png"
                        },
                        velocity: 3,
                        turnLimiter: 25,
                        width: 32,
                        height: 32,
                        firingChance: 0.2,
                        hitRadius: 8,
                        canRotate: true,
                        spawnLimit: 10,
                        projectile: {
                            velocity: 5,
                            size: 6,
                            color: "#FF9"
                        },
                        explosion: {
                            sprite: {
                                src: "./sprites/enemies/basic/explosion.png"
                            },
                            sound: {
                                src: "./sounds/enemies/basic/explosion.mp3"
                            },
                            width: 32,
                            height: 32,
                            frames: 4,
                            frameLimiter: 5
                        }
                    }
                },
                bonus: {
                    sprite: {
                        src: "./sprites/parachute.png"
                    },
                    velocity: 2,
                    animationCycle: [1, 2, 3, 4, 4, 3, 2, 1],
                    width: 32,
                    height: 32
                },
                props: [
                    {
                        sprite: {
                            src: "./sprites/props/cloud1.png"
                        },
                        width: 32,
                        height: 18,
                        relativeVelocity: 0.5,
                        layer: 1,
                        reversed: false
                    },
                    {
                        sprite: {
                            src: "./sprites/props/cloud2.png"
                        },
                        width: 60,
                        height: 28,
                        relativeVelocity: 0.25,
                        layer: 1,
                        reversed: false
                    },
                    {
                        sprite: {
                            src: "./sprites/props/cloud3.png"
                        },
                        width: 92,
                        height: 32,
                        relativeVelocity: 0,
                        layer: 2,
                        reversed: false
                    }
                ]
            }
        }
    };

    return CONSTS;
});
