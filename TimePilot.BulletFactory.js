define("TimePilot.BulletFactory", [
    "engine/helpers",
    "TimePilot.Bullet"
], function (helpers, Bullet) {
    /**
     * Construct an bullet factory for managing creation, movement, rendering and removal of bullets.
     * @constructor
     * @param   {Canvas Instance} canvas - Canvas Instance
     * @param   {Ticker Instance} ticker - Ticker Instance
     * @param   {Player Instance} player - Player Instance
     * @returns {Bullet Factory Instance}
     */
    var BulletFactory = function (gameRules, canvas, ticker, player) {
        this._gameRules = gameRules;
        this._canvas = canvas;
        this._player = player;
        this._ticker = ticker;

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
        create: function (posX, posY, heading) {
            this._bullets.push(
                new Bullet(this._gameRules, this._canvas, this._ticker, this._player, posX, posY, heading)
            );
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
         * Render all bullets on the canvas.
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
