/* global define */
define("engine/Sprite", [
    "engine/helpers"
], function (
    helpers
) {

    /**
     * Games Engine v0.1 - Sprite
     * @author  Rob Taylor [manix84@gmail.com]
     * @constructor {Sprite}
     * @param  {String} spriteSrc The image/sprite you want to render
     * @param  {Number} frameHeight    The height of the image or frame
     * @param  {Number} frameWidth     The width of the
     * @returns {Sprite Instance}
     */
    var Sprite = function (spriteSrc, frameWidth, frameHeight) {

        if (typeof urls === 'undefined') {
            throw new Error('You must set an image URL.');
        }
        var that = this;

        this._frameWidth = frameWidth;
        this._frameHeight = frameHeight;

        this._frameX = 0;
        this._frameY = 0;

        this._image = new Image();
        this._image.src = spriteSrc;
    };

    Sprite.prototype = {

        /**
         * Render sprite
         * @method
         * @param   {Image Sprite} sprite   - Image sprite to be rendered
         * @param   {Object} spriteData     - Object containing coordinates and sprite positions.
         */
        render: function (posX, posY) {
            var context = this.getContext();

            this._frameX = frames.x || this._frameX;
            this._frameY = frames.y || this._frameY;

            context.drawImage(
                this._image,
                (this._frameX * this._frameWidth), (this._frameY * this._frameHeight),
                this._frameWidth, this._frameHeight,
                posX, posY,
                this._frameWidth, this._frameHeight
            );
        }
    };

    return Sprite;

});
