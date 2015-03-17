/* global define */
define("TimePilot.Player", [
    "TimePilot.CONSTANTS",
    "TimePilot.userOptions",
    "engine/helpers"
], function (
    CONSTS,
    userOptions,
    helpers
) {
    var playerConst = CONSTS.player;
    /**
     * Player object.
     * @constructor
     * @param   {Canvas Instance} gameArena
     * @param   {Ticker Instance} ticker
     * @returns {Player Instance}
     */
    var Player = function (gameArena, ticker, bulletFactory) {
        this._gameArena = gameArena;
        this._ticker = ticker;
        this._bulletFactory = bulletFactory;

        this._playerSprite = new Image();
        this._playerSprite.src = playerConst.src;

        this._playerDeathSprite = new Image();
        this._playerDeathSprite.src = playerConst.explosion.src;

        this._rotationStep = (360 / playerConst.rotationFrameCount);

        this._data = {
            isAlive: true,
            deathTick: false,
            isFiring: false,
            heading: 90,
            newHeading: false,
            posX: 0,
            posY: 0,
            exploading: 0,
            continues: 0,
            lives: 1,
            score: 0,
            level: 1
        };

        this._lastKnownGoodData = {
            isAlive: true,
            deathTick: false,
            isFiring: false,
            heading: 90,
            newHeading: false,
            posX: 0,
            posY: 0,
            exploading: 0,
            continues: 0,
            lives: 1,
            score: 0,
            level: 1
        };
    };

    Player.prototype = {

        /**
         * Get data for the player.
         * @method
         * @returns {Object}
         */
        getData: function () {
            return this._data;
        },

        /**
         * Set data in the player's data object.
         * @method
         * @param   {String} key  - Key from _data object
         * @param   {Multi} value - Value to be set onto the key from the _data object.
         * @returns {Boolean} Success response.
         */
        setData: function (key, value, isLastKnownGood) {
            if (this._data[key] !== undefined) {
                this._data[key] = value;
                if (!!isLastKnownGood) {
                    this._lastKnownGoodData[key] = value;
                }
                return (this._data[key] === value);
            } else {
                return false;
            }
        },

        /**
         * Reset stored player data.
         */
        resetData: function () {
            for (var property in this._lastKnownGoodData) {
                if (this._lastKnownGoodData.hasOwnProperty(property)) {
                    this._data[property] = this._lastKnownGoodData[property];
                }
            }
        },

        /**
         * Get current data for this level
         * @method
         * @returns {[type]}
         */
        getLevelData: function () {
            return CONSTS.levels[this._data.level].player;
        },

        /**
         * Recalculate player's current position and heading.
         * @method
         */
        reposition: function () {
            var heading = this._data.heading,
                velocity = this.getLevelData().velocity;

            this._data.posX += helpers.float(Math.sin(heading * (Math.PI / 180)) * velocity);
            this._data.posY -= helpers.float(Math.cos(heading * (Math.PI / 180)) * velocity);

            this._gameArena.updatePosition(this._data.posX, this._data.posY);
        },

        /**
         * If newHeading is set, update the current heading by one step towards it.
         */
        rotate: function () {
            if (this._data.newHeading !== false) {
                this._data.heading = helpers.rotateTo(this._data.newHeading, this._data.heading, this._rotationStep);
            }
        },

        startShooting: function () {
            this._data.isShooting = true;
        },

        stopShooting: function () {
            this._data.isShooting = false;
        },

        /**
         * Add bullets when this is tiggered.
         */
        shoot: function () {
            if (this._data.isShooting) {
                var levelData = this.getLevelData();
                this._bulletFactory.create(
                    (this._gameArena.width / 2),
                    (this._gameArena.height / 2),
                    this._data.heading,
                    levelData.projectile.size,
                    levelData.projectile.velocity,
                    levelData.projectile.color
                );
            }
        },

        /**
         * Render the death animation for the player.
         * @protected
         * @method
         */
        _renderPlayerExplosion: function () {
            var explosionData = playerConst.explosion,
                frameX = Math.floor((this._ticker.getTicks() - this._data.deathTick) / explosionData.frameLimiter);

            this._gameArena.renderSprite(this._playerDeathSprite, {
                frameWidth: explosionData.width,
                frameHeight: explosionData.height,
                frameX: frameX,
                frameY: 0,
                posX: ((this._gameArena.width / 2) - (explosionData.width / 2)),
                posY: ((this._gameArena.height / 2) - (explosionData.height / 2))
            });

            if (frameX === explosionData.frames) {
                this._data.isAlive = false;
                this._data.removeMe = true;
            }
        },

        /**
         * Render the player.
         * @method
         */
        render: function () {
            var color = "#F00",
                invincible = (userOptions.enableDebug && userOptions.debug.invincible),
                showHitboxes = (userOptions.enableDebug && userOptions.debug.showHitboxes);

            if (!this._data.deathTick && this._data.isAlive) {
                this._gameArena.renderSprite(this._playerSprite, {
                    frameWidth: playerConst.width,
                    frameHeight: playerConst.height,
                    frameX: Math.floor(this._data.heading / 22.5),
                    frameY: 0,
                    posX: ((this._gameArena.width / 2) - (playerConst.width / 2)),
                    posY: ((this._gameArena.height / 2) - (playerConst.height / 2))
                });
            } else {
                this._renderPlayerExplosion();
            }

            if (showHitboxes || invincible) {
                if (invincible) {
                    color = "#FFD700";
                    playerConst.hitRadius = ((playerConst.width + playerConst.height) / 4);
                }
                this._gameArena.drawCircle(
                    (this._gameArena.width / 2),
                    (this._gameArena.height / 2),
                    playerConst.hitRadius,
                    {
                        strokeColor: color
                    }
                );
            }
        },

        kill: function () {
            if (userOptions.enableDebug && userOptions.debug.invincible) {
                return;
            } else if (!this._data.isAlive) {
                return;
            }
            this._data.deathTick = this._ticker.getTicks();
        }
    };

    return Player;
});
