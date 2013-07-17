define("TimePilot.PropFactory", [
    "TimePilot.Prop"
], function (
    Prop
) {

    var PropFactory = function (gameArena, player) {
        this._gameArena = gameArena;
        this._player = player;

        this._props = [];
    };

    PropFactory.prototype = {
        /**
         * Create a prop instance and keep a record of it in the factory.
         * @method
         * @param   {Number} posX    - X coordinate to start from.
         * @param   {Number} posY    - Y coordinate to start from.
         */
        create: function (posX, posY) {
            this._props.push(
                new Prop(this._gameArena, this._player, posX, posY)
            );
        },

        /**
         * Get the current number of spawned entities.
         * @method
         * @returns {Number}
         */
        getCount: function () {
            return this._props.length;
        },

        /**
         * Return the data for all prop entities in an array.
         * @method
         * @returns {Array}
         */
        getData: function () {
            var data = [],
                i = 0;
            for (i in this._props) {
                if (this._props.hasOwnProperty(i)) {
                    data.push(this._props[i].getData());
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

            for (i in this._props) {
                if (this._props.hasOwnProperty(i) && this._props[i].getData().removeMe) {
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

            for (i in this._props) {
                if (this._props.hasOwnProperty(i)) {
                    this._props[i].reposition();
                }
            }
        },

        /**
         * Render all entities on the gameArena.
         * @method
         */
        render: function (layer) {
            layer = layer || false;
            var i = 0;

            for (i in this._props) {
                if (this._props.hasOwnProperty(i)) {
                    if (!layer || this._props[i].getData().layer === layer) {
                        this._props[i].render();
                    }
                }
            }
        },

        /**
         * Despawn specified entity.
         * @method
         * @param   {Number} entityId - Index ID of entity you wish to remove.
         */
        _despawn: function (entityId) {
            this._props.splice(entityId, 1);
        }

    };

    return PropFactory;
});
