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
     * @param   {Canvas Instance}   gameArena      - Canvas Instance.
     * @param   {Player Instance}   player      - Player Instance.
     * @param   {Number}            posX        - Spawning location on the X axis.
     * @param   {Number}            posY        - Spawning location on the Y axis.
     * @param   {Number}            heading     - Start heading (usually towards the player).
     * @returns {Bullet Instance}
     */

    var Bullet = function (gameArena, player, posX, posY, heading) {
        this._gameArena = gameArena;
        this._player = player;

        this._data = {};
        this._data.posX = posX;
        this._data.posY = posY;
        this._data.heading = heading;

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
         * Get current data for this level
         * @method
         * @returns {object}
         */
        getLevelData: function () {
            return CONSTS.levels[this._level].player.projectile;
        },

        /**
         * Detect if the entity has left a given radius of the player.
         * @method
         * @param   {Number} radius - Maximum radial from player before they are concidered outside the battle.
         * @returns {Boolean} True = entity has left the area, False = entity is still in area.
         */
        detectAreaExit: function (radius) {
            var levelData = this.getLevelData(),
                player = this._player.getData(),
                hasExistedArea;

            hasExistedArea = helpers.detectAreaExit({
                    posX: player.posX + ((this._gameArena.width / 2) - (levelData.width / 2)),
                    posY: player.posY + ((this._gameArena.height / 2) - (levelData.height / 2))
                },
                this.getData(),
                radius
            );

            return hasExistedArea;
        },

        /**
         * Reposition the entity.
         * @method
         */
        reposition: function () {
            var levelData = this.getLevelData(),
                velocity = levelData.velocity,
                heading = this._data.heading;

            this._data.posX += helpers.float(Math.sin(heading * (Math.PI / 180)) * velocity);
            this._data.posY -= helpers.float(Math.cos(heading * (Math.PI / 180)) * velocity);
        },

        /**
         * Render the entity.
         * @method
         */
        render: function () {
            var levelData = this.getLevelData(),
                size = levelData.size,
                color = levelData.color,
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
