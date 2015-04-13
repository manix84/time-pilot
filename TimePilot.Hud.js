/* global define */
define("TimePilot.Hud", [
    "TimePilot.userOptions",
    "TimePilot.dataStore"
], function (
    userOptions,
    dataStore
) {

    /**
     * Create a hud instance to be rendered on the gameArena
     * @constructor
     * @returns {Hud Instance}
     */
    var Hud = function () {
        this._gameArena = dataStore._gameArena;
        this._playerData = dataStore._player.getData();
    };

    Hud.prototype = {
        /**
         * Render hud to the gameArena.
         * @method
         */
        render: function () {
            this._gameArena.renderText(this._playerData.score,
                (-(this._gameArena.width / 2) + 20),
                (-(this._gameArena.height / 2) + 10),
                { size: 30 }
            );

            if (userOptions.enableDebug && userOptions.debug.showPlayerCoordinates) {
                this._gameArena.renderText(this._playerData.posX.toFixed(2) + " x " + this._playerData.posY.toFixed(2),
                    (-(this._gameArena.width / 2) + 20),
                    (-(this._gameArena.height / 2) + 40),
                    {size: 15}
                );
                this._gameArena.renderText(this._playerData.heading + "°",
                    (-(this._gameArena.width / 2) + 20),
                    (-(this._gameArena.height / 2) + 55),
                    {size: 15}
                );
            }

            if (!this._playerData.isAlive) {
                this._gameArena.renderText("Game Over",
                    0,
                    0,
                    {
                        size: 30,
                        align: "center",
                        valign: "middle",
                        color: "#FFF"
                    }
                );
                this._gameArena.renderText("Press \"R\" to reset",
                    0,
                    30,
                    {
                        size: 20,
                        align: "center",
                        valign: "middle",
                        color: "#FFF"
                    }
                );
            }
            if (!dataStore._gameTicker.isRunning) {
                this._gameArena.renderText("Paused",
                    0,
                    25,
                    {
                        size: 25,
                        align: "center",
                        valign: "middle",
                        color: "#FFF"
                    }
                );
                this._gameArena.renderText("Press \"P\" to continue",
                    0,
                    45,
                    {
                        size: 20,
                        align: "center",
                        valign: "middle",
                        color: "#FFF"
                    }
                );
            }
        },

        /**
         * Render paused message.
         * @method
         */
        pause: function () {
        },

        restart: function () {
            this._gameArena.renderText("Restarting",
                0,
                0,
                {
                    size: 30,
                    align: "center",
                    valign: "middle",
                    color: "#FFF"
                }
            );
        }


    };

    return Hud;
});
