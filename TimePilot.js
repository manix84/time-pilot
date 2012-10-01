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
            pressedKey: false,
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

            this._elementContruction();
            this._keyboardLock.focus();

            this._TMP_drawGrid();
            this._renderPlayer();

            this._TMP_createDummyEnemies();
            this._renderEnemies();

            ticker = window.setInterval(function () {
                that._canvas.width = that._canvas.width;

                that._TMP_drawGrid();

                that._renderEnemies();
                that._renderPlayer();

                if (that._gameData.tick++ >= 10000) {
                    window.clearInterval(ticker);
                    alert('Stopping');
                }
            }, (1000 / 60));
        },

        _addListener: function (element, eventName, callback) {
            if (typeof element.addEventListener === 'function') {
                element.addEventListener(eventName, callback, false);
            } else if (!!element.attachEvent) {
                element.attachEvent('on' + eventName, callback);
            } else {
                element['on' + eventName] = callback;
            }
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

        _elementContruction: function () {
            var that = this;
            this._canvas = document.createElement('canvas');
            this._canvas.setAttribute('width', this._gameData.container.width);
            this._canvas.setAttribute('height', this._gameData.container.height);
            this._canvas.innerHTML =
                "<div style='padding:3px;background:#CCC'>" +
                    "<img src='" + this._options.baseUrl + "images/supportError.png' style='position:relative;margin:7px' />" +
                    "<p>Looks like your browser doesn't support the HTML5 canvas.</p>" +
                    "<p>Please consider updating to a more modern browser such as <a href=''>Google Chrome</a> or <a href=''>Mozilla FireFox</a>.</p>" +
                "</div>";

            this._keyboardLock = document.createElement('input');
            this._keyboardLock.setAttribute('style', 'position:absolute;border:0;top:-9999px;left:-9999px;width:0;height0;resize:none;outline:0');
            this._keyboardLock.setAttribute('type', 'text');
            this._addListener(this._canvas, 'click', function () {
                that._keyboardLock.focus();
            });
            this._addListener(this._keyboardLock, 'keydown', function (event) {
                switch (event.keyCode) {
                case 37: // LEFT
                case 38: // UP
                case 39: // RIGHT
                case 40: // DOWN
                    event.preventDefault();
                    if (!that._gameData.pressedKey) {
                        that._gameData.pressedKey = event.keyCode;
                    }
                    break;
                case 32: // SPACE BAR
                    event.preventDefault();
                    // SHOOT
                    break;
                }
            });
            this._addListener(this._keyboardLock, 'keyup', function (event) {
                switch (event.keyCode) {
                case 37: // LEFT
                case 38: // UP
                case 39: // RIGHT
                case 40: // DOWN
                    event.preventDefault();
                    that._gameData.pressedKey = false;
                    break;
                }
            });

            this._container.appendChild(this._canvas);
            this._container.appendChild(this._keyboardLock);

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

        _rotateTo: function (destinationAngle, currentAngle, stepSize) {
            var direction = Math.atan2(
                    parseFloat(Math.sin((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(15)),
                    parseFloat(Math.cos((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(15))
                );

            if (direction > 0) {
                currentAngle += stepSize;
            } else if (direction < 0) { // ADD RADIANS
                currentAngle -= stepSize;
            }
            if (currentAngle >= 360) {
                currentAngle -= 360;
            } else if (currentAngle < 0) {
                currentAngle += 360;
            }

            return currentAngle;
        },

        _renderPlayer: function () {
            var spriteData = new Image(),
                h = this._gameData.player.heading,
                s = 2;

            if (this._gameData.tick % 4 === 1) {
                switch (this._gameData.pressedKey) {
                case 38: // Up
                    this._gameData.player.heading = this._rotateTo(0, this._gameData.player.heading, 22.5);
                    break;
                case 40: // Down
                    this._gameData.player.heading = this._rotateTo(180, this._gameData.player.heading, 22.5);
                    break;
                case 37: // Left
                    this._gameData.player.heading = this._rotateTo(270, this._gameData.player.heading, 22.5);
                    break;
                case 39: // Right
                    this._gameData.player.heading = this._rotateTo(90, this._gameData.player.heading, 22.5);
                    break;
                }
                if (this._gameData.player.heading !== h) {
                    console.log('New Heading: ' + this._gameData.player.heading);
                }
            }

            spriteData.src = this._options.baseUrl + "sprites/player.png";
            spriteData.frameWidth = 32;
            spriteData.frameHeight = 32;
            spriteData.frameX = Math.floor(h / 22.5);
            spriteData.frameY = 0;
            spriteData.posX = ((this._gameData.container.width / 2) - (32 / 2));
            spriteData.posY = ((this._gameData.container.height / 2) - (32 / 2));

            this._gameData.player.posX += parseFloat((Math.sin(h * (Math.PI / 180)) * s).toFixed(5));
            this._gameData.player.posY -= parseFloat((Math.cos(h * (Math.PI / 180)) * s).toFixed(5));

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
                that = this,
                spriteData, h, l, s;


            for (; i < this._gameData.enemies.length; i++) {
                // Shorten enemy heading and game level.
                h = this._gameData.enemies[i].heading;
                l = this._gameData.level;
                s = (0.7 + (l / 10));
                spriteData = this._gameData.enemies[i].objRef;

                // Per-Enemy Data
                spriteData.frameX = Math.floor(h / 22.5);
                spriteData.frameY = 0;

                this._gameData.enemies[i].posX += parseFloat((Math.sin(h * (Math.PI / 180)) * s).toFixed(5));
                this._gameData.enemies[i].posY += parseFloat((Math.cos(h * (Math.PI / 180)) * s).toFixed(5));

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
                } else {
                    // FOLLOW PLAYER
                }

                spriteData.posX = this._gameData.enemies[i].posX - this._gameData.player.posX;
                spriteData.posY = this._gameData.enemies[i].posY - this._gameData.player.posY;

                // DRAW ENEMY
                this._renderSprite(spriteData);

                if (spriteData.posX > this._gameData.container.width ||
                    spriteData.posX < -32 ||
                    spriteData.posY > this._gameData.container.height ||
                    spriteData.posY < -32) {
                    this._gameData.enemies.splice(i, 1);
                }
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
