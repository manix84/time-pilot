define("TimePilot.Controller.Keyboard2", [
    "engine/helpers"
], function (
    helpers
) {

    var Keyboard2 = function (controllerInterface) {
        this._controllerInterface = controllerInterface;

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
                    that._controllerInterface.rotateAntiClockwise();
                    break;
                case 39: // Right-Key
                case 68: // "D"
                    event.preventDefault();
                    that._controllerInterface.rotateClockwise();
                    break;
                case 32: // Space-Bar
                    event.preventDefault();
                    that._controllerInterface.startShooting();
                    break;
                case 70: // "F"-Key
                    event.preventDefault();
                    that._controllerInterface.toggleFullScreen();
                    break;
                case 27: // Escape-Key
                    event.preventDefault();
                    that._controllerInterface.openMenu();
                    that._controllerInterface.togglePause();
                    break;
                case 80: // "P"-Key
                    event.preventDefault();
                    that._controllerInterface.togglePause();
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
                    that._controllerInterface.stop();
                    break;
                case 32: // Space-Bar
                    event.preventDefault();
                    that._controllerInterface.stopShooting();
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
