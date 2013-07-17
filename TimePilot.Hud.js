define("TimePilot.Hud", [
    "TimePilot.userOptions"
], function (
    userOptions
) {

    /**
     * Create a hud instance to be rendered on the gameArena
     * @constructor
     * @param   {Canvas Instance} gameArena
     * @param   {Player Instance} player
     * @returns {Hud Instance}
     */
    var Hud = function (gameArena, player) {
        this._gameArena = gameArena;
        this._playerData = player.getData();
    };

    Hud.prototype = {
        /**
         * Render hud to the gameArena.
         * @method
         */
        render: function () {
            this._gameArena.renderText(this._playerData.score,
                20,
                10,
                { size: 30 }
            );

            if (userOptions.enableDebug && userOptions.debug.showPlayerCoordinates) {
                this._gameArena.renderText(this._playerData.posX.toFixed(2) + " x " + this._playerData.posY.toFixed(2),
                    20,
                    40,
                    {size: 15}
                );
                this._gameArena.renderText(this._playerData.heading + "°",
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
            this._gameArena.renderText("Paused",
                (this._gameArena.width / 2),
                (this._gameArena.height / 2),
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
