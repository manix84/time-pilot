/* global define */
define("TimePilot.BulletFactory", [
    "TimePilot.CONSTANTS",
    "TimePilot.Bullet",
    "engine/Sound",
    "engine/helpers"
], function (
    CONSTS,
    Bullet,
    SoundEngine,
    helpers
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
        this._bulletSound = new SoundEngine(CONSTS.player.projectile.sound.src);
    };

    BulletFactory.prototype = {
        /**
         * Create an bullet instance and keep a record of it in the factory.
         * @method
         * @param {Number} originX    - X coordinate to start from.
         * @param {Number} originY    - Y coordinate to start from.
         * @param {Number} heading    - Heading to start from.
         * @param {Number} size       - Pixel dimentions for projectile.
         * @param {Number} velocity   - Number of pixels to move per frame.
         * @param {String} color      - Color of the projectile.
         */
        create: function (originX, originY, heading, size, velocity, color) {
            this._bullets.push(
                new Bullet(this._gameArena, originX, originY, heading, size, velocity, color)
            );
            this._bulletSound.stop();
            this._bulletSound.play();
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
         * If an entity declares it is to be removed, remove it.
         * @method
         */
        cleanup: function () {
            var i;

            for (i in this._bullets) {
                if (this._bullets.hasOwnProperty(i) && this._bullets[i].removeMe) {
                    this._despawn(i);
                }
            }
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
         * @param {Number} entityId - Index ID of entity you wish to remove.
         */
        _despawn: function (entityId) {
            this._bullets.splice(entityId, 1);
        },

        /**
         * Clear all bullets from memory.
         */
        clearAll: function () {
            for (var i in this._bullets) {
                if (this._bullets.hasOwnProperty(i)) {
                    this._despawn(i);
                }
            }
        }
    };

    return BulletFactory;
});
