/* Converted from TimePilot.Bonus.js (AMD) to ESM TypeScript. */
import CONSTS from "./TimePilot.CONSTANTS";
import helpers from "./engine/helpers";
import type {
  BonusData,
  GameArenaInstance,
  PlayerInstance,
} from "./TimePilot.types";

var Bonus = function (
  canvas: GameArenaInstance,
  player: PlayerInstance,
  posX: number,
  posY: number
) {
  this._canvas = canvas;
  this._player = player;

  this._data = {
    posX: posX,
    posY: posY,
    level: 1,
    layer: CONSTS.levels[1].props[0].layer,
    removeMe: false,
  } satisfies BonusData;

  this._bonusSprite = new Image();
  this._bonusSprite.src = this.getLevelData().sprite.src;
};

Bonus.prototype = {
  /**
   * Recalculate prop's current position and heading.
   * @method
   */
  reposition: function () {
    var data = this._data as BonusData;
    var levelData = this.getLevelData(),
      player = this._player.getData(),
      playerVelocity = CONSTS.levels[data.level].player.velocity,
      heading = levelData.reversed
        ? (player.heading + 180) % 360
        : player.heading,
      velocity = playerVelocity * levelData.relativeVelocity,
      canvas = this._canvas,
      turnTo;

    this._data.posX += helpers.float(
      Math.sin(heading * (Math.PI / 180)) * velocity
    );
    this._data.posY -= helpers.float(
      Math.cos(heading * (Math.PI / 180)) * velocity
    );

    this._checkInArena();
  },

  /**
   * Draw the bonus item sprite on the page.
   * @method render
   */
  render: function () {
    var levelData = this.getLevelData();
    this._canvas.renderSprite(this._bonusSprite, {
      frameWidth: levelData.width,
      frameHeight: levelData.height,
      frameX: 0,
      frameY: 0,
      posX: this._data.posX - this._player.getData().posX - levelData.width / 2,
      posY:
        this._data.posY - this._player.getData().posY - levelData.height / 2,
    });
  },
};

export default Bonus;
