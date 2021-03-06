/* global define */
define("TimePilot.Player", [
    "TimePilot.CONSTANTS",
    "TimePilot.dataStore",
    "TimePilot.userOptions",
    "engine/Sound",
    "engine/helpers"
], function (
    CONSTS,
    dataStore,
    userOptions,
    SoundEngine,
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
    var Player = function () {
        this._gameArena = dataStore._gameArena;
        this._gameTicker = dataStore._gameTicker;
        this._bulletFactory = dataStore._bullets;

        this._playerSprite = new Image();
        this._playerSprite.src = playerConst.sprite.src;

        this._playerDeathSprite = new Image();
        this._playerDeathSprite.src = playerConst.explosion.sprite.src;

        this._explosionSound = new SoundEngine(playerConst.explosion.sound.src);

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
            lives: 3,
            score: 0,
            level: 1
        };

        this._dataDefaults = helpers.cloneObject(this._data);
    };

    Player.prototype = {

        /**
         * Get data for the player.
         * @method
         * @returns {Object}
         */
        getData: function (key) {
            if (!key) {
                return this._data;
            } else if (this._data.hasOwnProperty(key)) {
                return this._data[key];
            }
            return;
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
                    this._dataDefaults[key] = value;
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
            this._data = helpers.cloneObject(this._dataDefaults);
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
            if (this._data.isAlive && this._data.newHeading !== false) {
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
            if (this._data.isAlive && this._data.isShooting) {
                this._bulletFactory.create(
                    0,
                    0,
                    this._data.heading,
                    playerConst.projectile.size,
                    playerConst.projectile.velocity,
                    playerConst.projectile.color
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
                frameX = Math.floor((this._gameTicker.getTicks() - this._data.deathTick) / explosionData.frameLimiter);

            this._gameArena.renderSprite(this._playerDeathSprite, {
                frameWidth: explosionData.width,
                frameHeight: explosionData.height,
                frameX: frameX,
                frameY: 0,
                posX: -(explosionData.width / 2),
                posY: -(explosionData.height / 2)
            });

            if (frameX === explosionData.frames) {
                this._data.removeMe = true;
            }
        },

        /**
         * Render the player.
         * @method
         */
        render: function () {
            var color = "#F00";

            if (!this._data.deathTick && this._data.isAlive) {
                this._gameArena.renderSprite(this._playerSprite, {
                    frameWidth: playerConst.width,
                    frameHeight: playerConst.height,
                    frameX: Math.floor(this._data.heading / 22.5),
                    frameY: 0,
                    posX: -(playerConst.width / 2),
                    posY: -(playerConst.height / 2)
                });
            } else {
                this._renderPlayerExplosion();
            }

            if (userOptions.enableDebug && (userOptions.debug.invincible || userOptions.debug.showHitboxes)) {
                if (userOptions.debug.invincible) {
                    color = helpers.getRandomColor();
                    playerConst.hitRadius = ((playerConst.width + playerConst.height) / 4);
                }
                this._gameArena.drawCircle(
                    0,
                    0,
                    playerConst.hitRadius,
                    {
                        borderColor: color
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
            this._data.isAlive = false;
            this._data.deathTick = this._gameTicker.getTicks();
            this._explosionSound.stop();
            this._explosionSound.play();
        }
    };

    return Player;
});
