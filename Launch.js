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
        init: function () {
            this._createCanvas();
            this._renderShip();
        },

        _tickCallback: function () {
            var SPEED = 1;
            this._player.positionY += (Math.cos(this._player.heading * (Math.PI / 180)) * SPEED).toFixed(15);
            this._player.positionX += (Math.sin(this._player.heading * (Math.PI / 180)) * SPEED).tiFixed(15);
        },
        _liveDataStore: {
            level: 1,

            player: {
                spriteRef: null,
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

        _createCanvas: function () {
            this._canvas = document.createElement('canvas');
            this._container.appendChild(this._canvas);

            this._canvas.setAttribute('height', this._container.clientHeight);
            this._canvas.setAttribute('width', this._container.clientWidth);
            // this._canvas.innerHTML = this._options.supportError;

            this._canvasContext = this._canvas.getContext('2d');
        },

        _drawEnemies: function () {
            var i = 0,
                l = this._enemies.length;
            for (; i < l; i++) {
                // DRAW ENEMY
            }
        },

        _setupPlayer: function () {
            this._liveDataStore.player.spriteRef.src = "../sprites/ship.png";
            this._liveDataStore.player.spriteRef.frameWidth = 32;
            this._liveDataStore.player.spriteRef.frameHeight = 32;
            this._liveDataStore.player.spriteRef.frameCount = 16;
        },

        _drawPlayer: function () {

            this._canvasContext.drawImage(
                this._liveDataStore.player.spriteRef,
                this._liveDataStore.player.spriteRef.frameWidth,
                0,
                this._liveDataStore.player.spriteRef.frameWidth,
                this._liveDataStore.player.spriteRef.frameHeight,
                ((this._container.clientWidth / 2) - (this._liveDataStore.player.spriteRef.frameWidth / 2)),
                ((this._container.clientHeight / 2) - (this._liveDataStore.player.spriteRef.frameHeight / 2)),
                this._liveDataStore.player.spriteRef.frameWidth,
                this._liveDataStore.player.spriteRef.frameHeight
            );

        },
        _renderMenu: function () {},
        _renderSky: function () {}
    };

    return TimePilot;
});
