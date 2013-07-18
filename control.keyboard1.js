define("control.keyboard1", function () {

    var keyboard1 = function (controlInterface) {
        this._controlInterface = controlInterface;

        this._init();
    };

    keyboard1.prototype = {
        connect: function () {
        },

        disconnect: function () {
        },

        _eventCallback: function (event) {
            switch (event.keyCode) {
            case 38: // Up, 0
                this._turnUp();
                break;
            case 40: // Down, 180
                this._turnDown();
                break;
            case 37: // Left, 270
                this._turnLeft();
                break;
            case 39: // Right, 90
                this._turnRight();
                break;
            }
        },

        _turnUp: function () {},

        _turnDown: function () {},

        _turnLeft: function () {},

        _turnRight: function () {},

        _shoot: function () {},

        _openMenu: function () {}
    };

    return keyboard1;
});
