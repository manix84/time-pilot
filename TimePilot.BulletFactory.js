define("TimePilot.BulletFactory", [
    "engine/helpers",
    "TimePilot.Bullet"
], function (
    helpers,
    Bullet
) {
    /**
     * Construct an bullet factory for managing creation, movement, rendering and removal of bullets.
     * @constructor
     * @param   {Canvas Instance} gameArena - Canvas Instance
     * @param   {Player Instance} player - Player Instance
     * @returns {Bullet Factory Instance}
     */
    var BulletFactory = function (gameArena) {
        this._gameArena = gameArena;

        this._bullets = [];
    };

    BulletFactory.prototype = {
        /**
         * Create an bullet instance and keep a record of it in the factory.
         * @method
         * @param   {Number} posX    - X coordinate to start from.
         * @param   {Number} posY    - Y coordinate to start from.
         * @param   {Number} heading - Heading to start from.
         */
        create: function (posX, posY, heading, size, velocity, color) {
            this._bullets.push(
                new Bullet(this._gameArena, posX, posY, heading, size, velocity, color)
            );
        },

        /**
         * Get the current number of spawned entities.
         * @method
         * @returns {Number}
         */
        getCount: function () {
            return this._bullets.length;
        },

        /**
         * Return the data for all entities in an array.
         * @method
         * @returns {Array}
         */
        getData: function () {
            var data = [],
                i = 0;
            for (i in this._bullets) {
                if (this._bullets.hasOwnProperty(i)) {
                    data.push(this._bullets[i].getData());
                }
            }
            return data;
        },

        /**
         * Run all reposition logic.
         * @method
         */
        reposition: function () {
            var i;

            for (i in this._bullets) {
                if (this._bullets.hasOwnProperty(i)) {
                    this._bullets[i].reposition();
                    if (this._bullets[i].detectAreaExit(500)) {
                        this.despawn(i);
                    }
                }
            }
        },

        /**
         * Render all bullets on the gameArena.
         * @method
         */
        render: function () {
            var i = 0;

            for (i in this._bullets) {
                if (this._bullets.hasOwnProperty(i)) {
                    this._bullets[i].render();
                }
            }
        },

        /**
         * Despawn specified entity.
         * @method
         * @param   {Number} entityId - Index ID of entity you wish to remove.
         */
        despawn: function (entityId) {
            this._bullets.splice(entityId, 1);
        }
    };

    return BulletFactory;
});
