define("TimePilot.Controller.Keyboard2", [
    "engine/helpers"
], function (
    helpers
) {

    var Keyboard2 = function (controlInterface) {
        this._controlInterface = controlInterface;

        this.connect();
    };

    Keyboard2.prototype = {
        connect: function () {
            var that = this;
            helpers.bind("keydown", function (event) {

                switch (event.keyCode) {
                case 37: // Left-Key
                case 65: // "A"
                    event.preventDefault();
                    that._controlInterface.rotateAntiClockwise();
                    break;
                case 39: // Right-Key
                case 68: // "D"
                    event.preventDefault();
                    that._controlInterface.rotateClockwise();
                    break;
                case 32: // Space-Bar
                    event.preventDefault();
                    that._controlInterface.startShooting();
                    break;
                case 70: // "F"-Key
                    event.preventDefault();
                    that._controlInterface.toggleFullScreen();
                    break;
                case 27: // Escape-Key
                    event.preventDefault();
                    that._controlInterface.openMenu();
                    that._controlInterface.togglePause();
                    break;
                case 80: // "P"-Key
                    event.preventDefault();
                    that._controlInterface.togglePause();
                    break;
                }
            }, this._keyboardLock);

            helpers.bind("keyup", function () {

                switch (event.keyCode) {
                case 27: // Escape-Key
                case 70: // "F"-Key
                case 80: // "P"-Key
                    event.preventDefault();
                    break;
                case 37: // Left-Key
                case 39: // Right-Key
                case 65: // "A"
                case 68: // "D"
                    event.preventDefault();
                    that._controlInterface.stop();
                    break;
                case 32: // Space-Bar
                    event.preventDefault();
                    that._controlInterface.stopShooting();
                    break;
                }
            }, this._keyboardLock);
        },

        disconnect: function () {
            helpers.unbind("keydown");
            helpers.unbind("keyup");
        }
    };

    return Keyboard2;
});
