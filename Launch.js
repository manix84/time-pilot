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
            this._player.positionY += (Math.cos(this._player.heading * (Math.PI / 180)) * SPEED);
            this._player.positionX += (Math.sin(this._player.heading * (Math.PI / 180)) * SPEED);
        },

        _player: {
            heading: 90,
            positionX: 0,
            positionY: 0
        },

        _boss: {
            heading: 90,
            positionX: 0,
            positionY: 0
        },

        _enemies: [],

        _bullets: [],

        _createCanvas: function () {
            this._canvas = document.createElement('canvas');
            this._container.appendChild(this._canvas);

            this._canvas.setAttribute('height', this._container.clientHeight);
            this._canvas.setAttribute('width', this._container.clientWidth);
            // this._canvas.innerHTML = this._options.supportError;

            this._canvasContext = this._canvas.getContext('2d');
        },

        _renderShip: function () {
            this.playerSprite = new Image();
            this.playerSprite.src = "../sprites/ship.png";
            this.playerSprite.frameWidth = 64;
            this.playerSprite.frameHeight = 64;
            this.playerSprite.frameCount = 16;

            this._canvasContext.drawImage(
                this.playerSprite,
                this.playerSprite.frameWidth,
                0,
                this.playerSprite.frameWidth,
                this.playerSprite.frameHeight,
                ((this._container.clientWidth / 2) - (this.playerSprite.frameWidth / 2)),
                ((this._container.clientHeight / 2) - (this.playerSprite.frameHeight / 2)),
                this.playerSprite.frameWidth,
                this.playerSprite.frameHeight
            );

        },
        _renderMenu: function () {},
        _renderSky: function () {}
    };

    return TimePilot;
});
