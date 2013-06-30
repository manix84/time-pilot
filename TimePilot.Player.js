define("TimePilot.Player", function () {

    /**
     * Player object.
     * @method
     * @constructor
     * @param   {Canvas Instance}   canvas - An instance of the Canvas Object (./Canvas.js)
     * @param   {Number}            level  - Numeric value of the current level.
     */
    var Player = function (canvas, level) {
        this._canvas = canvas;
        this._level = level;
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
         * Level specific data about the player.
         * @type {Object}
         */
        _levels: {
            1: {
                velocity: 3,
                turn: 5
            }
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
         * Calculate player's current position and heading.
         * @method
         */
        calculate: function () {
            var player = this._data,
                h = this._data.heading,
                s = this._levels[this._level].velocity;

            player.posX += parseFloat((Math.sin(h * (Math.PI / 180)) * s).toFixed(5));
            player.posY -= parseFloat((Math.cos(h * (Math.PI / 180)) * s).toFixed(5));

            this._data.player = player;
        },

        /**
         * Render the player.
         * @method
         */
        render: function () {
            var sprite = new Image();

            sprite.src = "./sprites/player.png";
            sprite.frameWidth = 32;
            sprite.frameHeight = 32;
            sprite.frameX = Math.floor(this._data.heading / 22.5);
            sprite.frameY = 0;
            sprite.posX = ((this._canvas.getCanvas().width / 2) - (sprite.frameWidth / 2));
            sprite.posY = ((this._canvas.getCanvas().height / 2) - (sprite.frameWidth / 2));

            this._canvas.renderSprite(
                sprite
            );
        }
    };

    return Player;
});
