/* Converted from TimePilot.Player.js (AMD) to ESM TypeScript. */
import { levels, player, scoring, sounds } from "./constants";
import userOptions from "./user-options";
import { drawDebugVectors } from "./debug-vectors";
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

const playerConst = player;
const playerSpriteArcDegrees = 360;

class Player implements PlayerInstance {
  private _bulletFactory: BulletFactoryInstance;
  private _context: GameDataStore;
  private _data: PlayerData;
  private _dataDefaults: PlayerData;
  private _enemyBulletFactory: BulletFactoryInstance;
  private _extraLifeSound: SoundEngine;
  private _explosionSound: SoundEngine;
  private _gameArena: GameArenaInstance;
  private _gameTicker: TickerInstance;
  private _playerDeathSprite: HTMLImageElement;
  private _playerSprite: HTMLImageElement;
  private _rotationStep: number;

  constructor(context: GameDataStore) {
    this._context = context;
    this._gameArena = context._gameArena;
    this._gameTicker = context._gameTicker;
    this._bulletFactory = context._bullets;
    this._enemyBulletFactory = context._enemyBullets;

    this._playerSprite = new Image();
    this._playerSprite.src = playerConst.sprite.src;

    this._playerDeathSprite = new Image();
    this._playerDeathSprite.src = playerConst.explosion.sprite.src;

    this._explosionSound = new SoundEngine(playerConst.explosion.sound.src);
    this._extraLifeSound = new SoundEngine(sounds.extraLife.src);
    this._rotationStep = playerSpriteArcDegrees / playerConst.rotationFrameCount;

    this._data = {
      isAlive: true,
      deathTick: false,
      isFiring: false,
      heading: 90,
      newHeading: false,
      posX: 0,
      posY: 0,
      exploading: 0,
      continues: userOptions.debugContinues,
      lives: userOptions.debugLives,
      nextExtraLifeScore: scoring.extraLife.first,
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

  setData = <K extends keyof PlayerData>(key: K, value: PlayerData[K], isLastKnownGood?: boolean): boolean => {
    if (this._data[key] !== undefined) {
      this._data[key] = value;

      if (key === "score") {
        this.awardExtraLives();
      }

      if (isLastKnownGood) {
        this._dataDefaults[key] = value;

        if (key === "score") {
          this._dataDefaults.lives = this._data.lives;
          this._dataDefaults.nextExtraLifeScore = this._data.nextExtraLifeScore;
        }
      }
      return this._data[key] === value;
    }

    return false;
  };

  resetData = (): void => {
    this._data = helpers.cloneObject(this._dataDefaults);
  };

  private getLevelData = (): LevelConfig["player"] => {
    return levels[this._data.level].player;
  };

  private awardExtraLives = (): void => {
    let awardedLives = 0;

    while (this._data.score >= this._data.nextExtraLifeScore) {
      awardedLives += 1;
      this._data.lives += 1;
      this._data.nextExtraLifeScore += scoring.extraLife.interval;
    }

    if (awardedLives > 0) {
      this._extraLifeSound.stop();
      this._extraLifeSound.play();
    }
  };

  reposition = (): void => {
    const { heading } = this._data;
    const velocity = this.getLevelData().velocity ?? 0;

    this._data.posX += helpers.float(
      Math.sin(heading * (Math.PI / 180)) * velocity
    );
    this._data.posY -= helpers.float(
      Math.cos(heading * (Math.PI / 180)) * velocity
    );

    this._gameArena.updatePosition(this._data.posX, this._data.posY);
  };

  rotate = (): void => {
    if (this._data.isAlive && this._data.newHeading !== false) {
      this._data.heading = helpers.rotateTo(
        this._data.newHeading,
        this._data.heading,
        this._rotationStep
      );
    }
  };

  startShooting = (): void => {
    this._data.isShooting = true;
  };

  stopShooting = (): void => {
    this._data.isShooting = false;
  };

  shoot = (): void => {
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
  };

  private _renderPlayerExplosion = (): void => {
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

    if (frameX >= explosionData.frames) {
      if (this._data.lives > 0) {
        this._respawnAtLevelStart();
      } else {
        this._data.removeMe = true;
      }
    }
  };

  private _getSpriteFrame = (): { flipY: boolean; frameX: number; frameY: number } => {
    const heading = ((this._data.heading % 360) + 360) % 360;
    const frame =
      Math.round(((heading + 270) % 360) / this._rotationStep) %
      playerConst.rotationFrameCount;

    return {
      flipY: false,
      frameX: playerConst.spriteFrameAxis === "y" ? 0 : frame,
      frameY: playerConst.spriteFrameAxis === "y" ? frame : 0,
    };
  };

  render = (): void => {
    let color: string = palette.aircraft.playerShield;

    if (!this._data.deathTick && this._data.isAlive) {
      const spriteFrame = this._getSpriteFrame();

      this._gameArena.renderSprite(this._playerSprite, {
        frameWidth: playerConst.frameWidth,
        frameHeight: playerConst.frameHeight,
        frameX: spriteFrame.frameX,
        frameY: spriteFrame.frameY,
        flipY: spriteFrame.flipY,
        renderWidth: playerConst.width,
        renderHeight: playerConst.height,
        posX: -(playerConst.width / 2),
        posY: -(playerConst.height / 2),
      });
    } else {
      this._renderPlayerExplosion();
    }

    if (
      userOptions.enableDebug &&
      (this._isDebugInvincibleActive() || userOptions.debug.showHitboxes)
    ) {
      if (this._isDebugInvincibleActive()) {
        color = helpers.getRandomColor();
        playerConst.hitRadius = (playerConst.width + playerConst.height) / 4;
      }
      this._gameArena.drawCircle(0, 0, playerConst.hitRadius, {
        borderColor: color,
      });
    }

    if (userOptions.enableDebug && userOptions.debug.showHeadingVectors) {
      const context = this._gameArena.getContext() as CanvasRenderingContext2D;
      const steeringHeading =
        this._data.newHeading === false ? this._data.heading : this._data.newHeading;

      drawDebugVectors(context, 0, 0, this._data.heading, steeringHeading, {
        fillTurnArc: userOptions.debug.showSteeringArc,
        length: 38,
      });
    }
  };

  kill = (): void => {
    if (this._isDebugInvincibleActive()) {
      return;
    }

    if (!this._data.isAlive) {
      return;
    }

    this._data.lives = Math.max(0, this._data.lives - 1);
    this._data.isAlive = false;
    this._data.isShooting = false;
    this._data.newHeading = false;
    this._data.deathTick = this._gameTicker.getTicks();
    this._explosionSound.stop();
    this._explosionSound.play();
  };

  private _isDebugInvincibleActive = (): boolean => {
    return (
      userOptions.enableDebug &&
      userOptions.debug.invincible &&
      !this._context._isDemoMode
    );
  };

  private _respawnAtLevelStart = (): void => {
    this._data.isAlive = true;
    this._data.deathTick = false;
    this._data.isShooting = false;
    this._data.newHeading = false;
    this._data.heading = this._dataDefaults.heading;
    this._data.posX = 0;
    this._data.posY = 0;
    this._data.removeMe = false;
    this._bulletFactory.clearAll();
    this._enemyBulletFactory.clearAll();
    this._gameArena.updatePosition(this._data.posX, this._data.posY);
  };
}

export default Player;
