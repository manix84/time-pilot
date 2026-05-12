/* Converted from TimePilot.Bonus.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import helpers from "./engine/helpers";
import { getDespawnRadius } from "./viewport";
import type {
  BonusConfig,
  BonusData,
  GameArenaInstance,
  PlayerInstance,
} from "./types";

class Bonus {
  private _bonusSprite: HTMLImageElement;
  private _canvas: GameArenaInstance;
  private _data: BonusData;
  private _player: PlayerInstance;

  constructor(
    canvas: GameArenaInstance,
    player: PlayerInstance,
    posX: number,
    posY: number
  ) {
    this._canvas = canvas;
    this._player = player;

    this._data = {
      posX,
      posY,
      level: 1,
      layer: CONSTS.levels[1].props[0].layer,
      removeMe: false,
    };

    this._bonusSprite = new Image();
    this._bonusSprite.src = this.getLevelData().sprite.src;
  }

  private getLevelData(): BonusConfig {
    return CONSTS.levels[this._data.level].bonus;
  }

  private _checkInArena(): void {
    if (this._data.removeMe) {
      return;
    }

    this._data.removeMe = helpers.detectAreaExit(
      {
        posX: this._canvas.posX + this.getLevelData().width / 2,
        posY: this._canvas.posY + this.getLevelData().height / 2,
      },
      {
        posX: this._data.posX,
        posY: this._data.posY,
      },
      getDespawnRadius(this._canvas)
    );
  }

  reposition(): void {
    const levelData = this.getLevelData();
    const player = this._player.getData();
    const heading = player.heading;

    this._data.posX += helpers.float(
      Math.sin(heading * (Math.PI / 180)) * levelData.velocity
    );
    this._data.posY -= helpers.float(
      Math.cos(heading * (Math.PI / 180)) * levelData.velocity
    );

    this._checkInArena();
  }

  render(): void {
    const levelData = this.getLevelData();
    this._canvas.renderSprite(this._bonusSprite, {
      frameWidth: levelData.width,
      frameHeight: levelData.height,
      frameX: 0,
      frameY: 0,
      posX: this._data.posX - this._player.getData().posX - levelData.width / 2,
      posY:
        this._data.posY - this._player.getData().posY - levelData.height / 2,
    });
  }
}

export default Bonus;
