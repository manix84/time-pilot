define("TimePilot.Player", [
    "lib/helpers"
], function (helpr) {

    /**
     * Level specific data about the player.
     * @constant
     * @type {Object}
     */
    var LEVEL_DATA = {
        1: {
            velocity: 3,
            turn: 5
        }
    };

    /**
     * Player object.
     * @method
     * @constructor
     * @param   {Canvas Instance}   canvas - An instance of the Canvas Object (./Canvas.js)
     */
    var Player = function (canvas) {
        this._canvas = canvas;
    };

    Player.prototype = {

        /**
         * Stored data about the player.
         * @type {Object}
         */
        _data: {
            isFiring: false,
            heading: 90,
            posX: 0,
            posY: 0,
            height: 32,
            width: 32,
            hitRadius: 8
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
         * @returns {[type]}
         */
        getLevelData: function () {
            return LEVEL_DATA[this._level];
        },

        /**
         * Recalculate player's current position and heading.
         * @method
         */
        resposition: function () {
            var player = this._data,
                h = this._data.heading,
                s = this.getLevelData().velocity;

            player.posX += helpr.float(Math.sin(h * (Math.PI / 180)) * s);
            player.posY -= helpr.float(Math.cos(h * (Math.PI / 180)) * s);

            this._data.player = player;
        },

        /**
         * Render the player.
         * @method
         */
        render: function () {
            var spriteSrc = "./sprites/player.png",
                spriteData = {
                    frameWidth: 32,
                    frameHeight: 32,
                    frameX: Math.floor(this._data.heading / 22.5),
                    frameY: 0,
                    posX: ((this._canvas.getCanvas().width / 2) - (32 / 2)),
                    posY: ((this._canvas.getCanvas().height / 2) - (32 / 2))
                };
            this._canvas.renderSprite(
                spriteSrc,
                spriteData
            );
        },

        explode: function () {}
    };

    return Player;
});
