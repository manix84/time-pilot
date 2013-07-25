define("TimePilot", [
    "engine/Ticker",
    "engine/GameArena",
    "engine/helpers",
    "TimePilot.CONSTANTS",
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

        this._init();
    };

    TimePilot.prototype = {

        _options: {
            debug: false
        },

        _data: {
            theTicker: null,
            player: {
                isFiring: false,
                lastFiredTick: 0,
                direction: false,
                lastMovedTick: 0,
                continues: 3,
                lives: 3
            },
            level: 1,
            score: 0,


            clouds: []
        },

        _init: function () {
            var that = this;

            userOptions.enableDebug = this._options.debug;

            this._gameArena = new GameArena(this._container);
            this._ticker = new Ticker(17);
            this._bullets = new BulletFactory(this._gameArena);

            this._player = new Player(this._gameArena, this._ticker, this._bullets);
            this._enemies = new EnemyFactory(this._gameArena, this._ticker, this._player);
            this._props = new PropFactory(this._gameArena, this._player);
            this._hud = new Hud(this._gameArena, this._player);


            this._controllerInterface = new ControllerInterface(this._player, this._ticker, this._hud, this._gameArena);
            require([
                "TimePilot.Controller." + userOptions.controllerType
            ], function (
                Controller
            ) {
                that._currentController = new Controller(that._controllerInterface);
            });

            this._player.setData("level", 1);
            this._gameArena.renderText("Loading", 20, 10, {size: 30});

            this._gameArena.registerAssets([
                "./fonts/font.ttf",
                "./sprites/player/player.png",
                "./sprites/player/explosion.png",
                "./sprites/enemies/basic/level1.png",
                "./sprites/enemies/basic/level2.png",
                "./sprites/enemies/basic/level3.png",
                "./sprites/enemies/basic/level4.png",
                "./sprites/enemies/basic/level5.png",
                "./sprites/enemies/basic/explosion.png",
                "./sprites/props/cloud1.png",
                "./sprites/props/cloud2.png",
                "./sprites/props/cloud3.png"
            ]);
            this._gameArena.preloadAssets(function (obj) {
                if (!obj.remaining) {
                    that._start();
                }
            });
        },

        _start: function () {
            var that = this;


            this._addRandomClouds();

            this._ticker.addSchedule(function () {
                that.pauseGame();
                window.console.warn("Stopping: 50,000 ticks");
            }, 50000);

            this._ticker.addSchedule(function () {
                that._player.reposition();
                that._enemies.reposition();
                that._bullets.reposition();
                that._props.reposition();

                that._spawnEntities();
            }, 1);

            this._ticker.addSchedule(function () {
                that._player.rotate();
                that._player.shoot();
            }, 4);

            this._ticker.addSchedule(function () {
                that._gameArena.clear();
                that._gameArena.setBackgroundColor(CONST.levels[that._data.level].arena.backgroundColor);

                that._props.render(1);

                that._bullets.render();
                that._enemies.render();

                that._player.render();

                that._props.render(2);
                that._hud.render();

            }, 1);

            this._ticker.addSchedule(function () {
                that._enemies.detectPlayerCollision();
            }, 1);

            this._ticker.addSchedule(function () {
                that._enemies.cleanup();
                that._bullets.cleanup();
                that._props.cleanup();
            }, 1);

            this.playGame();
        },

        pauseGame: function () {
            if (this._ticker.getState()) {
                window.console.info("Pausing");
                this._ticker.stop();
                this._hud.pause();
            }
        },

        playGame: function () {
            if (!this._ticker.getState()) {
                this._ticker.start();
            }
        },

        _addListener: function (element, eventName, callback) {
            if (typeof element.addEventListener === "function") {
                element.addEventListener(eventName, callback, false);
            } else if (!!element.attachEvent) {
                element.attachEvent("on" + eventName, callback);
            } else {
                element["on" + eventName] = callback;
            }
        },

        _addRandomClouds: function () {
            var i = 0;
            for (; i < 20; i++) {
                // Clouds
                this._props.create(
                    Math.floor(Math.random() * this._gameArena.width),
                    Math.floor(Math.random() * this._gameArena.height)
                );
            }
        },

        _spawnEntities: function () {
            var data = {},
                angle = 0,
                randomTickInterval = (Math.floor(Math.random() * (1 - 200 + 1)) + 200);
            if ((this._ticker.getTicks() % randomTickInterval === 0) && this._enemies.getCount() < 10)  {
                // Enemies
                data = helpers.getSpawnCoords(this._player.getData(), this._gameArena);
                angle = helpers.findHeading({
                    posX: data.posX,
                    posY: data.posY
                }, {
                    posX: this._player.getData().posX,
                    posY: this._player.getData().posY
                });
                this._enemies.create(data.posX, data.posY, angle);
            }
            if (this._props.getCount() < 20) {
                // Clouds
                data = helpers.getSpawnCoords(this._player.getData(), this._gameArena);
                this._props.create(data.posX, data.posY);
            }
        }
    };

    return TimePilot;
});
