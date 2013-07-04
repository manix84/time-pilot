define("TimePilot.Hud", function () {

    var Hud = function (canvas, player) {
        this._canvas = canvas;
        this._playerData = player.getData();

        this._isDebug = true;
    };

    Hud.prototype = {
        /**
         * Render hud to the canvas.
         * @method
         * @returns {[type]}
         */
        render: function () {
            this._canvas.renderText(this._playerData.score,
                20,
                10,
                { size: 30 }
            );

            if (this._isDebug) {
                this._canvas.renderText(this._playerData.posX.toFixed(2) + " x " + this._playerData.posY.toFixed(2),
                    20,
                    40,
                    {size: 15}
                );
                this._canvas.renderText(this._playerData.heading + "°",
                    20,
                    55,
                    {size: 15}
                );
            }
        }


    };

    return Hud;
});
