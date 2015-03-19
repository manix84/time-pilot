/* global define */
define("engine/GameArena", [
    "engine/helpers"
], function (
    helpers
) {

    /**
     * Create a GameArena instance to run the game in.
     * @constructor
     * @param   {HTML Element} containerElement - Element to load the canvas into.
     * @returns {GameArena Instance}
     */
    var GameArena = function (containerElement) {
        var that = this;
        this._containerElement = containerElement;
        this._canvas = document.createElement("canvas");
        this.resize();

        this._isInFullScreen = false;
        this._assets = [];

        this._oldWidth = this._containerElement.clientWidth;
        this._oldHeight = this._containerElement.clientHeight;

        this.posX = 0;
        this.posY = 0;

        helpers.bind("fullscreenchange webkitfullscreenchange mozfullscreenchange msfullscreenchange", function () {
            that._isInFullScreen = !that._isInFullScreen;
            if (that._isInFullScreen) {
                that.resize(screen.width, screen.height);
                window.console.log("Entered Full-Screen");
            } else {
                that.resize(that._oldWidth, that._oldHeight);
                window.console.log("Exited Full-Screen");
            }
        });

        this._init();
    };

    GameArena.prototype = {
        /**
         * Initialising canvas.
         * @method
         */
        _init: function () {
            this._styles = document.createElement("style");
            this._styles.innerText = "@font-face {" +
                "font-family: 'theFont';" +
                "src: url('./fonts/font.ttf');" +
            " }";

            this._containerElement.appendChild(this._styles);
            this._containerElement.appendChild(this._canvas);
        },

        /**
         * Update current viewport coordinates.
         * @param  {Number} posX
         * @param  {Number} posY
         */
        updatePosition: function (posX, posY) {
            this.posX = posX;
            this.posY = posY;
        },

        /**
         * Resize the canvas to specified height and width. Defaults to the container elements current dimentions.
         * @method
         * @param   {Number} width
         * @param   {Number} height
         */
        resize: function (width, height) {
            width = width || this._containerElement.clientWidth;
            height = height || this._containerElement.clientHeight;

            if (this._oldWidth !== this.width && this._oldHeight !== this.height) {
                this._oldWidth = this.width;
                this._oldHeight = this.height;
            }

            this._canvas.width = width;
            this._canvas.height = height;

            this._containerElement.width = width;
            this._containerElement.height = height;

            this.width = width;
            this.height = height;
        },

        /**
         * Return 2D or 3D canvas context.
         * @method
         * @param   {String} dimentions - Canvas context you want back (2D or 3D).
         * @returns {Canvas Context}
         */
        getContext: function (dimentions) {
            if (!this._context) {
                switch (dimentions) {
                case "3D":
                case "3d":
                case 3:
                    this._context = this._canvas.getContext("3d");
                    break;
                default:
                    this._context = this._canvas.getContext("2d");
                }
            }
            return this._context;
        },

        /**
         * Enter full-screen, using the full-screen api.
         * @method
         */
        enterFullScreen: function () {
            var element = this._canvas;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        },

        /**
         * Exit full-screen mode.
         * @method
         */
        exitFullScreen: function () {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        },

        /**
         * Toggle full-screen mode.
         * @method
         */
        toggleFullScreen: function () {
            window.console.log("this._isInFullScreen", this._isInFullScreen);
            if (this._isInFullScreen) {
                this.exitFullScreen();
            } else {
                this.enterFullScreen();
            }
        },

        /**
         * Set the canvas background-color.
         * @param  {String} color - Background-color to be set.
         */
        setBackgroundColor: function (color) {
            this._canvas.style.background = color;
        },

        /**
         * Clear entire games arena.
         */
        clear: function () {
            this._canvas.width = this._canvas.width;
            this._context.translate((this.width / 2), (this.height / 2));
        },

        /**
         * Register assets to be preloaded.
         * @method
         * @param   {String/Array} assets - Assets to be preloaded.
         */
        registerAssets: function (assets) {
            if (typeof assets === "string") {
                assets = [assets];
            }
            this._assets = [].concat(this._assets, assets);
        },

        /**
         * Begin preloading registered assets. Callback is run each time an asset is loaded.
         * @method
         * @param   {Function} callback - Callback is run on each completed asset.
         */
        preloadAssets: function (callback) {
            callback = callback || function () {};
            var loadedCount = 0,
                remainingCount = (this._assets.length - 1),
                i = remainingCount,
                img = [],
                onload, onerror;

            onload = function () {
                callback({
                    loaded: ++loadedCount,
                    remaining: --remainingCount
                });
            };
            onerror = function () {
                callback({
                    loaded: ++loadedCount,
                    remaining: --remainingCount
                });
            };

            for (; 0 < i; i--) {
                img[i] = new Image();
                img[i].src = this._assets[i];
                img[i].onload = onload;
                img[i].onerror = onerror;
                this._assets.splice(i, 1);
            }
        },

        /**
         * Render text.
         * @method
         * @param   {String} message            - Text to be rendered
         * @param   {Number} [startPosX]        - X coordinate to render
         * @param   {Number} [startPosY]        - Y coordinate to render
         * @param   {Object} [newOptions]
         * @enum    {String} [newOptions.align] - Text alignment
         * @enum    {Number} [newOptions.size]  - Text size
         * @enum    {String} [newOptions.color] - Text color
         * @enum    {String} [newOptions.font]  - Font type
         * @enum    {String} [newOptions.stroke]  - Stroke color. If not set, it won't show.
         */
        renderText: function (message, startPosX, startPosY, newOptions) {
            startPosX = startPosX || 0;
            startPosY = startPosY || 0;
            var options = {
                size: newOptions.size || 12,
                align: newOptions.align || "left",
                valign: newOptions.valign || "top",
                color: newOptions.color || "#fff",
                font: newOptions.font || "theFont",
                stroke: newOptions.stroke || false,
                strokeWidth: newOptions.strokeWidth || 1
            },
            context = this.getContext();

            context.fillStyle = options.color;
            context.font = options.size + "px " + options.font;
            context.textAlign = options.align;
            context.textBaseline = options.valign;
            context.fillText(message, startPosX, startPosY);

            if (options.stroke) {
                context.lineWidth = options.strokeWidth;
                context.strokeStyle = options.stroke;
                context.strokeText(message, startPosX, startPosY);
            }
        },

        /**
         * Render sprite
         * @method
         * @param   {Image Sprite} sprite   - Image sprite to be rendered
         * @param   {Object} spriteData     - Object containing coordinates and sprite positions.
         */
        renderSprite: function (sprite, spriteData) {
            var context = this.getContext();

            context.drawImage(
                sprite,
                (spriteData.frameX * spriteData.frameWidth), (spriteData.frameY * spriteData.frameHeight),
                spriteData.frameWidth, spriteData.frameHeight,
                spriteData.posX, spriteData.posY,
                spriteData.frameWidth, spriteData.frameHeight
            );
        },

        /**
         * Draw a circle centered around the X & Y coordinates.
         * @param  {Number} posX
         * @param  {Number} posY
         * @param  {Number} radius
         * @param  {Object} newOptions
         * @enum   {String} newOptions.color
         * @enum   {String} newOptions.strokeColor
         * @enum   {Number} newOptions.strokeWidth
         */
        drawCircle: function (posX, posY, radius, newOptions) {
            posX = posX || 0;
            posY = posY || 0;

            var options = {
                color: newOptions.color || "transparent",
                strokeColor: newOptions.strokeColor || false,
                strokeWidth: newOptions.strokeWidth || 1
            },
            context = this.getContext();

            context.beginPath();
            context.arc(posX, posY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = options.color;
            context.fill();

            if (options.strokeColor) {
                context.lineWidth = options.strokeWidth;
                context.strokeStyle = options.strokeColor;
                context.stroke();
            }
        },

        /**
         * Adds a grid to the canvas.
         * @param  {Number} [widthSpace=20]
         * @param  {Number} [heightSpace=20]
         */
        drawDebugGrid: function (widthSpace, heightSpace) {
            widthSpace = widthSpace || 20;
            heightSpace = heightSpace || 20;

            var x = 0;

            for (; x <= this.width; x += widthSpace) {
                this._canvas.moveTo(0.5 + x, 0);
                this._canvas.lineTo(0.5 + x, this.height);
            }

            for (x = 0; x <= this.height; x += heightSpace) {
                this._canvas.moveTo(0, 0.5 + x);
                this._canvas.lineTo(this.width, 0.5 + x);
            }

            this._canvas.strokeStyle = "#AAA";
            this._canvas.stroke();
        }
    };

    return GameArena;

});
