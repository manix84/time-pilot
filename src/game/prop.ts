/* Converted from TimePilot.Prop.js (AMD) to ESM TypeScript. */
import { levels } from "./constants";
import { helpers } from "./engine";
import { getDespawnRadius } from "./viewport";
import type {
  GameArenaInstance,
  GameDataStore,
  PlayerInstance,
  PropConfig,
  PropData,
  PropInstance,
} from "./types";

/**
 * Background prop entity that moves relative to the player and despawns off-screen.
 */
class Prop implements PropInstance {
  private _data: PropData;
  private _gameArena: GameArenaInstance;
  private _player: PlayerInstance;
  private _propSprite: HTMLImageElement;

  removeMe = false;

  constructor(context: GameDataStore, posX: number, posY: number) {
    this._gameArena = context._gameArena;
    this._player = context._player;

    const level = context._level;
    const type = Math.floor(Math.random() * levels[level].props.length);
    this._data = {
      posX,
      posY,
      level,
      type,
      layer: levels[level].props[type].layer,
    };

    this._propSprite = new Image();
    this._propSprite.src = this.getLevelData().sprite.src;
  }

  getData(): PropData;
  getData<K extends keyof PropData>(key: K): PropData[K] | undefined;
  getData<K extends keyof PropData>(key?: K) {
    if (!key) {
      return this._data;
    }

    if (Object.prototype.hasOwnProperty.call(this._data, key)) {
      return this._data[key];
    }

    return undefined;
  }

  private getLevelData = (): PropConfig => {
    return levels[this._data.level].props[this._data.type];
  };

  isFlyThrough = (): boolean => {
    return this.getLevelData().foregroundOpacity !== undefined;
  };

  private _checkInArena = (): void => {
    const levelData = this.getLevelData();

    if (this.removeMe) {
      return;
    }

    this.removeMe = helpers.detectAreaExit(
      {
        posX: this._gameArena.posX + levelData.width / 2,
        posY: this._gameArena.posY + levelData.height / 2,
      },
      {
        posX: this._data.posX,
        posY: this._data.posY,
      },
      getDespawnRadius(this._gameArena)
    );
  };

  reposition = (): void => {
    const levelData = this.getLevelData();
    const player = this._player.getData();
    const playerVelocity = levels[this._data.level].player.velocity;
    const heading = levelData.reversed
      ? (player.heading + 180) % 360
      : player.heading;
    const velocity = playerVelocity * levelData.relativeVelocity;

    this._data.posX += helpers.float(
      Math.sin(heading * (Math.PI / 180)) * velocity
    );
    this._data.posY -= helpers.float(
      Math.cos(heading * (Math.PI / 180)) * velocity
    );

    this._checkInArena();
  };

  render = (options: { opacity?: number } = {}): void => {
    const levelData = this.getLevelData();
    const renderWidth = levelData.renderWidth ?? levelData.width;
    const renderHeight = levelData.renderHeight ?? levelData.height;
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;

    context.save();
    context.globalAlpha *= options.opacity ?? 1;
    this._gameArena.renderSprite(this._propSprite, {
      frameWidth: levelData.width,
      frameHeight: levelData.height,
      frameX: 0,
      frameY: 0,
      posX: this._data.posX - this._player.getData().posX - renderWidth / 2,
      posY:
        this._data.posY - this._player.getData().posY - renderHeight / 2,
      renderWidth,
      renderHeight,
    });
    context.restore();
  };
}

export default Prop;
