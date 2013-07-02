define("TimePilot.Enemy", [
    "engine/helpers"
], function (helpers) {

    /**
     * Level specific data about the player.
     * @constant
     * @type {Object}
     */
    var LEVEL_DATA = {
        1: {
            src: "./sprites/enemy_level1.png",
            velocity: 3,
            turn: 5,
            height: 32,
            width: 32,
            firingChance: 0.2,
            hitRadius: 8,
            canRotate: true
        }
    };

    /**
     * Creates an enemy to add to the page.
     * @constructor
     * @param   {Object}            gameRules   - Object containing basic game rules.
     * @param   {Canvas Instance}   canvas      - Canvas Instance.
     * @param   {Ticker Instance}   ticker      - Ticker Instance.
     * @param   {Player Instance}   player      - Player Instance.
     * @param   {Number}            posX        - Spawning location on the X axis.
     * @param   {Number}            posY        - Spawning location on the Y axis.
     * @param   {Number}            heading     - Start heading (usually towards the player).
     * @returns {Enemy Instance}
     */

    var Enemy = function (gameRules, canvas, ticker, player, posX, posY, heading) {
        this._gameRules = gameRules;
        this._canvas = canvas;
        this._player = player;
        this._ticker = ticker;

        this._data = {};
        this._data.posX = posX;
        this._data.posY = posY;
        this._data.heading = heading;
        this._data.isInArena = true;
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
         * The current level.
         * @type {Number}
         */
        _level: 1,

        /**
         * Set current level.
         * @method
         * @param   {Number} level - Level number to be set.
         * @returns {Boolean}
         */
        setLevel: function (level) {
            this._level = level;
            return (this._level === level);
        },

        /**
         * Get current data for this level
         * @method
         * @returns {object}
         */
        getLevelData: function () {
            return LEVEL_DATA[this._level];
        },

        detectAreaExit: function (arenaSize) {
            var levelData = this.getLevelData(),
                player = this._player.getData(),
                hasExistedArea;
            hasExistedArea = helpers.detectAreaExit({
                    posX: player.posX + ((this._canvas.width / 2) - (levelData.width / 2)),
                    posY: player.posY + ((this._canvas.height / 2) - (levelData.height / 2))
                },
                this.getData(),
                arenaSize
            );

            return hasExistedArea;
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
            this._canvas.renderSprite(levelData.src, {
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
