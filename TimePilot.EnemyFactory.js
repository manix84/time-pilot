define("TimePilot.EnemyFactory", [
    "TimePilot.Enemy"
], function (Enemy) {
    /**
     * Construct an enemy factory for managing creation, movement, rendering and removal of enemies.
     * @constructor
     * @param   {Canvas Instance} canvas - Canvas Instance
     * @param   {Ticker Instance} ticker - Ticker Instance
     * @param   {Player Instance} player - Player Instance
     * @returns {Enemy Factory Instance}
     */
    var EnemyFactory = function (canvas, ticker, player) {
        this._enemies = [];
        this._canvas = canvas;
        this._player = player;
        this._ticker = ticker;
    };

    EnemyFactory.prototype = {
        /**
         * Create an enemy instance and keep a record of it in the factory.
         * @method
         */
        create: function () {
            this._enemies.push(
                new Enemy(this._canvas, this._ticker, this._player)
            );
        },

        /**
         * Run all reposition logic.
         * @method
         */
        reposition: function () {
            var i = 0,
                len = this._enemies.length;

            for (; i < len; ++i) {
                this._enemies[i].reposition();
            }
        },

        /**
         * Render all enemies on the canvas.
         * @method
         * @returns {[type]}
         */
        render: function () {
            var i = 0,
                len = this._enemies.length;

            for (; i < len; ++i) {
                this._enemies[i].render();
            }
        }
    };

    return EnemyFactory;
});
