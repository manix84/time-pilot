define(function () {

    var TimePilot = function (element, options) {
        this._container = element;

        var property = null;

        for (property in options) {
            if (options.hasOwnProperty(property) && this._options.hasOwnProperty(property)) {
                this._options[property] = options[property];
            }
        }

        this._gameData.container.width = this._container.clientWidth;
        this._gameData.container.height = this._container.clientHeight;

        this.init();
    };

    TimePilot.prototype = {

        _options: {
            baseUrl: ''
        },

        _gameData: {
            level: 1,
            tick: 0,
            container: {
                height: 0,
                width: 0
            },
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
            enemies: [],
            bullets: []
        },

        init: function () {
            var that = this,
                ticker;
            this._createCanvas();
            this._TMP_drawGrid();
            this._renderPlayer();

            this._TMP_createDummyEnemies();
            this._renderEnemies();

            ticker = window.setInterval(function () {
                that._canvas.width = that._canvas.width;

                that._TMP_drawGrid();

                that._renderEnemies();
                that._renderPlayer();

                if (that._gameData.tick++ >= 1000) {
                    window.clearInterval(ticker);
                    alert('Stopping');
                }
            }, (1000 / 60));
        },

        _TMP_createDummyEnemies: function () {
            var i = 0,
                enemy;
            for (; i < 100; i++) {
                enemy = {
                    objRef: new Image(),
                    following: true,
                    heading: Math.floor(Math.random() * 16) * 22.5,
                    posX: Math.floor(Math.random() * (this._gameData.container.width - 32)),
                    posY: Math.floor(Math.random() * (this._gameData.container.height - 32))
                };
                enemy.objRef.src = this._options.baseUrl + "sprites/enemy_level" + this._gameData.level + ".png";
                enemy.objRef.frameWidth = 32;
                enemy.objRef.frameHeight = 32;
                this._gameData.enemies.push(enemy);
            }
        },

        _createCanvas: function () {
            this._canvas = document.createElement('canvas');
            this._container.appendChild(this._canvas);

            this._canvas.setAttribute('width', this._gameData.container.width);
            this._canvas.setAttribute('height', this._gameData.container.height);
            this._canvas.innerHTML =
                "<div style='padding:3px;background:#CCC'>" +
                    "<img src='../images/supportError.png' style='position:relative;margin:7px' />" +
                    "<p>Looks like your browser doesn't support the HTML5 canvas.</p>" +
                    "<p>Please consider updating to a more modern browser such as <a href=''>Google Chrome</a> or <a href=''>Mozilla FireFox</a>.</p>" +
                "</div>";

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

            spriteData.src = this._options.baseUrl + "sprites/player.png";
            spriteData.frameWidth = 32;
            spriteData.frameHeight = 32;
            spriteData.frameX = 0;
            spriteData.frameY = 0;
            spriteData.posX = ((this._gameData.container.width / 2) - (32 / 2));
            spriteData.posY = ((this._gameData.container.height / 2) - (32 / 2));

            this._renderSprite(spriteData);
        },

        _renderBoss: function () {
            var spriteData = new Image();

            spriteData.src = this._options.baseUrl + "sprites/boss_level" + this._gameData.level + ".png";
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
                n = this._gameData.enemies.length,
                that = this,
                spriteData, h, l, s;


            for (; i < n; i++) {
                // Shorten enemy heading and game level.
                h = this._gameData.enemies[i].heading;
                l = this._gameData.level;
                s = (0.8 * l);
                spriteData = this._gameData.enemies[i].objRef;

                // Per-Enemy Data
                spriteData.frameX = Math.floor(h / 22.5);
                spriteData.frameY = 0;

                this._gameData.enemies[i].posX += parseFloat((Math.cos(h * (Math.PI / 180)) * s).toFixed(5));
                this._gameData.enemies[i].posY += parseFloat((Math.sin(h * (Math.PI / 180)) * s).toFixed(5));

                if (!this._gameData.enemies[i].isFollowing) {
                    switch (Math.floor(Math.random() * 300) + 1) {
                    case 1:
                        this._gameData.enemies[i].heading -= 22.5;
                        if (this._gameData.enemies[i].heading < 0) {
                            this._gameData.enemies[i].heading = 337.5;
                        }
                        break;
                    case 2:
                        this._gameData.enemies[i].heading += 22.5;
                        if (this._gameData.enemies[i].heading >= 360) {
                            this._gameData.enemies[i].heading = 22.5;
                        }
                        break;
                    }
                }

                spriteData.posX = this._gameData.enemies[i].posX;
                spriteData.posY = this._gameData.enemies[i].posY;

                // DRAW ENEMY
                this._renderSprite(spriteData);
            }
        },

        _renderMissles: function () {
            var i = 0,
                l = this._gameData.enemies.length,
                spriteData = new Image();

            spriteData.src = this._options.baseUrl + "sprites/missle.png";
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

            spriteData.src = this._options.baseUrl + "sprites/bomb.png";
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
        },

        _TMP_drawGrid: function () {
            var x = 0,
                h = 20,
                w = 20;
            for (; x <= this._gameData.container.width; x += w) {
                this._canvasContext.moveTo(0.5 + x, 0);
                this._canvasContext.lineTo(0.5 + x, this._gameData.container.height);
            }


            for (x = 0; x <= this._gameData.container.height; x += h) {
                this._canvasContext.moveTo(0, 0.5 + x);
                this._canvasContext.lineTo(this._gameData.container.width, 0.5 + x);
            }

            this._canvasContext.strokeStyle = "#AAA";
            this._canvasContext.stroke();
        }
    };

    return TimePilot;
});
