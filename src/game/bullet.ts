/* Converted from TimePilot.Bullet.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import userOptions from "./user-options";
import helpers from "./engine/helpers";
import palette from "./palette";
import { getDespawnRadius } from "./viewport";
import type {
  BulletData,
  BulletInstance,
  GameArenaInstance,
  GameDataStore,
  Heading,
} from "./types";

class Bullet implements BulletInstance {
  private _data: BulletData;
  private _gameArena: GameArenaInstance;
  private _level = 1;

  removeMe = false;

  constructor(
    context: GameDataStore,
    originX: number,
    originY: number,
    heading: Heading,
    size: number,
    velocity: number,
    color: string
  ) {
    this._gameArena = context._gameArena;
    this._data = {
      posX: originX,
      posY: originY,
      heading,
      size,
      velocity,
      color,
    };
  }

  getData(): BulletData;
  getData<K extends keyof BulletData>(key: K): BulletData[K] | undefined;
  getData<K extends keyof BulletData>(key?: K) {
    if (!key) {
      return this._data;
    }

    if (Object.prototype.hasOwnProperty.call(this._data, key)) {
      return this._data[key];
    }

    return undefined;
  }

  setData<K extends keyof BulletData>(
    key: K,
    value: BulletData[K]
  ): boolean {
    if (this._data[key] !== undefined) {
      this._data[key] = value;
      return this._data[key] === value;
    }

    return false;
  }

  setLevel(level: number): boolean {
    this._level = level;
    return this._level === level;
  }

  private _checkInArena(): void {
    if (this.removeMe) {
      return;
    }

    this.removeMe = helpers.detectAreaExit(
      {
        posX: this._data.size / 2,
        posY: this._data.size / 2,
      },
      {
        posX: this._data.posX,
        posY: this._data.posY,
      },
      getDespawnRadius(this._gameArena)
    );
  }

  reposition(): void {
    const { heading, velocity } = this._data;

    this._data.posX += helpers.float(
      Math.sin(heading * (Math.PI / 180)) * velocity
    );
    this._data.posY -= helpers.float(
      Math.cos(heading * (Math.PI / 180)) * velocity
    );

    this._checkInArena();
  }

  render(): void {
    const { color, size } = this._data;
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;

    context.fillStyle = color;
    context.fillRect(
      this._data.posX - size / 2,
      this._data.posY - size / 2,
      size,
      size
    );

    if (userOptions.enableDebug && userOptions.debug.showHitboxes) {
      this._gameArena.drawCircle(
        this._data.posX,
        this._data.posY,
        this._data.size,
        {
          borderColor: palette.debug.playerHitbox,
        }
      );
    }
  }
}

export default Bullet;
