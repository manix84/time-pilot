/* global define */
define("TimePilot.ExplosionFactory", [
    "TimePilot.CONSTANTS",
    "TimePilot.Explosion",
    "engine/helpers"
], function (
    CONSTS,
    Explosion,
    helpers
) {

    /**
     * Construct an explosion factory for managing creation, rendering and removal of explosions.
     * @constructor
     * @returns {Explosion Factory Instance}
     */
    var ExplosionFactory = function () {
        this._explosions = [];
    };

    ExplosionFactory.prototype = {
        /**
         * Create an explosion instance and keep a record of it in the factory.
         * @method
         * @param   {Number} posX    - X coordinate to start from.
         * @param   {Number} posY    - Y coordinate to start from.
         */
        create: function (posX, posY) {
            this._explosions.push(
                new Explosion(posX, posY)
            );
        },

        /**
         * If an entity declares it is to be removed, remove it.
         * @method
         */
        cleanup: function () {
            var i;

            for (i in this._explosions) {
                if (this._explosions.hasOwnProperty(i) && this._explosions[i].removeMe) {
                    this._despawn(i);
                }
            }
        },

        /**
         * Render all explosions on the gameArena.
         * @method
         */
        render: function () {
            var i = 0;

            for (i in this._explosions) {
                if (this._explosions.hasOwnProperty(i)) {
                    this._explosions[i].render();
                }
            }
        },

        /**
         * De-spawn specified entity.
         * @method
         * @param   {Number} entityId - Index ID of entity you wish to remove.
         */
        _despawn: function (entityId) {
            this._explosions.splice(entityId, 1);
        },

        /**
         * Clear all explosions from memory.
         */
        clearAll: function () {
            for (var i in this._explosions) {
                if (this._explosions.hasOwnProperty(i)) {
                    this._despawn(i);
                }
            }
        }
    };

    return ExplosionFactory;
});
