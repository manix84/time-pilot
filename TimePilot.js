define(function () {

    var TimePilot = function (element, options) {
        this._container = element;

        var property = null;

        for (property in options) {
            if (options.hasOwnProperty(property) && this._options.hasOwnProperty(property)) {
                this._options[property] = options[property];
            }
        }

        this._data.container.width = this._container.clientWidth;
        this._data.container.height = this._container.clientHeight;

        this.init();
    };

    TimePilot.prototype = {

        _options: {
            baseUrl: ''
        },

        _data: {
            tick: 0,
            theTicker: null,
            pressedKey: false,
            container: {
                height: 0,
                width: 0,
                spawningBorder: 100
            },
            player: {
                isFiring: false,
                lastFiredTick: 0,
                lastMovedTick: 0,
                heading: 90,
                posX: 0,
                posY: 0
            },
            level: {
                current: 1,
                1: {
                    bullet: {
                        size: 4,
                        hitRadius: 2
                    },
                    enemy: {
                        speed: 2,
                        turnSpeed: 20,
                        height: 32,
                        width: 32,
                        hitRadius: 8
                    },
                    player: {
                        height: 32,
                        width: 32,
                        hitRadius: 8,
                        speed: 3
                    },
                    bgColor: '#007'
                }
            },


            boss: {},
            enemies: [],
            bullets: []
        },

        init: function () {
            var that = this,
                ticker;

            this._elementContruction();
            this._keyboardLock.focus();

            this._DEBUG_drawGrid();
            this._renderPlayer();

            this._DEBUG_createDummyEnemies();
            this._renderEnemies();

            this._data.theTicker = window.setInterval(function () {
                that._data.tick++;
                if (that._data.tick === 50000) {
                    window.clearInterval(that._data.theTicker);
                    window.alert('Stopping: 50,000 ticks');
                }
                that._canvas.width = that._canvas.width;
                that._canvas.style.background = that._data.level[that._data.level.current].bgColor;

                that._renderBullets();
                that._renderEnemies();
                that._renderPlayer();
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

        _elementContruction: function () {
            var that = this;
            this._canvas = document.createElement('canvas');
            this._canvas.setAttribute('width', this._data.container.width);
            this._canvas.setAttribute('height', this._data.container.height);
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
                    if (!that._data.pressedKey) {
                        that._data.pressedKey = event.keyCode;
                    }
                    break;
                case 32: // SPACE BAR
                    event.preventDefault();
                    that._data.player.isFiring = true;
                    break;
                case 27: // ESC
                    window.clearInterval(that._data.theTicker);
                    alert('Stopping');
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
                    that._data.pressedKey = false;
                    break;
                case 32: // SPACE BAR
                    that._data.player.isFiring = false;
                    break;
                }
            });

            this._container.appendChild(this._canvas);
            this._container.appendChild(this._keyboardLock);

            this._canvasContext = this._canvas.getContext('2d');
        },

        _rotateTo: function (destinationAngle, currentAngle, stepSize) {
            var direction = Math.atan2(
                    parseFloat(Math.sin((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(15)),
                    parseFloat(Math.cos((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(15))
                );

            if (direction > 0) {
                currentAngle += stepSize;
            } else if (direction < 0) {
                currentAngle -= stepSize;
            }
            currentAngle += currentAngle >= 360 ? -360 : (currentAngle < 0 ? 360 : 0);

            return currentAngle;
        },

        _detectCollision: function (targetA, targetB) {
            var dx = targetA.posX - targetB.posX,
                dy = targetA.posY - targetB.posY,
                dist = targetA.radius + targetB.radius;

            return (dx * dx + dy * dy <= dist * dist);
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
            var spriteData = new Image(),
                h = this._data.player.heading,
                t = this._data.tick,
                l = this._data.level.current,
                s = this._data.level[l].player.speed;

            // These tick delays don't work... They cause massive delay, to extreams of no movement/firing.
            // @TODO: Investigate a better method of slowing rotation and weapons fire.
            if ((t - this._data.player.lastMovedTick) > 4) {
                this._data.player.lastMovedTick = t;
                switch (this._data.pressedKey) {
                case 38: // Up
                    this._data.player.heading = this._rotateTo(0, this._data.player.heading, 22.5);
                    break;
                case 40: // Down
                    this._data.player.heading = this._rotateTo(180, this._data.player.heading, 22.5);
                    break;
                case 37: // Left
                    this._data.player.heading = this._rotateTo(270, this._data.player.heading, 22.5);
                    break;
                case 39: // Right
                    this._data.player.heading = this._rotateTo(90, this._data.player.heading, 22.5);
                    break;
                }
            }
            if ((t - this._data.player.lastFiredTick) > 10 &&
                this._data.player.isFiring) {
                this._data.player.lastFiredTick = t;
                this._data.bullets.push({
                    posX: (this._data.container.width / 2),
                    posY: (this._data.container.height / 2),
                    heading: this._data.player.heading,
                    playerRelative: true
                });
            }

            spriteData.src = this._options.baseUrl + "sprites/player.png";
            spriteData.frameWidth = 32;
            spriteData.frameHeight = 32;
            spriteData.frameX = Math.floor(h / 22.5);
            spriteData.frameY = 0;
            spriteData.posX = ((this._data.container.width / 2) - (32 / 2));
            spriteData.posY = ((this._data.container.height / 2) - (32 / 2));

            this._data.player.posX += parseFloat((Math.sin(h * (Math.PI / 180)) * s).toFixed(5));
            this._data.player.posY -= parseFloat((Math.cos(h * (Math.PI / 180)) * s).toFixed(5));

            this._renderSprite(spriteData);
        },

        _renderBoss: function () {
            var spriteData = new Image();

            spriteData.src = this._options.baseUrl + "sprites/boss_level" + this._data.level.current + ".png";
            spriteData.frameWidth = 64;
            spriteData.frameHeight = 32;
            spriteData.frameX = 0;
            spriteData.frameY = 0;
            spriteData.posX = (0 - this._data.player.posX);
            spriteData.posY = (0 - this._data.player.posY);

            this._renderSprite(spriteData);
        },

        _renderEnemies: function () {
            var i = 0, j = 0,
                l = this._data.level.current,
                ts = this._data.level[l].enemy.turnSpeed,
                t = this._data.tick,
                spriteData, collide, h, s, a, lt;

            for (; i < this._data.enemies.length; i++) {
                // Shorten enemy heading and game level.
                h = this._data.enemies[i].heading;
                s = (0.7 + (l / 10));
                lt = this._data.enemies[i].lastMovedTick;
                collide = false;
                spriteData = this._data.enemies[i].objRef;

                // Per-Enemy Data
                spriteData.frameX = Math.floor(h / 22.5);
                spriteData.frameY = 0;

                this._data.enemies[i].posX += parseFloat((Math.sin(h * (Math.PI / 180)) * s).toFixed(5));
                this._data.enemies[i].posY -= parseFloat((Math.cos(h * (Math.PI / 180)) * s).toFixed(5));

                if (!this._data.enemies[i].isFollowing) {
                    switch (Math.floor(Math.random() * 300) + 1) {
                    case 1:
                        this._data.enemies[i].heading -= 22.5;
                        if (this._data.enemies[i].heading < 0) {
                            this._data.enemies[i].heading = 337.5;
                        }
                        break;
                    case 2:
                        this._data.enemies[i].heading += 22.5;
                        if (this._data.enemies[i].heading >= 360) {
                            this._data.enemies[i].heading = 22.5;
                        }
                        break;
                    }
                } else {
                    if ((t - lt) > ts) {
                        this._data.enemies[i].lastMovedTick = t + (Math.floor(Math.random() * ts));
                        a = Math.atan2(
                            (
                                (this._data.enemies[i].posX - this._data.player.posX) -
                                ((this._data.container.width / 2) - (32 / 2))
                            ),
                            (
                                (this._data.enemies[i].posY - this._data.player.posY) -
                                ((this._data.container.height / 2) - (32 / 2))
                            )
                        ) * (180 / Math.PI);
                        a = ((a > 0) ? (360 - a) : Math.abs(a));
                        a = (Math.floor(a / 22.5) * 22.5);

                        this._data.enemies[i].heading = this._rotateTo(a, this._data.enemies[i].heading, 22.5);
                    }
                }

                spriteData.posX = (
                    this._data.enemies[i].posX -
                    this._data.player.posX -
                    (this._data.level[l].enemy.width / 2)
                );

                spriteData.posY = (
                    this._data.enemies[i].posY -
                    this._data.player.posY -
                    (this._data.level[l].enemy.height / 2)
                );

                for (j = 0; j < this._data.bullets.length; j++) {
                    collide = this._detectCollision({
                        // Enemy Position
                        posX: (this._data.enemies[i].posX - this._data.player.posX),
                        posY: (this._data.enemies[i].posY - this._data.player.posY),
                        radius: this._data.level[l].enemy.hitRadius
                    }, {
                        // Bullet Position
                        posX: this._data.bullets[j].posX + (this._data.level[l].bullet.size / 2),
                        posY: this._data.bullets[j].posY + (this._data.level[l].bullet.size / 2),
                        radius: this._data.level[l].bullet.hitRadius
                    });

                    if (collide) {
                        console.warn('Bullet ' + j + ' hit enemy ' + i);
                        this._data.enemies.splice(i, 1);
                        this._data.bullets.splice(j, 1);
                    }
                }

                // DRAW ENEMY
                this._renderSprite(spriteData);

                // if (spriteData.posX > this._data.container.width ||
                //     spriteData.posX < -32 ||
                //     spriteData.posY > this._data.container.height ||
                //     spriteData.posY < -32) {
                //     this._data.enemies.splice(i, 1);
                // }
            }
        },

        _renderBullets: function () {
            var i = 0,
                data = {},
                l = this._data.level.current,
                bs = this._data.level[l].bullet.size,
                s = 7,
                h;

            for (; i < this._data.bullets.length; i++) {
                h = this._data.bullets[i].heading;

                this._data.bullets[i].posX += parseFloat((Math.sin(h * (Math.PI / 180)) * s).toFixed(5));
                this._data.bullets[i].posY -= parseFloat((Math.cos(h * (Math.PI / 180)) * s).toFixed(5));

                data.posX = this._data.bullets[i].posX;
                data.posY = this._data.bullets[i].posY;

                if (!this._data.bullets[i].playerRelative) {
                    data.posX -= this._data.player.posX;
                    data.posY -= this._data.player.posY;
                }

                this._canvasContext.fillStyle = "#FFF";
                this._canvasContext.fillRect(
                    data.posX - (bs / 2),
                    data.posY - (bs / 2),
                    bs, bs
                );

                if (data.posX > this._data.container.width ||
                    data.posX < 0 ||
                    data.posY > this._data.container.height ||
                    data.posY < 0) {
                    this._data.bullets.splice(i, 1);
                }
            }
        },

        _renderMissles: function () {},
        _renderBombs: function () {},
        _renderMenu: function () {},
        _renderClouds: function () {},

        _DEBUG_createDummyEnemies: function () {
            var i = 0,
                enemy;
            for (; i < 100; i++) {
                enemy = {
                    objRef: new Image(),
                    isFollowing: true, // (Math.random() * 20),
                    lastMovedTick: 0,
                    heading: Math.floor(Math.random() * 16) * 22.5,
                    posX: Math.floor(Math.random() * (this._data.container.width - 32)),
                    posY: Math.floor(Math.random() * (this._data.container.height - 32))
                };
                enemy.objRef.src = this._options.baseUrl + "sprites/enemy_level" + this._data.level.current + ".png";
                enemy.objRef.frameWidth = 32;
                enemy.objRef.frameHeight = 32;
                this._data.enemies.push(enemy);
            }
        },

        _DEBUG_drawGrid: function () {
            var x = 0,
                h = 20,
                w = 20;

            for (; x <= this._data.container.width; x += w) {
                this._canvasContext.moveTo(0.5 + x, 0);
                this._canvasContext.lineTo(0.5 + x, this._data.container.height);
            }

            for (x = 0; x <= this._data.container.height; x += h) {
                this._canvasContext.moveTo(0, 0.5 + x);
                this._canvasContext.lineTo(this._data.container.width, 0.5 + x);
            }

            this._canvasContext.strokeStyle = "#AAA";
            this._canvasContext.stroke();
        }
    };

    return TimePilot;
});
