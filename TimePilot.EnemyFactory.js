/* global define */
define("TimePilot.EnemyFactory", [
    "TimePilot.CONSTANTS",
    "TimePilot.Enemy",
    "engine/Sound",
    "engine/helpers"
], function (
    CONSTS,
    Enemy,
    SoundEngine,
    helpers
) {

    /**
     * Construct an enemy factory for managing creation, movement, rendering and removal of enemies.
     * @constructor
     * @param   {Canvas Instance} gameArena - Canvas Instance
     * @param   {Ticker Instance} ticker - Ticker Instance
     * @param   {Player Instance} player - Player Instance
     * @param   {bulletFactory Instance} bulletFactory - bulletFactory Instance
     * @returns {Enemy Factory Instance}
     */
    var EnemyFactory = function (gameArena, ticker, level, player, bulletFactory) {
        this._gameArena = gameArena;
        this._ticker = ticker;
        this._level = level;
        this._player = player;
        this._bullets = bulletFactory;

        this._explosionSound = new SoundEngine(this.getLevelData().explosion.sound.src);

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
                new Enemy(this._gameArena, this._ticker, this._level, this._player, posX, posY, heading)
            );
        },

        /**
         * Get current data for this level
         * @method
         * @param {String} [key] [description]
         * @returns {object}
         */
        getLevelData: function (key) {
            var data = CONSTS.levels[this._level].enemies.basic;
            if (key) {
                if (data[key]) {
                    return data[key];
                } else {
                    return;
                }
            } else {
                return data;
            }
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
         * Boolean flag reporting if there are spawns available for enemies.
         * @method
         * @returns {Boolean}
         */
        isUnderLimit: function () {
            return this._enemies.length < this.getLevelData('spawnLimit');
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
         * Run player collision calculations on all entities.
         * @method
         */
        detectCollision: function () {
            var bullets = this._bullets.getData(),
                playerData = this._player.getData();

            for (var i in this._enemies) {
                if (this._enemies.hasOwnProperty(i) && !this._enemies[i].hasDied) {
                    if (this._enemies[i].detectCollision(
                        playerData.posX,
                        playerData.posY,
                        CONSTS.player.hitRadius
                    )) {
                        this._enemies[i].kill();
                        this._explosionSound.stop();
                        this._explosionSound.play();

                        this._player.kill();
                    }
                    for (var j in bullets) {
                        if (bullets.hasOwnProperty(j) &&
                            this._enemies[i].detectCollision(
                                bullets[j].posX + this._player.getData().posX,
                                bullets[j].posY + this._player.getData().posY,
                                CONSTS.player.projectile.size
                            )
                        ) {
                            this._enemies[i].kill();
                            this._explosionSound.stop();
                            this._explosionSound.play();
                        }
                    }
                }
            }
        },

        /**
         * If an entity declares it is to be removed, remove it.
         * @method
         */
        cleanup: function () {
            var i;

            for (i in this._enemies) {
                if (this._enemies.hasOwnProperty(i) && this._enemies[i].removeMe) {
                    this._despawn(i);
                    console.log("De-spawning enemy " + i);
                }
            }
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
                }
            }
        },

        /**
         * Render all enemies on the gameArena.
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
         * De-spawn specified entity.
         * @method
         * @param   {Number} entityId - Index ID of entity you wish to remove.
         */
        _despawn: function (entityId) {
            this._enemies.splice(entityId, 1);
        },

        /**
         * Clear all enemies from memory.
         */
        clearAll: function () {
            for (var i in this._enemies) {
                if (this._enemies.hasOwnProperty(i)) {
                    this._despawn(i);
                }
            }
        }
    };

    return EnemyFactory;
});
