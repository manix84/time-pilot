define('time-pilot/launch', [
    'engine/ticker', // Some engine component.
    'engine/sound' // Some engine component.
], function (icker, sound) {

    var timePilot = function () {

    };

    timePilot.prototype = {
        start: function () {},
        _renderMenu: function () {},
        _renderShip: function () {}
    };

    return timePilot;
});
