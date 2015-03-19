/* global define */
define("TimePilot.Bullet", [
    "TimePilot.CONSTANTS",
    "TimePilot.userOptions",
    "engine/helpers"
], function (
    CONSTS,
    userOptions,
    helpers
) {

    /**
     * Creates a bullet to add to render.
     * @constructor
     * @param   {Canvas Instance}   gameArena   - Canvas Instance.
     * @param   {Number}            originX     - Spawning location on the X axis.
     * @param   {Number}            originY     - Spawning location on the Y axis.
     * @param   {Number}            heading     - Start heading (usually towards the player).
     * @returns {Bullet Instance}
     */

    var Bullet = function (gameArena, originX, originY, heading, size, velocity, color) {
        this._gameArena = gameArena;

        this._data = {};
        this._data.posX = originX;
        this._data.posY = originY;
        this._data.heading = heading;
        this._data.size = size;
        this._data.velocity = velocity;
        this._data.color = color;

        this.removeMe = false;
    };

    Bullet.prototype = {

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
         * Detect if the entity has left a given radius of the player.
         * @method
         * @protected
         */
        _checkInArena: function () {
            if (this.removeMe) {
                return;
            }

            this.removeMe = helpers.detectAreaExit({
                    posX: (this._data.size / 2),
                    posY: (this._data.size / 2)
                }, {
                    posX: this._data.posX,
                    posY: this._data.posY
                },
                CONSTS.limits.despawnRadius
            );
        },

        /**
         * Reposition the entity.
         * @method
         */
        reposition: function () {
            var velocity = this._data.velocity,
                heading = this._data.heading;

            this._data.posX += helpers.float(Math.sin(heading * (Math.PI / 180)) * velocity);
            this._data.posY -= helpers.float(Math.cos(heading * (Math.PI / 180)) * velocity);

            this._checkInArena();
        },

        /**
         * Render the entity.
         * @method
         */
        render: function () {
            var size = this._data.size,
                color = this._data.color,
                context = this._gameArena.getContext();

            context.fillStyle = color;
            context.fillRect(
                this._data.posX - (size / 2),
                this._data.posY - (size / 2),
                size, size
            );

            if (userOptions.enableDebug && userOptions.debug.showHitboxes) {
                this._gameArena.drawCircle(
                    this._data.posX,
                    this._data.posY,
                    this._data.size, {
                        strokeColor: "#0F0"
                    }
                );
            }
        }
    };

    return Bullet;
});
