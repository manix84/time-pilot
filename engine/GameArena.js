define("engine/GameArena", function () {

    /**
     * Create a GameArena instance to run the game in.
     * @constructor
     * @param   {HTML Element} containerElement - Element to load the canvas into.
     * @returns {GameArena Instance}
     */
    var GameArena = function (containerElement) {
        this._containerElement = containerElement;
        this._canvas = document.createElement("canvas");
        this.resize();

        this._isInFullScreen = false;
        this._assets = [];

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
         * Resize the canvas to specified height and width. Defaults to the container elements current dimentions.
         * @method
         * @param   {Number} width
         * @param   {Number} height
         */
        resize: function (width, height) {
            width = width || this._containerElement.clientWidth;
            height = height || this._containerElement.clientHeight;

            this._canvas.setAttribute("width", width);
            this._canvas.setAttribute("height", height);

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
            var context;

            switch (dimentions) {
            case "3D":
            case "3d":
            case 3:
                context = this._canvas.getContext("3d");
                break;
            default:
                context = this._canvas.getContext("2d");
            }
            return context;
        },

        /**
         * Enter full-screen, using the full-screen api.
         * @method
         */
        enterFullScreen: function () {
            var element = this._containerElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
                this.resize();
                this._isInFullScreen = true;
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
                this.resize();
                this._isInFullScreen = true;
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                this.resize();
                this._isInFullScreen = true;
            }
        },

        /**
         * Exit full-screen mode.
         * @method
         */
        exitFullScreen: function () {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
                this.resize();
                this._isInFullScreen = false;
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
                this.resize();
                this._isInFullScreen = false;
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
                this.resize();
                this._isInFullScreen = false;
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
                window.console.log("Exiting full-screen");
            } else {
                this.enterFullScreen();
                window.console.log("Entering full-screen");
            }
        },

        /**
         * Get the Canvas.
         * @method
         * @returns {Canvas}
         */
        getCanvas: function () {
            return this._canvas;
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
                window.console.info("Loaded: " + loadedCount + ", Remaining: " + remainingCount);
            };
            onerror = function () {
                callback({
                    loaded: ++loadedCount,
                    remaining: --remainingCount
                });
                window.console.error("Loaded: " + loadedCount + ", Remaining: " + remainingCount);
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
        }
    };

    return GameArena;

});
