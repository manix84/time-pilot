define("TimePilot.EnemyFactory", [
    "engine/helpers",
    "TimePilot.Enemy"
], function (helpers, Enemy) {
    /**
     * Construct an enemy factory for managing creation, movement, rendering and removal of enemies.
     * @constructor
     * @param   {Canvas Instance} canvas - Canvas Instance
     * @param   {Ticker Instance} ticker - Ticker Instance
     * @param   {Player Instance} player - Player Instance
     * @returns {Enemy Factory Instance}
     */
    var EnemyFactory = function (gameRules, canvas, ticker, player) {
        this._gameRules = gameRules;
        this._canvas = canvas;
        this._player = player;
        this._ticker = ticker;

        this._enemies = [];
    };

    EnemyFactory.prototype = {
        /**
         * Create an enemy instance and keep a record of it in the factory.
         * @method
         * @param   {Number} posX    - X coordinate to start from.
         * @param   {Number} posY    - Y coordinate to start from.
         * @param   {Number} heading - Heading to start from.
         */
        create: function (posX, posY, heading) {
            this._enemies.push(
                new Enemy(this._gameRules, this._canvas, this._ticker, this._player, posX, posY, heading)
            );
        },

        /**
         * Get the current number of spawned entities.
         * @method
         * @returns {Number}
         */
        getCount: function () {
            return this._enemies.length;
        },

        /**
         * Return the data for all entities in an array.
         * @method
         * @returns {Array}
         */
        getData: function () {
            var data = [],
                i = 0;
            for (i in this._enemies) {
                if (this._enemies.hasOwnProperty(i)) {
                    data.push(this._enemies[i].getData());
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

            for (i in this._enemies) {
                if (this._enemies.hasOwnProperty(i)) {
                    this._enemies[i].reposition();
                    if (this._enemies[i].detectAreaExit(500)) {
                        this.despawn(i);
                    }
                }
            }
        },

        /**
         * Render all enemies on the canvas.
         * @method
         */
        render: function () {
            var i = 0;

            for (i in this._enemies) {
                if (this._enemies.hasOwnProperty(i)) {
                    this._enemies[i].render();
                }
            }
        },

        /**
         * Despawn specified entity.
         * @method
         * @param   {Number} entityId - Index ID of entity you wish to remove.
         */
        despawn: function (entityId) {
            this._enemies.splice(entityId, 1);
        }
    };

    return EnemyFactory;
});
