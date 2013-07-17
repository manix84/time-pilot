define("control.keyboard1", function () {

    var keyboard1 = function (controlInterface) {
        this._controlInterface = controlInterface;

        this._init();
    };

    keyboard1.prototype = {
        _init: function () {},

        _turnUp: function () {},

        _turnDown: function () {},

        _turnLeft: function () {},

        _turnRight: function () {},

        _shoot: function () {},

        _openMenu: function () {}
    };

    return keyboard1;
});
