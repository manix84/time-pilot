define("TimePilot.Enemy", [
    "TimePilot.CONSTANTS",
    "engine/helpers"
], function (CONSTS, helpers) {

    /**
     * Creates an enemy to add to the page.
     * @constructor
     * @param   {Canvas Instance}   canvas      - Canvas Instance.
     * @param   {Ticker Instance}   ticker      - Ticker Instance.
     * @param   {Player Instance}   player      - Player Instance.
     * @param   {Number}            posX        - Spawning location on the X axis.
     * @param   {Number}            posY        - Spawning location on the Y axis.
     * @param   {Number}            heading     - Start heading (usually towards the player).
     * @returns {Enemy Instance}
     */

    var Enemy = function (canvas, ticker, player, posX, posY, heading) {
        this._canvas = canvas;
        this._player = player;
        this._ticker = ticker;

        this._data = {};
        this._data.posX = posX;
        this._data.posY = posY;
        this._data.heading = heading;
        this._data.level = 1;

        this._enemySprite = new Image();
        this._enemySprite.src = this.getLevelData().src;
    };

    Enemy.prototype = {

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
        getLevelData: function () {
            return CONSTS.levels[this._data.level].enemies.basic;
        },

        /**
         * Detect if this entity has collided with the player.
         * @method
         * @returns {Boolean}
         */
        detectPlayerCollision: function () {
            var levelData = this.getLevelData(),
                player = this._player.getData();

            var hasExistedArea = helpers.detectCollision({
                    posX: player.posX + ((this._canvas.width / 2) - (levelData.width / 2)),
                    posY: player.posY + ((this._canvas.height / 2) - (levelData.height / 2)),
                    radius: CONSTS.player.hitRadius
                }, {
                    posX: this._data.posX,
                    posY: this._data.posY,
                    radius: levelData.hitRadius
                }
            );

            return hasExistedArea;
        },

        /**
         * Detect if the entity has left a given radius of the player.
         * @method
         * @param   {Number} radius - Maximum radial from player before they are concidered outside the battle.
         * @returns {Boolean} True = entity has left the area, False = entity is still in area.
         */
        detectAreaExit: function (radius) {
            var levelData = this.getLevelData(),
                player = this._player.getData();

            return helpers.detectAreaExit({
                    posX: player.posX + ((this._canvas.width / 2) - (levelData.width / 2)),
                    posY: player.posY + ((this._canvas.height / 2) - (levelData.height / 2))
                }, {
                    posX: this._data.posX,
                    posY: this._data.posY
                },
                radius
            );
        },

        /**
         * Recalculate player's current position and heading.
         * @method
         */
        reposition: function () {
            var enemy = this._data,
                heading = this._data.heading,
                levelData = this.getLevelData(),
                player = this._player.getData(),
                canvas = this._canvas,
                turnTo;

            // Per-Enemy Data

            enemy.posX += helpers.float(Math.sin(heading * (Math.PI / 180)) * levelData.velocity);
            enemy.posY -= helpers.float(Math.cos(heading * (Math.PI / 180)) * levelData.velocity);

            turnTo = helpers.findHeading(enemy, {
                posX: player.posX + ((canvas.width / 2) - (levelData.width / 2)),
                posY: player.posY + ((canvas.height / 2) - (levelData.height / 2))
            });
            turnTo = (Math.floor(turnTo / 22.5) * 22.5);

            enemy.heading = helpers.rotateTo(turnTo, enemy.heading, 22.5);
        },

        /**
         * Render the player.
         * @method
         */
        render: function () {
            var levelData = this.getLevelData();
            this._canvas.renderSprite(this._enemySprite, {
                frameWidth: levelData.width,
                frameHeight: levelData.height,
                frameX: Math.floor(this._data.heading / 22.5),
                frameY: (Math.floor(this._ticker.getTicks() / 10) % 2),
                posX: (this._data.posX - this._player.getData().posX - (levelData.width / 2)),
                posY: (this._data.posY - this._player.getData().posY - (levelData.height / 2))
            });
        }
    };

    return Enemy;
});
