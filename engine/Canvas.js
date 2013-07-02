define("engine/Canvas", function () {

    var Canvas = function (containerElement) {
        this._containerElement = containerElement;
        this._canvas = document.createElement("canvas");

        this.width = this._containerElement.clientWidth;
        this.height = this._containerElement.clientHeight;


        this.init();
    };

    Canvas.prototype = {
        init: function () {
            this._canvas.setAttribute("width", this.width);
            this._canvas.setAttribute("height", this.height);

            this._styles = document.createElement("style");
            this._styles.innerText = "@font-face {" +
                "font-family: 'theFont';" +
                "src: url('./fonts/font.ttf');" +
            " }";

            this._containerElement.appendChild(this._styles);
        },

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

        getCanvas: function () {
            return this._canvas;
        },

        renderText: function (message, startPosX, startPosY, size, color, font) {
            startPosX   = startPosX || 0;
            startPosY   = startPosY || 0;
            size        = size      || 12;
            color       = color     || "#fff";
            font        = font      || "theFont";

            var context = this.getContext();

            context.fillStyle = color;
            context.font = size + "px " + font;
            context.textBaseline = "top";
            context.fillText(message, startPosX, startPosY);
        },

        renderSprite: function (spriteSrc, spriteData) {
            var context = this.getContext(),
                sprite = new Image();

            sprite.src = spriteSrc;

            context.drawImage(
                sprite,
                (spriteData.frameX * spriteData.frameWidth), (spriteData.frameY * spriteData.frameHeight),
                spriteData.frameWidth, spriteData.frameHeight,
                spriteData.posX, spriteData.posY,
                spriteData.frameWidth, spriteData.frameHeight
            );
        }
    };

    return Canvas;

});
