define("TimePilot.Player", [
    "engine/helpers"
], function (helpers) {

    /**
     * Constant data about the player.
     * @constant
     * @type {Object}
     */
    var PLAYER_DATA = {
        height: 32,
        width: 32,
        hitRadius: 8,
        src: "./sprites/player.png"
    };

    /**
     * Constant level specific data about the player.
     * @constant
     * @type {Object}
     */
    var LEVEL_DATA = {
        1: {
            velocity: 4,    // Higher = Faster
            turnInterval: 5 // Lower = Faster
        }
    };

    /**
     * Player object.
     * @constructor
     * @param   {Canvas Instance} canvas
     * @returns {Player Instance}
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
            alive: true
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
        reposition: function () {
            var player = this._data,
                heading = this._data.heading,
                velocity = this.getLevelData().velocity;

            player.posX += helpers.float(Math.sin(heading * (Math.PI / 180)) * velocity);
            player.posY -= helpers.float(Math.cos(heading * (Math.PI / 180)) * velocity);

            this._data.player = player;
        },

        /**
         * Render the player.
         * @method
         */
        render: function () {
            this._canvas.renderSprite(PLAYER_DATA.src, {
                frameWidth: PLAYER_DATA.width,
                frameHeight: PLAYER_DATA.height,
                frameX: Math.floor(this._data.heading / 22.5),
                frameY: 0,
                posX: ((this._canvas.width / 2) - (PLAYER_DATA.width / 2)),
                posY: ((this._canvas.height / 2) - (PLAYER_DATA.height / 2))
            });
        },

        explode: function () {}
    };

    return Player;
});
