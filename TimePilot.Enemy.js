define("TimePilot.Enemy", function () {

    /**
     * Level specific data about the player.
     * @constant
     * @type {Object}
     */
    var LEVEL_DATA = {
        1: {
            velocity: 3,
            turn: 5,
            height: 32,
            width: 32,
            hitRadius: 8
        }
    };

    /**
     * [ description]
     * @constructor
     * @param   {[type]} canvas [description]
     * @param   {[type]} ticker [description]
     * @param   {[type]} player [description]
     * @returns {[type]}
     */
    var Enemy = function (canvas, ticker, player) {
        this._canvas = canvas;
        this._player = player;
        this._ticker = ticker;
    };

    Enemy.prototype = {

        /**
         * Stored data about the player.
         * @type {Object}
         */
        _data: {
            isFiring: false,
            heading: 90,
            posX: 0,
            posY: 0,
            height: 32,
            width: 32,
            hitRadius: 8
        },

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
         * @returns {[type]}
         */
        getLevelData: function () {
            return LEVEL_DATA[this._level];
        },

        /**
         * Recalculate player's current position and heading.
         * @method
         */
        reposition: function () {
            var i = 0, j = 0,
                l = this._data.level.current,
                sprite = new Image(),
                h, s, a;

            sprite.src = this._options.baseUrl + "sprites/enemy_level" + l + ".png";
            sprite.frameWidth = this._data.width;
            sprite.frameHeight = this._data.height;
            // Shorten enemy heading and game level.

            // Per-Enemy Data
            sprite.frameX = Math.floor(h / 22.5);
            sprite.frameY = (Math.floor(this._ticker.getTicks() / 10) % 2);

            this._data.posX += parseFloat((Math.sin(h * (Math.PI / 180)) * s).toFixed(5));
            this._data.posY -= parseFloat((Math.cos(h * (Math.PI / 180)) * s).toFixed(5));


            a = this._findAngle(this._data, {
                posX: this._player.getData().posX + ((this._data.container.width / 2) - (this._data.width / 2)),
                posY: this._player.getData().posY + ((this._data.container.height / 2) - (this._data.height / 2))
            });
            a = (Math.floor(a / 22.5) * 22.5);

            this._data.heading = this._rotateTo(a, this._data.heading, 22.5);

            sprite.posX = (this._data.posX - this._player.getData().posX - (this._data.width / 2));
            sprite.posY = (this._data.posY - this._player.getData().posY - (this._data.height / 2));

            this._canvas.renderSprite(sprite);

            if (this._detectCollision({
                // Enemy Position
                posX: (this._data.posX - this._player.getData().posX),
                posY: (this._data.posY - this._player.getData().posY),
                radius: this._data.hitRadius
            }, {
                // Bullet Position
                posX: this._player.getData().posX + (this._player.getData().width / 2),
                posY: this._player.getData().posX + (this._player.getData().height / 2),
                radius: this._player.getData().hitRadius
            })) {
                window.console.warn("GAME OVER ", this._data.score);
            }

            for (j = 0; j < this._data.bullets.length; j++) {
                if (this._detectCollision({
                    // Enemy Position
                    posX: (this._data.posX - this._player.getData().posX),
                    posY: (this._data.posY - this._player.getData().posY),
                    radius: this._data.hitRadius
                }, {
                    // Bullet Position
                    posX: this._data.bullets[j].posX + (this._data.level[l].bullet.size / 2),
                    posY: this._data.bullets[j].posY + (this._data.level[l].bullet.size / 2),
                    radius: this._data.level[l].bullet.hitRadius
                })) {
                    this._addExplosion(this._data.posX, this._data.posY);
                    this._data.enemies.splice(i, 1);
                    this._data.bullets.splice(j, 1);
                    this._data.score += 100;
                }
            }
        },

        /**
         * Render the player.
         * @method
         */
        render: function () {
            var sprite = {
                src: "./sprites/enemy_level" + this._level + ".png",
                frameWidth: 32,
                frameHeight: 32,
                frameX: Math.floor(this._data.heading / 22.5),
                frameY: 0,
                posX: ((this._canvas.getCanvas().width / 2) - (sprite.frameWidth / 2)),
                posY: ((this._canvas.getCanvas().height / 2) - (sprite.frameWidth / 2))
            };

            this._canvas.renderSprite(
                sprite
            );
        }
    };
});
