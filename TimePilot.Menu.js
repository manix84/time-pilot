/* global define */
define("TimePilot.Menus", [
    "TimePilot.userOptions"
], function (
    userOptions
) {
    var Menus = function (gameArena) {
        this._gameArena = gameArena;
    };

    Menus.prototype = {

        _renderButton: function () {
            var context = this._gameArena.getContext();

        },

        show: function () {},

        hide: function () {},

        render: function () {}
    };

    return Menus;
});
