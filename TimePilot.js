/* global define */
define("TimePilot", [
    "engine/Ticker",
    "engine/GameArena",
    "engine/helpers",
    "TimePilot.CONSTANTS",
    "TimePilot.dataStore",
    "TimePilot.userOptions",
    "TimePilot.Player",
    "TimePilot.EnemyFactory",
    "TimePilot.BulletFactory",
    "TimePilot.PropFactory",
    "TimePilot.Hud",
    "TimePilot.ControllerInterface"
], function (
    Ticker,
    GameArena,
    helpers,
    CONST,
    dataStore,
    userOptions,
    Player,
    EnemyFactory,
    BulletFactory,
    PropFactory,
    Hud,
    ControllerInterface
) {

    var TimePilot = function (element, options) {
        this._container = element;

        var property = null;

        for (property in options) {
            if (options.hasOwnProperty(property) && this._options.hasOwnProperty(property)) {
                this._options[property] = options[property];
            }
        }
        dataStore._level = 1;

        this._init();
    };

    TimePilot.prototype = {

        _options: {
            debug: false
        },

        _data: {},

        _init: function () {
            var that = this;

            userOptions.enableDebug = this._options.debug;

            dataStore._gameArena = new GameArena(this._container);
            dataStore._ticker = new Ticker();
            dataStore._bullets = new BulletFactory();
            dataStore._player = new Player();
            dataStore._enemies = new EnemyFactory();
            dataStore._props = new PropFactory();
            dataStore._hud = new Hud();


            var controllerInterface = new ControllerInterface({
                restart: function () {
                    that.restartGame();
                },
                pause: function () {
                    that.pauseGame();
                }
            });

            dataStore._currentController = [];
            require([
                // "TimePilot.Controller." + userOptions.controllerType
                "TimePilot.Controller.Keyboard1",
                "TimePilot.Controller.Gamepad"
            ], function (
                Keyboard,
                Gamepad
            ) {
                dataStore._currentController.push(new Keyboard(controllerInterface));
                dataStore._currentController.push(new Gamepad(controllerInterface));
            });

            dataStore._player.setData("level", 1);
            dataStore._gameArena.renderText("Loading", 20, 10, {size: 30});

            dataStore._gameArena.registerAssets([
                "./fonts/font.ttf",
                "./sprites/player/player.png",
                "./sounds/player/bullet.mp3",
                "./sprites/player/explosion.png",
                "./sprites/enemies/basic/level1.png",
                // "./sprites/enemies/basic/level2.png",
                // "./sprites/enemies/basic/level3.png",
                // "./sprites/enemies/basic/level4.png",
                // "./sprites/enemies/basic/level5.png",
                "./sprites/enemies/basic/explosion.png",
                "./sprites/props/cloud1.png",
                "./sprites/props/cloud2.png",
                "./sprites/props/cloud3.png"
            ]);

            dataStore._gameArena.preloadAssets(function (obj) {
                if (!obj.remaining) {
                    that._start();
                    dataStore._ticker.start();
                }
            });
        },

        _start: function () {
            var that = this;

            this._addRandomClouds();

            dataStore._ticker.addSchedule(function () {
                that.pauseGame();
                window.console.warn("Stopping: 50,000 ticks");
            }, 50000);

            dataStore._ticker.addSchedule(function () {
                dataStore._player.reposition();
                dataStore._enemies.reposition();
                dataStore._bullets.reposition();
                dataStore._props.reposition();

                that._spawnEntities();
            }, 1);

            dataStore._ticker.addSchedule(function () {
                dataStore._player.rotate();
            }, 3);
            dataStore._ticker.addSchedule(function () {
                dataStore._player.shoot();
            }, 5);

            dataStore._ticker.addSchedule(function () {
                dataStore._gameArena.clear();
                dataStore._gameArena.setBackgroundColor(CONST.levels[dataStore._level].arena.backgroundColor);

                dataStore._props.render(1);

                dataStore._bullets.render();
                dataStore._enemies.render();

                dataStore._player.render();

                dataStore._props.render(2);

                dataStore._hud.render();
            }, 1);

            dataStore._ticker.addSchedule(function () {
                dataStore._enemies.detectCollision();
            }, 1);

            dataStore._ticker.addSchedule(function () {
                dataStore._enemies.cleanup();
                dataStore._bullets.cleanup();
                dataStore._props.cleanup();
            }, 1);
        },

        restartGame: function () {
            var that = this;
            window.console.info("Restarting");
            dataStore._ticker.stop(function () {
                dataStore._hud.restart();

                dataStore._ticker.clearTicks();
                dataStore._ticker.clearSchedule();
                dataStore._enemies.clearAll();
                dataStore._bullets.clearAll();
                dataStore._props.clearAll();
                dataStore._player.resetData();

                that._start();
                dataStore._ticker.start();
            });
        },

        pauseGame: function (forcePause) {
            var that = this;
            if (dataStore._ticker.isRunning || !!forcePause) {
                window.console.info("Pausing");
                dataStore._ticker.stop(function () {
                    dataStore._hud.pause();
                });
            } else {
                window.console.info("Unpausing");
                dataStore._ticker.start();
            }
        },

        _addRandomClouds: function () {
            var i = 0;
            for (; i < 20; i++) {
                // Clouds
                dataStore._props.create(
                    Math.floor(Math.random() * dataStore._gameArena.width),
                    Math.floor(Math.random() * dataStore._gameArena.height)
                );
            }
        },

        _spawnEntities: function () {
            var data = {},
                heading = 0,
                randomTickInterval = (Math.floor(Math.random() * (1 - 200 + 1)) + 200);
            if ((dataStore._ticker.getTicks() % randomTickInterval === 0) && dataStore._enemies.isUnderLimit()) {
                // Enemies
                data = helpers.getSpawnCoords(dataStore._player.getData());
                heading = helpers.findHeading({
                        posX: data.posX,
                        posY: data.posY
                    }, {
                        posX: dataStore._player.getData().posX,
                        posY: dataStore._player.getData().posY
                    }
                );
                dataStore._enemies.create(data.posX, data.posY, heading);
            }
            if (dataStore._props.getCount() < 20) {
                // Clouds
                data = helpers.getSpawnCoords(dataStore._player.getData());
                dataStore._props.create(data.posX, data.posY);
            }
        }
    };

    return TimePilot;
});
