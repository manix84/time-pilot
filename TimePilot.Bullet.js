define("TimePilot.Bullet", [
    "TimePilot.CONSTANTS",
    "engine/helpers"
], function (
    CONSTS,
    helpers
) {

    /**
     * Creates a bullet to add to render.
     * @constructor
     * @param   {Canvas Instance}   gameArena   - Canvas Instance.
     * @param   {Number}            posX        - Spawning location on the X axis.
     * @param   {Number}            posY        - Spawning location on the Y axis.
     * @param   {Number}            heading     - Start heading (usually towards the player).
     * @returns {Bullet Instance}
     */

    var Bullet = function (gameArena, posX, posY, heading, newOptions) {
        newOptions = newOptions || {};

        this._gameArena = gameArena;

        this._data = {};
        this._data.posX = posX;
        this._data.posY = posY;
        this._data.heading = heading;


        this._data.options = {
            size: newOptions.size || 4,
            velocity: newOptions.velocity || 20,
            color: newOptions.color || "#FFF"
        };

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
         * @param   {Number} radius - Maximum radial from player before they are concidered outside the battle.
         * @returns {Boolean} True = entity has left the area, False = entity is still in area.
         */
        detectAreaExit: function (radius) {
            // return helpers.detectAreaExit({
            //         posX: this._gameArena.posX + ((this._gameArena.width / 2) - (this._data.options.width / 2)),
            //         posY: this._gameArena.posY + ((this._gameArena.height / 2) - (this._data.options.height / 2))
            //     },
            //     this.getData(),
            //     radius
            // );
        },

        /**
         * Reposition the entity.
         * @method
         */
        reposition: function () {
            var velocity = this._data.options.velocity,
                heading = this._data.heading;

            this._data.posX += helpers.float(Math.sin(heading * (Math.PI / 180)) * velocity);
            this._data.posY -= helpers.float(Math.cos(heading * (Math.PI / 180)) * velocity);
        },

        /**
         * Render the entity.
         * @method
         */
        render: function () {
            var size = this._data.options.size,
                color = this._data.options.color,
                context = this._gameArena.getContext();

            context.fillStyle = color;
            context.fillRect(
                this._data.posX - (size / 2),
                this._data.posY - (size / 2),
                size, size
            );
        }
    };

    return Bullet;
});
