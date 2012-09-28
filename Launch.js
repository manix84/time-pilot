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
                posX: 0,
                posY: 0
            },

            boss: {
                heading: 90,
                posX: 0,
                posY: 0
            },

            enemies: [
                {
                    following: true,
                    heading: 0,
                    posX: Math.floor(Math.random() * 800) + 1,
                    posY: Math.floor(Math.random() * 600) + 1
                },
                {
                    following: true,
                    heading: 90,
                    posX: Math.floor(Math.random() * 800) + 1,
                    posY: Math.floor(Math.random() * 600) + 1
                },
                {
                    following: true,
                    heading: 112.5,
                    posX: Math.floor(Math.random() * 800) + 1,
                    posY: Math.floor(Math.random() * 600) + 1
                },
                {
                    following: true,
                    heading: 202.5,
                    posX: Math.floor(Math.random() * 800) + 1,
                    posY: Math.floor(Math.random() * 600) + 1
                }
            ],

            bullets: [
                // {
                //     heading: 90,
                //     posX: 0,
                //     posY: 0
                // }
            ]
        },

        init: function () {
            this._createCanvas();
            this._renderPlayer();
            this._renderEnemies();
        },

        _tickCallback: function () {
            this._gameData.player.posY += (Math.cos(this._gameData.player.heading * (Math.PI / 180)) * 1).toFixed(15);
            this._gameData.player.posX += (Math.sin(this._gameData.player.heading * (Math.PI / 180)) * 1).tiFixed(15);
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
            var spriteData = new Image();

            spriteData.src = "../sprites/boss_level" + this._gameData.level + ".png";
            spriteData.frameWidth = 64;
            spriteData.frameHeight = 32;
            spriteData.frameX = 0;
            spriteData.frameY = 0;
            spriteData.posX = (0 - this._gameData.player.posX);
            spriteData.posY = (0 - this._gameData.player.posY);

            this._renderSprite(spriteData);
        },

        _renderEnemies: function () {
            var i = 0,
                l = this._gameData.enemies.length,
                spriteData = new Image();

            spriteData.src = "../sprites/enemy_level" + this._gameData.level + ".png";
            spriteData.frameWidth = 32;
            spriteData.frameHeight = 32;

            for (; i < l; i++) {
                // Per-Enemy Data
                spriteData.frameX = Math.floor((this._gameData.enemies[i].heading - 90) / 22.5);
                spriteData.frameY = 0;
                // turnSpeed: (0.2 * this._gameData.level)
                // velocity: (10 * this._gameData.level)
                spriteData.posX = (this._gameData.enemies[i].posX - this._gameData.player.posX);
                spriteData.posY = (this._gameData.enemies[i].posY - this._gameData.player.posY);

                // DRAW ENEMY
                this._renderSprite(spriteData);
            }
        },

        _renderMissles: function () {
            var i = 0,
                l = this._gameData.enemies.length,
                spriteData = new Image();

            spriteData.src = "../sprites/missle.png";
            spriteData.frameWidth = 32;
            spriteData.frameHeight = 32;

            for (; i < l; i++) {
                // Per-Enemy Data
                spriteData.frameX = 0;
                spriteData.frameY = 0;
                // turnSpeed: (0.2 * this._gameData.level)
                // velocity: (10 * this._gameData.level)
                spriteData.posX = (0 - this._gameData.player.posX);
                spriteData.posY = (0 - this._gameData.player.posY);

                // DRAW ENEMY
                this._renderSprite(spriteData);
            }
        },

        _renderBombs: function () {
            var i = 0,
                l = this._gameData.enemies.length,
                spriteData = new Image();

            spriteData.src = "../sprites/bomb.png";
            spriteData.frameWidth = 32;
            spriteData.frameHeight = 32;

            for (; i < l; i++) {
                // Per-Enemy Data
                spriteData.frameX = 0;
                spriteData.frameY = 0;
                // turnSpeed: (0.2 * this._gameData.level)
                // velocity: (10 * this._gameData.level)
                spriteData.posX = (0 - this._gameData.player.posX);
                spriteData.posY = (0 - this._gameData.player.posY);

                // DRAW BOMB
                this._renderSprite(spriteData);
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
