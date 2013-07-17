define("TimePilot", [
    "engine/Ticker",
    "engine/GameArena",
    "engine/helpers",
    "TimePilot.CONSTANTS",
    "TimePilot.Player",
    "TimePilot.EnemyFactory",
    "TimePilot.BulletFactory",
    "TimePilot.PropFactory",
    "TimePilot.Hud"
], function (
    Ticker,
    GameArena,
    helpers,
    CONST,
    Player,
    EnemyFactory,
    BulletFactory,
    PropFactory,
    Hud
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
            baseUrl: ""
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

            this._gameArena = new GameArena(this._container);
            this._ticker = new Ticker(17);
            this._player = new Player(this._gameArena, this._ticker);
            this._enemies = new EnemyFactory(this._gameArena, this._ticker, this._player);
            this._bullets = new BulletFactory(this._gameArena, this._player);
            this._props = new PropFactory(this._gameArena, this._player);
            this._hud = new Hud(this._gameArena, this._player);

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

            this._elementContruction();
            this._keyboardLock.focus();

            this._addRandomClouds();


            this._ticker.addSchedule(function () {
                that._gameArena.getCanvas().width = that._gameArena.getCanvas().width;
                that._gameArena.getCanvas().style.background = CONST.levels[that._data.level].arena.backgroundColor;
            }, 1);

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
                that.rotatePlayer();
            }, 1);

            this._ticker.addSchedule(function () {
                that._props.render(1);

                that._player.render();
                that._enemies.render();
                that._bullets.render();

                that._props.render(2);
                that._hud.render();

            }, 1);

            this._ticker.addSchedule(function () {
                that._enemies.detectPlayerCollision();
            }, 1);

            this._ticker.addSchedule(function () {
                that._enemies.detectArenaExit();
            }, 1);

            this._ticker.addSchedule(function () {
                that._enemies.cleanup();
                that._props.cleanup();
            }, 1);

            this.playGame();
        },

        rotatePlayer: function () {
            var playerData = this._player.getData();
            /* THIS IS PART OF INTERFACE */
            if ((this._ticker.getTicks() - this._data.player.lastFiredTick) > 10 && this._data.player.isFiring) {
                this._data.player.lastFiredTick = this._ticker.getTicks();
                this._bullets.create(
                    (this._gameArena.width / 2),
                    (this._gameArena.height / 2),
                    playerData.heading
                );
            }
            /* THIS IS PART OF INTERFACE */

            // These tick delays don't work... They cause massive delay, to extreams of no movement/firing.
            // @TODO: Investigate a better method of slowing rotation and weapons fire.
            if ((this._ticker.getTicks() - this._data.player.lastMovedTick) > 4) {
                this._data.player.lastMovedTick = this._ticker.getTicks();
                switch (this._data.player.direction) {
                case 38: // Up
                    this._player.setData("heading", helpers.rotateTo(0, this._player.getData().heading, 22.5));
                    break;
                case 40: // Down
                    this._player.setData("heading", helpers.rotateTo(180, this._player.getData().heading, 22.5));
                    break;
                case 37: // Left
                    this._player.setData("heading", helpers.rotateTo(270, this._player.getData().heading, 22.5));
                    break;
                case 39: // Right
                    this._player.setData("heading", helpers.rotateTo(90, this._player.getData().heading, 22.5));
                    break;
                }
            }
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
                window.console.info("Continuing");
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

        _elementContruction: function () {
            var that = this;

            this._keyboardLock = document.createElement("input");
            this._keyboardLock.setAttribute("style", "position:absolute;left:-999px;");
            this._keyboardLock.setAttribute("type", "text");
            this._addListener(this._gameArena.getCanvas(), "click", function () {
                that._keyboardLock.focus();
                that.playGame();
            });
            this._addListener(this._keyboardLock, "keydown", function (event) {
                switch (event.keyCode) {
                case 70: // "F"
                    that._gameArena.toggleFullScreen();
                    break;
                case 80: // "P"
                    if (that._ticker.getState()) {
                        that.pauseGame();
                    } else {
                        that.playGame();
                    }
                    break;
                case 37: // LEFT
                case 38: // UP
                case 39: // RIGHT
                case 40: // DOWN
                    event.preventDefault();
                    if (!that._data.player.direction) {
                        that._data.player.direction = event.keyCode;
                    }
                    break;
                case 32: // SPACE BAR
                    event.preventDefault();
                    that._data.player.isFiring = true;
                    break;
                case 27: // ESC
                    that.pauseGame();
                    window.console.info("Stopping at users request.");
                    break;
                }
            });
            this._addListener(this._keyboardLock, "keyup", function (event) {
                switch (event.keyCode) {
                case 37: // LEFT
                case 38: // UP
                case 39: // RIGHT
                case 40: // DOWN
                    event.preventDefault();
                    that._data.player.direction = false;
                    break;
                case 32: // SPACE BAR
                    that._data.player.isFiring = false;
                    break;
                }
            });
            this._container.appendChild(this._keyboardLock);
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
