/* Converted from TimePilot.Player.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import userOptions from "./user-options";
import SoundEngine from "./engine/Sound";
import helpers from "./engine/helpers";
import palette from "./palette";
import type {
  BulletFactoryInstance,
  GameArenaInstance,
  GameDataStore,
  LevelConfig,
  PlayerConfig,
  PlayerData,
  PlayerInstance,
  TickerInstance,
} from "./types";

const playerConst = CONSTS.player;

class Player implements PlayerInstance {
  private _bulletFactory: BulletFactoryInstance;
  private _data: PlayerData;
  private _dataDefaults: PlayerData;
  private _explosionSound: SoundEngine;
  private _gameArena: GameArenaInstance;
  private _gameTicker: TickerInstance;
  private _playerDeathSprite: HTMLImageElement;
  private _playerSprite: HTMLImageElement;
  private _rotationStep: number;

  constructor(context: GameDataStore) {
    this._gameArena = context._gameArena;
    this._gameTicker = context._gameTicker;
    this._bulletFactory = context._bullets;

    this._playerSprite = new Image();
    this._playerSprite.src = playerConst.sprite.src;

    this._playerDeathSprite = new Image();
    this._playerDeathSprite.src = playerConst.explosion.sprite.src;

    this._explosionSound = new SoundEngine(playerConst.explosion.sound.src);
    this._rotationStep = 360 / playerConst.rotationFrameCount;

    this._data = {
      isAlive: true,
      deathTick: false,
      isFiring: false,
      heading: 90,
      newHeading: false,
      posX: 0,
      posY: 0,
      exploading: 0,
      continues: 0,
      lives: 3,
      score: 0,
      level: 1,
    };

    this._dataDefaults = helpers.cloneObject(this._data);
  }

  getData(): PlayerData;
  getData<K extends keyof PlayerData>(key: K): PlayerData[K] | undefined;
  getData<K extends keyof PlayerData>(key?: K) {
    if (!key) {
      return this._data;
    }

    if (Object.prototype.hasOwnProperty.call(this._data, key)) {
      return this._data[key];
    }

    return undefined;
  }

  setData<K extends keyof PlayerData>(
    key: K,
    value: PlayerData[K],
    isLastKnownGood?: boolean
  ): boolean {
    if (this._data[key] !== undefined) {
      this._data[key] = value;
      if (isLastKnownGood) {
        this._dataDefaults[key] = value;
      }
      return this._data[key] === value;
    }

    return false;
  }

  resetData(): void {
    this._data = helpers.cloneObject(this._dataDefaults);
  }

  private getLevelData(): LevelConfig["player"] {
    return CONSTS.levels[this._data.level].player;
  }

  reposition(): void {
    const { heading } = this._data;
    const velocity = this.getLevelData().velocity ?? 0;

    this._data.posX += helpers.float(
      Math.sin(heading * (Math.PI / 180)) * velocity
    );
    this._data.posY -= helpers.float(
      Math.cos(heading * (Math.PI / 180)) * velocity
    );

    this._gameArena.updatePosition(this._data.posX, this._data.posY);
  }

  rotate(): void {
    if (this._data.isAlive && this._data.newHeading !== false) {
      this._data.heading = helpers.rotateTo(
        this._data.newHeading,
        this._data.heading,
        this._rotationStep
      );
    }
  }

  startShooting(): void {
    this._data.isShooting = true;
  }

  stopShooting(): void {
    this._data.isShooting = false;
  }

  shoot(): void {
    if (this._data.isAlive && this._data.isShooting) {
      this._bulletFactory.create(
        0,
        0,
        this._data.heading,
        playerConst.projectile.size,
        playerConst.projectile.velocity,
        playerConst.projectile.color
      );
    }
  }

  private _renderPlayerExplosion(): void {
    if (this._data.deathTick === false) {
      return;
    }

    const explosionData = playerConst.explosion;
    const frameX = Math.floor(
      (this._gameTicker.getTicks() - this._data.deathTick) /
        explosionData.frameLimiter
    );

    this._gameArena.renderSprite(this._playerDeathSprite, {
      frameWidth: explosionData.width,
      frameHeight: explosionData.height,
      frameX,
      frameY: 0,
      posX: -(explosionData.width / 2),
      posY: -(explosionData.height / 2),
    });

    if (frameX === explosionData.frames) {
      this._data.removeMe = true;
    }
  }

  render(): void {
    let color: string = palette.aircraft.playerShield;

    if (!this._data.deathTick && this._data.isAlive) {
      this._gameArena.renderSprite(this._playerSprite, {
        frameWidth: playerConst.width,
        frameHeight: playerConst.height,
        frameX: Math.floor(this._data.heading / 22.5),
        frameY: 0,
        posX: -(playerConst.width / 2),
        posY: -(playerConst.height / 2),
      });
    } else {
      this._renderPlayerExplosion();
    }

    if (
      userOptions.enableDebug &&
      (userOptions.debug.invincible || userOptions.debug.showHitboxes)
    ) {
      if (userOptions.debug.invincible) {
        color = helpers.getRandomColor();
        playerConst.hitRadius = (playerConst.width + playerConst.height) / 4;
      }
      this._gameArena.drawCircle(0, 0, playerConst.hitRadius, {
        borderColor: color,
      });
    }
  }

  kill(): void {
    if (userOptions.enableDebug && userOptions.debug.invincible) {
      return;
    }

    if (!this._data.isAlive) {
      return;
    }

    this._data.isAlive = false;
    this._data.deathTick = this._gameTicker.getTicks();
    this._explosionSound.stop();
    this._explosionSound.play();
  }
}

export default Player;
