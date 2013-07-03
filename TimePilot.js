define("TimePilot", [
    "engine/Ticker",
    "engine/Canvas",
    "engine/helpers",
    "TimePilot.CONSTANTS",
    "TimePilot.Player",
    "TimePilot.EnemyFactory",
    "TimePilot.BulletFactory"
], function (Ticker, Canvas, helpers, CONST, Player, EnemyFactory, BulletFactory) {

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


            clouds: [],
            explosions: []
        },

        _init: function () {
            var that = this;

            this._canvas = new Canvas(this._container);
            this._ticker = new Ticker(17);
            this._player = new Player(this._canvas);
            this._enemies = new EnemyFactory(this._canvas, this._ticker, this._player);
            this._bullets = new BulletFactory(this._canvas, this._player);

            this._player.setLevel(1);
            this._canvas.renderText("Loading", 20, 10, {size: 30});

            this._canvas.registerAssets([
                "./fonts/font.ttf",
                "./sprites/player.png",
                "./sprites/enemy_level1.png",
                "./sprites/enemy_level2.png",
                "./sprites/enemy_level3.png",
                "./sprites/enemy_level4.png",
                "./sprites/enemy_level5.png",
                "./sprites/cloud1.png",
                "./sprites/cloud2.png",
                "./sprites/cloud3.png"
            ]);
            this._canvas.preloadAssets(function (obj) {
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
                that._canvas.getCanvas().width = that._canvas.getCanvas().width;
                that._canvas.getCanvas().style.background = CONST.levels[that._data.level].arena.backgroundColor;
            }, 1);

            this._ticker.addSchedule(function () {
                that.pauseGame();
                window.console.warn("Stopping: 50,000 ticks");
            }, 50000);

            this._ticker.addSchedule(function () {
                that._player.reposition();
                that._enemies.reposition();
                that._bullets.reposition();

                that.rotatePlayer();
            }, 1);
            this._ticker.addSchedule(function () {
                var playerData = that._player.getData();

                that._renderClouds();

                that._player.render();
                that._enemies.render();
                that._bullets.render();

                that._renderExplosions();

                that._populateArena(); // NEEDS RENAMING
                that._canvas.renderText(that._data.score, 20, 10, {size: 30});
                that._canvas.renderText(
                    playerData.posX.toFixed(2) +
                    " x " +
                    playerData.posY.toFixed(2),
                    20, 40, {size: 15}
                );
                that._canvas.renderText(playerData.heading + "°", 20, 55, {size: 15});
            }, 1);

            this.playGame();
        },

        rotatePlayer: function () {
            var playerData = this._player.getData();
            /* THIS IS PART OF INTERFACE */
            if ((this._ticker.getTicks() - this._data.player.lastFiredTick) > 10 && this._data.player.isFiring) {
                this._data.player.lastFiredTick = this._ticker.getTicks();
                this._bullets.create(
                    (this._canvas.width / 2),
                    (this._canvas.height / 2),
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
                    this._player.setData("heading", this._rotateTo(0, this._player.getData().heading, 22.5));
                    break;
                case 40: // Down
                    this._player.setData("heading", this._rotateTo(180, this._player.getData().heading, 22.5));
                    break;
                case 37: // Left
                    this._player.setData("heading", this._rotateTo(270, this._player.getData().heading, 22.5));
                    break;
                case 39: // Right
                    this._player.setData("heading", this._rotateTo(90, this._player.getData().heading, 22.5));
                    break;
                }
            }
        },

        pauseGame: function () {
            if (this._ticker.getState()) {
                window.console.info("Pausing");
                this._ticker.stop();
                this._canvas.renderText("Paused", 20, 70, {size: 30});
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
            this._addListener(this._canvas.getCanvas(), "click", function () {
                that._keyboardLock.focus();
                that.playGame();
            });
            this._addListener(this._keyboardLock, "keydown", function (event) {
                switch (event.keyCode) {
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

        _rotateTo: function (destinationAngle, currentAngle, stepSize) {
            var direction = Math.atan2(
                    parseFloat(Math.sin((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(15)),
                    parseFloat(Math.cos((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(15))
                );

            if (direction > 0) {
                currentAngle += stepSize;
            } else if (direction < 0) {
                currentAngle -= stepSize;
            }
            currentAngle += currentAngle >= 360 ? -360 : (currentAngle < 0 ? 360 : 0);

            return currentAngle;
        },

        _findAngle: function (targetA, targetB) {
            var angle = Math.atan2(
                (targetA.posX - targetB.posX),
                (targetA.posY - targetB.posY)
            ) * (180 / Math.PI);
            return ((angle > 0) ? (360 - angle) : Math.abs(angle));
        },

        _detectCollision: function (targetA, targetB) {
            var dx = targetA.posX - targetB.posX,
                dy = targetA.posY - targetB.posY,
                dist = targetA.radius + targetB.radius;

            return (dx * dx + dy * dy <= dist * dist);
        },

        _renderExplosions: function () {
            var i = 0,
                spriteData = {},
                sprite = new Image(),
                explosion;

            for (; i < this._data.explosions.length; i++) {
                explosion = this._data.explosions[i];
                sprite.src = "./sprites/enemy_explosion.png";
                spriteData.frameWidth = 32;
                spriteData.frameHeight = 32;
                spriteData.frameX = (this._ticker.getTicks() - explosion.startingTick % 25);
                spriteData.frameY = 0;
                spriteData.posX = (explosion.posX - this._player.getData().posX - (spriteData.frameWidth / 2));
                spriteData.posY = (explosion.posY - this._player.getData().posY - (spriteData.frameHeight / 2));

                this._canvas.renderSprite(sprite, spriteData);

                if (spriteData.frameX === 4) {
                    this._data.explosions.splice(i, 1);
                }
            }
        },

        _renderBoss: function () {
            var spriteData = {},
                sprite = new Image();

            sprite.src = "./sprites/boss_level" + this._data.level + ".png";
            spriteData.frameWidth = 64;
            spriteData.frameHeight = 32;
            spriteData.frameX = 0;
            spriteData.frameY = 0;
            spriteData.posX = (0 - this._player.getData().posX);
            spriteData.posY = (0 - this._player.getData().posY);

            this._canvas.renderSprite(sprite, spriteData);
        },

        _renderClouds: function () {
            var i = 0,
                l = this._data.level,
                s = 0,
                playerData = this._player.getData(),
                h = playerData.heading,
                cloudType = "cloud",
                cloudData = {
                    1: { width: 32, height: 18, speed: 1 },
                    2: { width: 60, height: 28, speed: 0.5 },
                    3: { width: 92, height: 32, speed: 0 }
                },
                spriteData = {},
                sprite = new Image(),
                cloud;

            spriteData.frameX = 0;
            spriteData.frameY = 0;

            for (; i < this._data.clouds.length; i++) {
                cloud = this._data.clouds[i];
                s = cloudData[cloud.size].speed;

                this._data.clouds[i].posX += parseFloat((Math.sin(h * (Math.PI / 180)) * s).toFixed(5));
                this._data.clouds[i].posY -= parseFloat((Math.cos(h * (Math.PI / 180)) * s).toFixed(5));

                sprite.src = "./sprites/" + cloudType + cloud.size + ".png";
                spriteData.frameWidth = cloudData[cloud.size].width;
                spriteData.frameHeight = cloudData[cloud.size].height;

                spriteData.posX = (cloud.posX - playerData.posX - (spriteData.frameWidth / 2));
                spriteData.posY = (cloud.posY - playerData.posY - (spriteData.frameHeight / 2));

                this._canvas.renderSprite(sprite, spriteData);

                if (spriteData.posX > (this._canvas.width + CONST.levels[this._data.level].arena.spawningRadius) ||
                    spriteData.posX < -CONST.levels[this._data.level].arena.spawningRadius ||
                    spriteData.posY > (this._canvas.height + CONST.levels[this._data.level].arena.spawningRadius) ||
                    spriteData.posY < -CONST.levels[this._data.level].arena.spawningRadius) {
                    this._data.clouds.splice(i, 1);
                }
            }
        },

        _addExplosion: function (posX, posY, isBoss) {
            isBoss = isBoss || false;

            this._data.explosions.push({
                isBoss: (isBoss ? "boss" : "enemy"),
                startingTick: this._ticker.getTicks(),
                posX: posX,
                posY: posY
            });
        },

        _addCloud: function (posX, posY, size) {
            this._data.clouds.push({
                posX: posX,
                posY: posY,
                size: size || Math.ceil(Math.random() * 3)
            });
        },

        _addRandomClouds: function () {
            var i = 0;
            for (; i < 20; i++) {
                // Clouds
                this._addCloud(
                    Math.floor(Math.random() * this._canvas.width),
                    Math.floor(Math.random() * this._canvas.height)
                );
            }
        },

        _populateArena: function () {
            var data = {},
                angle = 0;
            if ((this._ticker.getTicks() % 50 === 0) && this._enemies.getCount() < 10)  {
                // Enemies
                data = helpers.getSpawnCoords(this._player.getData(), this._canvas);
                angle = this._findAngle({ posX: data.posX, posY: data.posY }, {
                    posX: this._player.getData().posX,
                    posY: this._player.getData().posY
                });
                this._enemies.create(data.posX, data.posY, angle);
            }
            if (this._data.clouds.length < 20) {
                // Clouds
                data = helpers.getSpawnCoords(this._player.getData(), this._canvas);
                this._addCloud(data.posX, data.posY);
            }
        }
    };

    return TimePilot;
});
