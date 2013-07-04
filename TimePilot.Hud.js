define("TimePilot.Hud", function () {

    /**
     * Create a hud instance to be rendered on the canvas
     * @constructor
     * @param   {Canvas Instance} canvas
     * @param   {Player Instance} player
     * @returns {Hud Instance}
     */
    var Hud = function (canvas, player) {
        this._canvas = canvas;
        this._playerData = player.getData();

        this._isDebug = true;
    };

    Hud.prototype = {
        /**
         * Render hud to the canvas.
         * @method
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
        },

        /**
         * Render paused message.
         * @method
         */
        pause: function () {
            this._canvas.renderText("Paused",
                (this._canvas.width / 2),
                (this._canvas.height / 2),
                {
                    size: 30,
                    align: "center",
                    valign: "middle",
                    color: "#FFF",
                    stroke: "#000"
                }
            );
        }


    };

    return Hud;
});
