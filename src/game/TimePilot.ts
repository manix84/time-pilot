/* Converted from TimePilot.js (AMD) to ESM TypeScript. */
import GameArena from "./engine/GameArena";
import helpers from "./engine/helpers";
import Ticker from "./engine/Ticker";
import BulletFactory from "./TimePilot.BulletFactory";
import CONST from "./TimePilot.CONSTANTS";
import Gamepad from "./TimePilot.Controller.Gamepad";
import Keyboard1 from "./TimePilot.Controller.Keyboard1";
import ControllerInterface from "./TimePilot.ControllerInterface";
import dataStore from "./TimePilot.dataStore";
import EnemyFactory from "./TimePilot.EnemyFactory";
import Hud from "./TimePilot.Hud";
import Player from "./TimePilot.Player";
import PropFactory from "./TimePilot.PropFactory";
import userOptions from "./TimePilot.userOptions";
import type { AssetProgress, Controller, Coordinates } from "./TimePilot.types";

interface TimePilotOptions {
  debug?: boolean;
  [key: string]: boolean | undefined;
}

var TimePilot = function (element: HTMLElement, options: TimePilotOptions = {}) {
  this._container = element;

  var property = null;

  for (property in options) {
    if (
      options.hasOwnProperty(property) &&
      this._options.hasOwnProperty(property)
    ) {
      this._options[property] = options[property];
    }
  }
  dataStore._level = 1;

  this._init();
};

TimePilot.prototype = {
  _options: {
    debug: false,
  },

  _data: {},

  _init: function () {
    var that = this;

    userOptions.enableDebug = this._options.debug;

    dataStore._gameArena = new GameArena(this._container);
    dataStore._renderTicker = new Ticker();
    dataStore._gameTicker = new Ticker();
    dataStore._bullets = new BulletFactory();
    dataStore._player = new Player();
    dataStore._enemies = new EnemyFactory();
    dataStore._props = new PropFactory();
    dataStore._hud = new Hud();

    var controllerInterface = new ControllerInterface({
      restart: () => {
        that.restartGame();
      },
      pause: () => {
        that.pauseGame();
      },
    });

    dataStore._currentController = [];
    dataStore._currentController.push(new Keyboard1(controllerInterface));
    dataStore._currentController.push(new Gamepad(controllerInterface));

    dataStore._player.setData("level", 1);
    dataStore._gameArena.renderText("Loading", 20, 10, { size: 30 });

    dataStore._gameArena.registerAssets([
      "/fonts/font.ttf",
      "/sprites/player/player.png",
      "/sounds/player/bullet.mp3",
      "/sprites/player/explosion.png",
      "/sprites/enemies/basic/level1.png",
      // "/sprites/enemies/basic/level2.png",
      // "/sprites/enemies/basic/level3.png",
      // "/sprites/enemies/basic/level4.png",
      // "/sprites/enemies/basic/level5.png",
      "/sprites/enemies/basic/explosion.png",
      "/sprites/props/cloud1.png",
      "/sprites/props/cloud2.png",
      "/sprites/props/cloud3.png",
    ]);

    dataStore._gameArena.preloadAssets((obj: AssetProgress) => {
      if (!obj.remaining) {
        that._start();
        dataStore._gameTicker.start();
        dataStore._renderTicker.start();
      }
    });
  },

  _start: function () {
    var that = this;

    this._addRandomClouds();

    dataStore._gameTicker.addSchedule(() => {
      that.pauseGame();
      window.console.warn("Stopping: 50,000 ticks");
    }, 50000);

    dataStore._gameTicker.addSchedule(() => {
      dataStore._player.reposition();
      dataStore._enemies.reposition();
      dataStore._bullets.reposition();
      dataStore._props.reposition();

      that._spawnEntities();
    }, 1);

    dataStore._gameTicker.addSchedule(() => {
      dataStore._player.rotate();
    }, 3);
    dataStore._gameTicker.addSchedule(() => {
      dataStore._player.shoot();
    }, 5);

    dataStore._renderTicker.addSchedule(() => {
      dataStore._gameArena.clear();
      dataStore._gameArena.setBackgroundColor(
        CONST.levels[dataStore._level].arena.backgroundColor
      );

      dataStore._props.render(1);

      dataStore._bullets.render();
      dataStore._enemies.render();

      dataStore._player.render();

      dataStore._props.render(2);

      dataStore._hud.render();
    }, 1);

    dataStore._gameTicker.addSchedule(() => {
      dataStore._enemies.detectCollision();
    }, 1);

    dataStore._gameTicker.addSchedule(() => {
      dataStore._enemies.cleanup();
      dataStore._bullets.cleanup();
      dataStore._props.cleanup();
    }, 1);
  },

  restartGame: function () {
    var that = this;
    window.console.info("Restarting");
    dataStore._gameTicker.stop(() => {
      dataStore._hud.restart();

      dataStore._gameTicker.clearTicks();
      dataStore._gameTicker.clearSchedule();
      dataStore._enemies.clearAll();
      dataStore._bullets.clearAll();
      dataStore._props.clearAll();
      dataStore._player.resetData();

      that._start();
      dataStore._gameTicker.start();
    });
  },

  destroyGame: function () {
    if (dataStore._gameTicker) {
      dataStore._gameTicker.stop();
      dataStore._gameTicker.clearSchedule();
      dataStore._gameTicker.clearTicks();
    }
    if (dataStore._renderTicker) {
      dataStore._renderTicker.stop();
      dataStore._renderTicker.clearSchedule();
      dataStore._renderTicker.clearTicks();
    }
    if (dataStore._currentController && dataStore._currentController.length) {
      dataStore._currentController.forEach((controller: Controller) => {
        if (controller && typeof controller.disconnect === "function") {
          controller.disconnect();
        }
      });
      dataStore._currentController = [];
    }
  },

  pauseGame: function (forcePause?: boolean) {
    if (dataStore._gameTicker.isRunning || !!forcePause) {
      window.console.info("Pausing");
      dataStore._gameTicker.stop();
    } else {
      window.console.info("Unpausing");
      dataStore._gameTicker.start();
    }
  },

  _addRandomClouds: function () {
    var i = 0;
    for (; i < 20; i++) {
      // Clouds
      dataStore._props.create(
        Math.floor(Math.random() * dataStore._gameArena.width),
        Math.floor(Math.random() * dataStore._gameArena.height)
      );
    }
  },

  _spawnEntities: function () {
    var data: Coordinates = { posX: 0, posY: 0 },
      heading = 0,
      randomTickInterval = Math.floor(Math.random() * (1 - 200 + 1)) + 200;
    if (
      dataStore._gameTicker.getTicks() % randomTickInterval === 0 &&
      dataStore._enemies.isUnderLimit()
    ) {
      // Enemies
      data = helpers.getSpawnCoords(dataStore._player.getData());
      heading = helpers.findHeading(
        {
          posX: data.posX,
          posY: data.posY,
        },
        {
          posX: dataStore._player.getData().posX,
          posY: dataStore._player.getData().posY,
        }
      );
      dataStore._enemies.create(data.posX, data.posY, heading);
    }
    if (dataStore._props.getCount() < 20) {
      // Clouds
      data = helpers.getSpawnCoords(dataStore._player.getData());
      dataStore._props.create(data.posX, data.posY);
    }
  },
};

export default TimePilot;
