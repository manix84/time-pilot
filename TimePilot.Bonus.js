/* global define */
define("TimePilot.Bonus", [
    "TimePilot.CONSTANTS",
    "engine/helpers"
], function (
    CONSTS,
    helpers
) {

    var Bonus = function (canvas, player, posX, posY) {
        this._canvas = canvas;
        this._player = player;

        this._data = {};
        this._data.posX = posX;
        this._data.posY = posY;
        this._data.level = 1;
        this._data.layer = CONSTS.levels[this._data.level].props[this._data.type].layer;
        this._data.removeMe = false;

        this._bonusSprite = new Image();
        this._bonusSprite.src = this.getLevelData().sprite.src;
    };

    Bonus.prototype = {


        /**
         * Recalculate prop's current position and heading.
         * @method
         */
        reposition: function () {
            var levelData = this.getLevelData(),
                player = this._player.getData(),
                playerVelocity = CONSTS.levels[this._data.level].player.velocity,
                heading = (levelData.reversed ? (player.heading + 180) % 360 : player.heading),
                velocity = (playerVelocity * levelData.relativeVelocity),
                canvas = this._canvas,
                turnTo;

            this._data.posX += helpers.float(Math.sin(heading * (Math.PI / 180)) * velocity);
            this._data.posY -= helpers.float(Math.cos(heading * (Math.PI / 180)) * velocity);

            this._checkInArena();
        },

        /**
         * Draw the bonus item sprite on the page.
         * @method render
         * @return {[type]}
         */
        render: function () {
            var levelData = this.getLevelData();
            this._canvas.renderSprite(this._bonusSprite, {
                frameWidth: levelData.width,
                frameHeight: levelData.height,
                frameX: 0,
                frameY: 0,
                posX: (this._data.posX - this._player.getData().posX - (levelData.width / 2)),
                posY: (this._data.posY - this._player.getData().posY - (levelData.height / 2))
            });
        }
    };

    return Bonus;
});
