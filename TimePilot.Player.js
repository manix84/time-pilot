define("TimePilot.Player", [
    "TimePilot.CONSTANTS",
    "engine/helpers"
], function (CONSTS, helpers) {

    /**
     * Player object.
     * @constructor
     * @param   {Canvas Instance} canvas
     * @param   {Ticker Instance} ticker
     * @returns {Player Instance}
     */
    var Player = function (canvas, ticker) {
        this._canvas = canvas;
        this._ticker = ticker;

        this._playerSprite = new Image();
        this._playerSprite.src = CONSTS.player.src;

        this._data = {
            isFiring: false,
            heading: 90,
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
            return CONSTS.levels[this._data.level].player;
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
            this._canvas.renderSprite(this._playerSprite, {
                frameWidth: CONSTS.player.width,
                frameHeight: CONSTS.player.height,
                frameX: Math.floor(this._data.heading / 22.5),
                frameY: 0,
                posX: ((this._canvas.width / 2) - (CONSTS.player.width / 2)),
                posY: ((this._canvas.height / 2) - (CONSTS.player.height / 2))
            });
        },

        kill: function () {
            this._data.isDead = true;
            this._deathTick = this._ticker.getTicks();
        }
    };

    return Player;
});
