/* global define */
define("TimePilot.Explosion", [
    "TimePilot.CONSTANTS",
    "TimePilot.dataStore",
    "TimePilot.userOptions",
    "engine/Sound",
    "engine/helpers"
], function (
    CONSTS,
    dataStore,
    userOptions,
    SoundEngine,
    helpers
) {

    /**
     * Creates an explosion to add to the page.
     * @constructor
     * @param   {Number}            posX        - Spawning location on the X axis.
     * @param   {Number}            posY        - Spawning location on the Y axis.
     * @returns {Explosion Instance}
     */

    var Explosion = function (posX, posY) {
        this._gameArena = dataStore._gameArena;

        this._data = this.getExplosionData() || {};
        this._data.posX = posX;
        this._data.posY = posY;
        this._data.startTick = dataStore._gameTicker.getTicks();

        this.removeMe = false;

        this._explosionSprite = new Image();
        this._explosionSprite.src = this._data.sprite.src;

        this._explosionSound = new SoundEngine(this._data.sound.src);
    };

    Explosion.prototype = {

        /**
         * Get current data for this explosion
         * @method
         * @returns {object}
         */
        getExplosionData: function (key) {
            var data = {};

            switch (this._type) {
            case "basicEnemy":
                data = CONSTS.explosions.enemies.basic;
                break;
            case "player":
                data = CONSTS.explosions.player;
                break;
            }

            if (!key) {
                return data;
            } else if (data.hasOwnProperty(key)) {
                return data[key];
            }
            return;
        },

        /**
         * Detect if the entity has left a given radius of the player.
         * @method
         * @protected
         * @param   {Number} radius - Maximum radial from player before they are concidered outside the battle.
         * @returns {Boolean} True = entity has left the area, False = entity is still in area.
         */
        _checkInArena: function () {
            var levelData = this.getLevelData();

            if (this.removeMe) {
                return;
            }

            this.removeMe = helpers.detectAreaExit({
                    posX: this._gameArena.posX + ((levelData.width / 2)),
                    posY: this._gameArena.posY + ((levelData.height / 2))
                }, {
                    posX: this._data.posX,
                    posY: this._data.posY
                },
                CONSTS.limits.despawnRadius
            );
        },

        /**
         * Render the death animation for the entity.
         * @protected
         * @method
         */
        render: function () {
            var explosionData = this.getLevelData().explosion,
                frameX = Math.floor((this._gameTicker.getTicks() - this._data.startTick) / explosionData.frameLimiter);

            this._explosionSprite.src = explosionData.sprite.src;

            this._gameArena.renderSprite(this._explosionSprite, {
                frameWidth: explosionData.width,
                frameHeight: explosionData.height,
                frameX: frameX,
                frameY: 0,
                posX: (this._data.posX - this._player.getData().posX - (explosionData.width / 2)),
                posY: (this._data.posY - this._player.getData().posY - (explosionData.height / 2))
            });

            if (frameX === explosionData.frames) {
                this.removeMe = true;
            }
        }
    };

    return Explosion;
});
