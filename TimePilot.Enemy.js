/* global define */
define("TimePilot.Enemy", [
    "TimePilot.CONSTANTS",
    "TimePilot.userOptions",
    "engine/helpers"
], function (
    CONSTS,
    userOptions,
    helpers
) {

    /**
     * Creates an enemy to add to the page.
     * @constructor
     * @param   {Canvas Instance}   gameArena      - Canvas Instance.
     * @param   {Ticker Instance}   ticker      - Ticker Instance.
     * @param   {Player Instance}   player      - Player Instance.
     * @param   {Number}            posX        - Spawning location on the X axis.
     * @param   {Number}            posY        - Spawning location on the Y axis.
     * @param   {Number}            heading     - Start heading (usually towards the player).
     * @returns {Enemy Instance}
     */

    var Enemy = function (gameArena, ticker, level, player, posX, posY, heading) {
        this._gameArena = gameArena;
        this._player = player;
        this._ticker = ticker;

        this._data = {};
        this._data.posX = posX;
        this._data.posY = posY;
        this._data.heading = heading;
        this._data.level = level || 1;
        this._data.deathTick = false;
        this._data.tickOffset = Math.floor(Math.random() * 100);

        this.hasDied = false;
        this.removeMe = false;

        this._enemySprite = new Image();
        this._enemySprite.src = this.getLevelData().sprite.src;
    };

    Enemy.prototype = {

        /**
         * Get data for the entity.
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
         * Set data in the entity"s data object.
         * @method
         * @param   {String} key  - Key from _data object
         * @param   {Multi} value - Value to be set onto the key from the _data object.
         * @returns {Boolean} Success response.
         */
        setData: function (key, value) {
            if (this._data[key] !== undefined) {
                this._data[key] = value;
                return (this._data[key] === value);
            } else {
                return false;
            }
        },

        /**
         * Get current data for this level
         * @method
         * @returns {object}
         */
        getLevelData: function (key) {
            if (!key) {
                return CONSTS.levels[this._data.level].enemies.basic;
            } else if (CONSTS.levels[this._data.level].enemies.basic.hasOwnProperty(key)) {
                return CONSTS.levels[this._data.level].enemies.basic[key];
            }
            return;
        },

        /**
         * Detect if this entity has collided with the player.
         * @method
         * @returns {Boolean}
         */
        detectCollision: function (objectPosX, objectPosY, objectHitRadius) {
            var levelData = this.getLevelData();

            return helpers.detectCollision({
                posX: objectPosX,
                posY: objectPosY,
                radius: objectHitRadius
            }, {
                posX: this._data.posX,
                posY: this._data.posY,
                radius: levelData.hitRadius
            });
        },

        /**
         * Detect if the entity has left a given radius of the player.
         * @method
         * @protected
         * @param   {Number} radius - Maximum radial from player before they are concidered outside the battle.
         * @returns {Boolean} True = entity has left the area, False = entity is still in area.
         */
        _checkInArena: function () {
            var levelData = this.getLevelData();

            if (this.removeMe) {
                return;
            }

            this.removeMe = helpers.detectAreaExit({
                    posX: this._gameArena.posX + ((levelData.width / 2)),
                    posY: this._gameArena.posY + ((levelData.height / 2))
                }, {
                    posX: this._data.posX,
                    posY: this._data.posY
                },
                CONSTS.limits.despawnRadius
            );
        },
        /**
         * Recalculate entity's current position and heading.
         * @method
         */
        reposition: function () {
            var enemy = this._data,
                heading = this._data.heading,
                levelData = this.getLevelData(),
                player = this._player.getData(),
                gameArena = this._gameArena,
                tick = (this._ticker.getTicks() - this._data.tickOffset),
                turnTo;

            // Per-Enemy Data
            enemy.posX += helpers.float(Math.sin(heading * (Math.PI / 180)) * levelData.velocity);
            enemy.posY -= helpers.float(Math.cos(heading * (Math.PI / 180)) * levelData.velocity);

            this._checkInArena();

            if (!this.removeMe && tick % levelData.turnLimiter === 0) {
                turnTo = helpers.findHeading(
                    this._data,
                    {
                        posX: player.posX + ((levelData.width / 2)),
                        posY: player.posY + ((levelData.height / 2))
                    }
                );
                turnTo = (Math.floor(turnTo / 22.5) * 22.5);

                enemy.heading = helpers.rotateTo(turnTo, enemy.heading, 22.5);
            }

        },

        /**
         * Render the entity normally.
         * @protected
         * @method
         */
        _render: function () {
            var levelData = this.getLevelData();

            this._gameArena.renderSprite(this._enemySprite, {
                frameWidth: levelData.width,
                frameHeight: levelData.height,
                frameX: Math.floor(this._data.heading / 22.5),
                frameY: (Math.floor(this._ticker.getTicks() / 10) % 2),
                posX: (this._data.posX - this._player.getData().posX - (levelData.width / 2)),
                posY: (this._data.posY - this._player.getData().posY - (levelData.height / 2))
            });
        },

        /**
         * Render the death animation for the entity.
         * @protected
         * @method
         */
        _renderDeath: function () {
            var explosionData = this.getLevelData().explosion,
                frameX = Math.floor((this._ticker.getTicks() - this._data.deathTick) / explosionData.frameLimiter);

            this._enemySprite.src = explosionData.sprite.src;

            this._gameArena.renderSprite(this._enemySprite, {
                frameWidth: explosionData.width,
                frameHeight: explosionData.height,
                frameX: frameX,
                frameY: 0,
                posX: (this._data.posX - this._player.getData().posX - (explosionData.width / 2)),
                posY: (this._data.posY - this._player.getData().posY - (explosionData.height / 2))
            });

            if (frameX === explosionData.frames) {
                this.removeMe = true;
            }
        },

        /**
         * Render the entity.
         * @method
         */
        render: function () {
            var levelData = this.getLevelData();

            if (!this._data.deathTick) {
                this._render();
            } else {
                this._renderDeath();
            }

            if (userOptions.enableDebug && userOptions.debug.showHitboxes) {
                this._gameArena.drawCircle(
                    (this._data.posX - this._player.getData().posX),
                    (this._data.posY - this._player.getData().posY),
                    levelData.hitRadius, {
                        strokeColor: "#F00"
                    }
                );
            }
        },

        kill: function () {
            this.hasDied = true;
            this._data.deathTick = this._ticker.getTicks();
            this._player.setData("score",
                (this._player.getData("score") + this.getLevelData("deathValue"))
            );
        }
    };

    return Enemy;
});
