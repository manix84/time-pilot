define(function () {

    var TimePilot = function (element) {
        console.log('TimePilot:element', element);
        this._container = element;

        this.init();
    };

    TimePilot.prototype = {

        _gameData: {
            level: 1,

            player: {
                heading: 90,
                positionX: 0,
                positionY: 0
            },

            boss: {
                heading: 90,
                positionX: 0,
                positionY: 0
            },

            enemies: [
                // {
                //     following: true/false,z
                //     heading: 90,
                //     positionX: 0,
                //     positionY: 0
                // }
            ],

            bullets: [
                // {
                //     heading: 90,
                //     positionX: 0,
                //     positionY: 0
                // }
            ]
        },

        init: function () {
            this._createCanvas();
            this._renderShip();
        },

        _tickCallback: function () {
            var SPEED = 1;
            this._player.positionY += (Math.cos(this._player.heading * (Math.PI / 180)) * SPEED).toFixed(15);
            this._player.positionX += (Math.sin(this._player.heading * (Math.PI / 180)) * SPEED).tiFixed(15);
        },

        _createCanvas: function () {
            this._canvas = document.createElement('canvas');
            this._container.appendChild(this._canvas);

            this._canvas.setAttribute('height', this._container.clientHeight);
            this._canvas.setAttribute('width', this._container.clientWidth);
            // this._canvas.innerHTML = this._options.supportError;

            this._canvasContext = this._canvas.getContext('2d');
        },

        _renderSprite: function (spriteData) {
            this._canvasContext.drawImage(
                spriteData,
                spriteData.frameWidth,
                0,
                spriteData.frameWidth,
                spriteData.frameHeight,
                ((this._container.clientWidth / 2) - (spriteData.frameWidth / 2)),
                ((this._container.clientHeight / 2) - (spriteData.frameHeight / 2)),
                spriteData.frameWidth,
                spriteData.frameHeight
            );
        },

        _renderPlayer: function () {
            this._render({
                src: "../sprites/ship.png",
                frameWidth: 32,
                frameHeight: 32,
                frameCount: 16
            });
        },

        _renderBoss: function () {
            var i = 0,
                l = this._enemies.length;
            for (; i < l; i++) {
                // DRAW ENEMY
                this._renderSprite({
                    src: "../sprites/boss_level" + this._gameData.level + ".png",
                    frameWidth: 32,
                    frameHeight: 64
                });
            }
        },

        _renderEnemies: function () {
            var i = 0,
                l = this._enemies.length;
            for (; i < l; i++) {
                // DRAW ENEMY
                this._renderSprite({
                    src: "../sprites/enemy_level" + this._gameData.level + ".png",
                    frameWidth: 32,
                    frameHeight: 32,
                    frameCount: (this._gameData.level !== 3 ? 16 : 12),
                    turnSpeed: (0.2 * this._gameData.level),
                    velocity: (10 * this._gameData.level)
                });
            }
        },

        _renderMissle: function () {
            var i = 0,
                l = this._enemies.length;
            for (; i < l; i++) {
                // DRAW ENEMY
                this._renderSprite({
                    src: "../sprites/missle.png",
                    turnSpeed: (0.2 * this._gameData.level),
                    velocity: (10 * this._gameData.level)
                });
            }
        },

        _renderBomb: function () {
            var i = 0,
                l = this._enemies.length;
            for (; i < l; i++) {
                // DRAW ENEMY
                this._renderSprite({
                    src: "../sprites/missle.png",
                    turnSpeed: (0.2 * this._gameData.level),
                    velocity: (10 * this._gameData.level)
                });
            }
        },

        _renderMenu: function () {},
        _renderSky: function () {}
    };

    return TimePilot;
});
