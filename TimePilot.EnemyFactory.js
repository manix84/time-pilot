define("TimePilot.EnemyFactory", [
    "TimePilot.Enemy"
], function (Enemy) {
    var EnemyFactory = function (canvas, ticker, player) {
        this._enemies = [];
        this._canvas = canvas;
        this._player = player;
        this._ticker = ticker;
    };

    EnemyFactory.prototype = {
        create: function () {
            this._enemies.push(
                new Enemy(this._canvas, this._ticker, this._player)
            );
        },

        reposition: function () {
            var i = 0,
                len = this._enemies.length;

            for (; i < len; ++i) {
                this._enemies[i].reposition();
            }
        },

        render: function () {
            var i = 0,
                len = this._enemies.length;

            for (; i < len; ++i) {
                this._enemies[i].render();
            }
        }
    };

    return EnemyFactory;
});
