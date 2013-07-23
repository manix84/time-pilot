define("TimePilot.Menus", [
    "TimePilot.userOptions"
], function (
    userOptions
) {
    var Menus = function (gameArena) {
        this._gameArena = gameArena;
    };

    Menus.prototype = {

        show: function () {},

        hide: function () {}
    };

    return Menus;
});
