define([
    'engine/ticker',
    'engine/Graphic',
    'engine/sound'
], function (ticker, Graphic, sound) {

    var TimePilot = function (element) {
        console.log('TimePilot:element', element);
        this._container = element;

        this.init();
    };

    TimePilot.prototype = {
        _spriteStore: {
            player: {
                src: "../sprites/ship.png",
                frameWidth: 32,
                frameHeight: 32,
                frameCount: 16
            }
        },

        _liveDataStore: {
            level: 1,

            player: {
                heading: 90,
                positionX: 0,
                positionY: 0
            },

            boss: {
                spriteRef: null,
                heading: 90,
                positionX: 0,
                positionY: 0
            },

            enemies: [],

            bullets: []
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

        _drawSprite: function (spriteData) {
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

        _drawEnemies: function () {
            var i = 0,
                l = this._enemies.length;
            for (; i < l; i++) {
                // DRAW ENEMY
                this._drawSprite();
            }
        },

        _drawPlayer: function () {
            this._draw(this._spriteStore.player);
        },

        _renderMenu: function () {},
        _renderSky: function () {}
    };

    return TimePilot;
});
