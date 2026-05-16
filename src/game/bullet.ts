/* Converted from TimePilot.Bullet.js (AMD) to ESM TypeScript. */
import userOptions from "./user-options";
import { drawDebugVectors } from "./debug-vectors";
import SoundEngine from "./engine/Sound";
import helpers from "./engine/helpers";
import palette from "./palette";
import { getDespawnRadius } from "./viewport";
import type {
  BulletData,
  BulletInstance,
  GameArenaInstance,
  GameDataStore,
  Heading,
  PlayerInstance,
} from "./types";

/**
 * Player or enemy projectile with movement, rendering, collision state, and sounds.
 */
class Bullet implements BulletInstance {
  private _data: BulletData;
  private _explosionSprite?: HTMLImageElement;
  private _flightSound?: SoundEngine;
  private _launchSound?: SoundEngine;
  private _projectileSprite?: HTMLImageElement;
  private _gameArena: GameArenaInstance;
  private _gameTicker: GameDataStore["_gameTicker"];
  private _level = 1;
  private _player: PlayerInstance;

  removeMe = false;

  constructor(
    context: GameDataStore,
    originX: number,
    originY: number,
    heading: Heading,
    size: number,
    velocity: number,
    color: string,
    coordinateSpace: BulletData["coordinateSpace"] = "screen",
    shape: BulletData["shape"] = "square",
    sprite?: BulletData["sprite"],
    tracksPlayer = false,
    turnRate = 0,
    shootable = false,
    explosion?: BulletData["explosion"],
    sound?: BulletData["sound"],
    flightSound?: BulletData["flightSound"],
    explosionSound?: BulletData["explosionSound"]
  ) {
    this._gameArena = context._gameArena;
    this._gameTicker = context._gameTicker;
    this._player = context._player;
    this._data = {
      posX: originX,
      posY: originY,
      coordinateSpace,
      heading,
      shape,
      size,
      velocity,
      color,
      sprite,
      tracksPlayer,
      turnRate,
      shootable,
      explosion,
      sound,
      flightSound,
      explosionSound,
      explosionTick: false,
    };

    if (sprite) {
      this._projectileSprite = new Image();
      this._projectileSprite.src = sprite.sprite.src;
    }

    if (explosion) {
      this._explosionSprite = new Image();
      this._explosionSprite.src = explosion.sprite.src;
    }

    if (sound) {
      this._launchSound = new SoundEngine(sound.src);
      this.updateSpatialSoundPosition(this._launchSound);
      this._launchSound.play();
    }

    if (flightSound) {
      this._flightSound = new SoundEngine(flightSound.src);
      this.updateSpatialSoundPosition(this._flightSound);
      this._flightSound.loop();
    }
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

  setData = <K extends keyof BulletData>(key: K, value: BulletData[K]): boolean => {
    if (this._data[key] !== undefined) {
      this._data[key] = value;
      return this._data[key] === value;
    }

    return false;
  };

  setLevel = (level: number): boolean => {
    this._level = level;
    return this._level === level;
  };

  explode = (): void => {
    if (this._data.explosionTick !== false || this.removeMe) {
      return;
    }

    this.stopFlightSound();
    this.playExplosionSound();

    if (!this._data.explosion) {
      this.removeMe = true;
      return;
    }

    this._data.explosionTick = this._gameTicker.getTicks();
  };

  private _checkInArena = (): void => {
    if (this.removeMe) {
      return;
    }

    if (this._data.coordinateSpace === "world") {
      this.removeMe = helpers.detectAreaExit(
        {
          posX: this._gameArena.posX,
          posY: this._gameArena.posY,
        },
        {
          posX: this._data.posX,
          posY: this._data.posY,
        },
        getDespawnRadius(this._gameArena)
      );
      return;
    }

    this.removeMe = helpers.detectAreaExit(
      { posX: this._data.size / 2, posY: this._data.size / 2 },
      { posX: this._data.posX, posY: this._data.posY },
      getDespawnRadius(this._gameArena)
    );
  };

  reposition = (): void => {
    if (this._data.explosionTick !== false) {
      return;
    }

    if (this._data.tracksPlayer && this._data.turnRate) {
      const desiredHeading = helpers.findHeading(
        this._data,
        this._player.getData()
      );

      this._data.heading = helpers.rotateTo(
        desiredHeading,
        this._data.heading,
        this._data.turnRate
      );
    }

    const { heading, velocity } = this._data;

    this._data.posX += helpers.float(
      Math.sin(heading * (Math.PI / 180)) * velocity
    );
    this._data.posY -= helpers.float(
      Math.cos(heading * (Math.PI / 180)) * velocity
    );

    this._checkInArena();
    this.updateSpatialSoundPosition(this._flightSound);
  };

  private updateSpatialSoundPosition = (sound?: SoundEngine): void => {
    if (!sound) {
      return;
    }

    const player = this._player.getData();
    const relativeX =
      this._data.coordinateSpace === "world"
        ? this._data.posX - player.posX
        : this._data.posX;
    const relativeY =
      this._data.coordinateSpace === "world"
        ? this._data.posY - player.posY
        : this._data.posY;

    sound.setSpatialPosition(
      relativeX,
      relativeY,
      this._gameArena.width / 2,
      this._gameArena.height / 2
    );
  };

  private playExplosionSound = (): void => {
    const sound = this._data.explosionSound;

    if (!sound) {
      return;
    }

    const explosionSound = new SoundEngine(sound.src, {
      instantDestroy: true,
    });

    this.updateSpatialSoundPosition(explosionSound);
    explosionSound.play();
  };

  render = (): void => {
    const { color, size } = this._data;
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const posX =
      this._data.coordinateSpace === "world"
        ? this._data.posX - this._player.getData().posX
        : this._data.posX;
    const posY =
      this._data.coordinateSpace === "world"
        ? this._data.posY - this._player.getData().posY
        : this._data.posY;

    context.fillStyle = color;

    if (this._data.explosionTick !== false) {
      this._renderExplosion(posX, posY);
      return;
    }

    if (
      this._data.shape === "sprite" &&
      this._data.sprite &&
      this._projectileSprite
    ) {
      const renderWidth = this._data.sprite.renderWidth ?? this._data.sprite.width;
      const renderHeight =
        this._data.sprite.renderHeight ?? this._data.sprite.height;
      const frameX = this._getSpriteFrameX();
      const frameAxis = this._data.sprite.frameAxis ?? "x";

      this._gameArena.renderSprite(this._projectileSprite, {
        frameWidth: this._data.sprite.width,
        frameHeight: this._data.sprite.height,
        frameX: frameAxis === "x" ? frameX : 0,
        frameY: frameAxis === "y" ? frameX : 0,
        posX: posX - renderWidth / 2,
        posY: posY - renderHeight / 2,
        renderHeight,
        renderWidth,
      });
    } else if (this._data.shape === "circle") {
      context.beginPath();
      context.arc(posX, posY, size / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(posX - size / 2, posY - size / 2, size, size);
    }

    if (userOptions.enableDebug && userOptions.debug.showHitboxes) {
      this._gameArena.drawCircle(
        posX,
        posY,
        this._data.size,
        {
          borderColor: palette.debug.playerHitbox,
        }
      );
    }

    if (userOptions.enableDebug && userOptions.debug.showHeadingVectors) {
      drawDebugVectors(
        context,
        posX,
        posY,
        this._data.heading,
        this._data.heading,
        {
          fillTurnArc: userOptions.debug.showSteeringArc,
          length: Math.max(14, this._data.size * 2),
        }
      );
    }
  };

  private _renderExplosion = (posX: number, posY: number): void => {
    if (
      !this._data.explosion ||
      !this._explosionSprite ||
      this._data.explosionTick === false
    ) {
      this.removeMe = true;
      return;
    }

    const explosionTick = this._data.explosionTick;
    const frameX = Math.floor(
      (this._gameTicker.getTicks() - explosionTick) /
        this._data.explosion.frameLimiter
    );

    if (frameX >= this._data.explosion.frames) {
      this.removeMe = true;
      this.destroy();
      return;
    }

    const renderWidth =
      this._data.explosion.renderWidth ?? this._data.explosion.width;
    const renderHeight =
      this._data.explosion.renderHeight ?? this._data.explosion.height;

    this._gameArena.renderSprite(this._explosionSprite, {
      frameWidth: this._data.explosion.width,
      frameHeight: this._data.explosion.height,
      frameX,
      frameY: 0,
      posX: posX - renderWidth / 2,
      posY: posY - renderHeight / 2,
      renderHeight,
      renderWidth,
    });
  };

  private _getSpriteFrameX = (): number => {
    const frames = this._data.sprite?.frames;

    if (!frames) {
      return 0;
    }

    if (this._data.sprite?.frameMode === "animation") {
      return Math.floor(performance.now() / 120) % frames;
    }

    const heading = ((this._data.heading % 360) + 360) % 360;

    return Math.round(((heading + 270) % 360) / (360 / frames)) % frames;
  };

  destroy = (): void => {
    this._launchSound?.destroy();
    this._launchSound = undefined;
    this.stopFlightSound();
  };

  private stopFlightSound = (): void => {
    this._flightSound?.destroy();
    this._flightSound = undefined;
  };
}

export default Bullet;
