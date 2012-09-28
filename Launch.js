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
            this._renderPlayer();
        },

        _tickCallback: function () {
            this._player.positionY += (Math.cos(this._player.heading * (Math.PI / 180)) * 1).toFixed(15);
            this._player.positionX += (Math.sin(this._player.heading * (Math.PI / 180)) * 1).tiFixed(15);
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
                (spriteData.frameX * spriteData.frameWidth),
                (spriteData.frameY * spriteData.frameHeight),
                spriteData.frameWidth,
                spriteData.frameHeight,
                spriteData.posX,
                spriteData.posY,
                spriteData.frameWidth,
                spriteData.frameHeight
            );
        },

        _renderPlayer: function () {
            var spriteData = new Image();

            spriteData.src = "../sprites/player.png";
            spriteData.frameWidth = 32;
            spriteData.frameHeight = 32;
            spriteData.frameX = 0;
            spriteData.frameY = 0;
            spriteData.posX = ((this._container.clientWidth / 2) - (32 / 2));
            spriteData.posY = ((this._container.clientHeight / 2) - (32 / 2));

            this._renderSprite(spriteData);
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
                l = this._enemies.length,
                spriteData = new Image();

            spriteData.src = "../sprites/enemy_level" + this._gameData.level + ".png";


            for (; i < l; i++) {
                // DRAW ENEMY
                // turnSpeed: (0.2 * this._gameData.level)
                // velocity: (10 * this._gameData.level)

                this._renderSprite({

                    frameWidth: 32,
                    frameHeight: 32,
                    frameCount: (this._gameData.level !== 3 ? 16 : 12)
                });
            }
        },

        _renderMissles: function () {
            var i = 0,
                l = this._enemies.length;
            for (; i < l; i++) {
                // DRAW MISSLE
                // turnSpeed: (0.2 * this._gameData.level)
                // velocity: (10 * this._gameData.level)
                this._renderSprite({
                    src: "../sprites/missle.png",
                    posX: 0,
                    posY: 0
                });
            }
        },

        _renderBombs: function () {
            var i = 0,
                l = this._enemies.length;
            for (; i < l; i++) {
                // DRAW BOMB
                // falling arch: (0.2 * this._gameData.level)
                // velocity: (10 * this._gameData.level)
                this._renderSprite({
                    src: "../sprites/bomb.png"
                });
            }
        },

        _renderMenu: function () {},
        _renderClouds: function () {
            // Draw cloud layer 1
            // Draw cloud layer 2
            // Draw cloud layer 3
        }
    };

    return TimePilot;
});
