/* Converted from TimePilot.Enemy.js (AMD) to ESM TypeScript. */
import { levels, scoring } from "./constants";
import userOptions from "./user-options";
import { drawDebugVectors } from "./debug-vectors";
import { helpers, Sound as SoundEngine } from "arcade-engine";
import palette from "./palette";
import { getDespawnRadius } from "./viewport";
import type {
  BulletData,
  EnemyConfig,
  EnemyData,
  EnemyInstance,
  EnemySpawnOptions,
  GameArenaInstance,
  GameDataStore,
  Heading,
  PlayerData,
  PlayerInstance,
  TickerInstance,
} from "./types";

const playerAvoidanceRadius = 96;
const playerAvoidanceStrength = 1.55;
const projectileAvoidanceRadius = 72;
const projectileAvoidanceLookAhead = 120;
const projectileAvoidanceStrength = 1.9;
const attackPassOffset = 52;
const attackPassStrength = 0.72;
const slowEnemyTrailingDistance = 90;

/**
 * Enemy aircraft entity with steering, attack behaviour, damage, and rendering.
 */
class Enemy implements EnemyInstance {
  private _context: GameDataStore;
  private _data: EnemyData;
  private _ambientSound?: SoundEngine;
  private _enemySprite: HTMLImageElement;
  private _gameArena: GameArenaInstance;
  private _gameTicker: TickerInstance;
  private _player: PlayerInstance;
  private _steeringHeading: Heading;

  isAlive = true;
  removeMe = false;

  constructor(
    context: GameDataStore,
    posX: number,
    posY: number,
    heading: Heading,
    options: EnemySpawnOptions = {}
  ) {
    this._context = context;
    this._gameArena = context._gameArena;
    this._player = context._player;
    this._gameTicker = context._gameTicker;

    this._data = {
      posX,
      posY,
      heading,
      hitPoints: 1,
      level: context._level || 1,
      deathTick: false,
      tickOffset: Math.floor(Math.random() * 100),
      type: "basic",
      ...options,
    };
    this._data.hitPoints = this.getLevelData().hitPoints;
    this._steeringHeading = this._data.heading;

    this._enemySprite = new Image();
    this._enemySprite.src = this.getLevelData().sprite.src;

    const ambientSound = this.getLevelData("ambientSound");

    if (this._data.type === "boss" && ambientSound) {
      this._ambientSound = new SoundEngine(ambientSound.src);
      this._ambientSound.loop();
      this.updateAmbientSoundPosition();
    }
  }

  getData(): EnemyData;
  getData<K extends keyof EnemyData>(key: K): EnemyData[K] | undefined;
  getData<K extends keyof EnemyData>(key?: K) {
    if (!key) {
      return this._data;
    }

    if (Object.prototype.hasOwnProperty.call(this._data, key)) {
      return this._data[key];
    }

    return undefined;
  }

  setData = <K extends keyof EnemyData>(key: K, value: EnemyData[K]): boolean => {
    if (this._data[key] !== undefined) {
      this._data[key] = value;
      return this._data[key] === value;
    }

    return false;
  };

  getLevelData(): EnemyConfig;
  getLevelData<K extends keyof EnemyConfig>(key: K): EnemyConfig[K] | undefined;
  getLevelData<K extends keyof EnemyConfig>(key?: K) {
    const enemyType = this._data.type ?? "basic";
    const levelEnemies = levels[this._data.level].enemies;
    const levelData = levelEnemies[enemyType] ?? levelEnemies.basic;

    if (!key) {
      return levelData;
    }

    if (Object.prototype.hasOwnProperty.call(levelData, key)) {
      return levelData[key];
    }

    return undefined;
  }

  detectCollision = (objectPosX: number, objectPosY: number, objectHitRadius: number): boolean => {
    const levelData = this.getLevelData();

    return helpers.detectCollision(
      {
        posX: objectPosX,
        posY: objectPosY,
        radius: objectHitRadius,
      },
      {
        posX: this._data.posX,
        posY: this._data.posY,
        radius: levelData.hitRadius,
      }
    );
  };

  private _checkInArena = (): void => {
    const levelData = this.getLevelData();

    if (this.removeMe) {
      return;
    }

    if (this._data.type === "boss") {
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
    const enemy = this._data;
    const { heading } = this._data;
    const levelData = this.getLevelData();
    const player = this._player.getData();
    const tick = this._gameTicker.getTicks() - this._data.tickOffset;
    const formationActive =
      this._data.formationUntilTick !== undefined &&
      this._gameTicker.getTicks() < this._data.formationUntilTick;
    const canTurn =
      levelData.tracksPlayer &&
      !formationActive &&
      !this.removeMe &&
      tick % levelData.turnLimiter === 0;

    enemy.posX += helpers.float(
      Math.sin(heading * (Math.PI / 180)) * levelData.velocity
    );
    enemy.posY -= helpers.float(
      Math.cos(heading * (Math.PI / 180)) * levelData.velocity
    );

    if (formationActive) {
      this._applyFormationWave(tick);
    }

    this._checkInArena();

    this._steeringHeading = this._getSteeringHeading(levelData, formationActive);

    if (canTurn) {
      enemy.heading = helpers.rotateTo(
        this._steeringHeading,
        enemy.heading,
        22.5
      );
    }

    this.updateAmbientSoundPosition();
  };

  private updateAmbientSoundPosition = (): void => {
    if (!this._ambientSound) {
      return;
    }

    const relativeX = this._data.posX - this._player.getData().posX;
    const relativeY = this._data.posY - this._player.getData().posY;

    this._ambientSound.setSpatialPosition(
      relativeX,
      relativeY,
      this._gameArena.width / 2,
      this._gameArena.height / 2
    );
  };

  private _getSteeringHeading = (
    levelData: EnemyConfig,
    formationActive: boolean
  ): Heading => {
    if (!levelData.tracksPlayer || formationActive || this.removeMe) {
      return this._data.heading;
    }

    const player = this._player.getData();
    const desiredVector = this._getIntentionalSteeringVector(levelData);
    const turnTo =
      Math.abs(desiredVector.x) < 0.001 && Math.abs(desiredVector.y) < 0.001
        ? helpers.findHeading(this._data, {
          posX: player.posX + levelData.width / 2,
          posY: player.posY + levelData.height / 2,
        })
        : this._headingFromVector(desiredVector.x, desiredVector.y);

    return Math.floor(turnTo / 22.5) * 22.5;
  };

  private _getIntentionalSteeringVector = (
    levelData: EnemyConfig
  ): { x: number; y: number } => {
    const playerData = this._player.getData();
    const playerVector = this._getPlayerAvoidanceVector(levelData, playerData);
    const bulletVector = this._getProjectileAvoidanceVector();
    const slowEnemyBias = this._getSlowEnemyBias(levelData);
    const pursuitTarget = this._getPursuitTarget(levelData, slowEnemyBias);
    const targetVector = this._normalizeVector({
      x: pursuitTarget.posX - this._data.posX,
      y: pursuitTarget.posY - this._data.posY,
    });
    const passVector = this._getAttackPassVector(targetVector, playerVector);

    return {
      x:
        targetVector.x +
        passVector.x * attackPassStrength * (1 - slowEnemyBias) +
        playerVector.x * playerAvoidanceStrength +
        bulletVector.x * projectileAvoidanceStrength,
      y:
        targetVector.y +
        passVector.y * attackPassStrength * (1 - slowEnemyBias) +
        playerVector.y * playerAvoidanceStrength +
        bulletVector.y * projectileAvoidanceStrength,
    };
  };

  private _getPursuitTarget = (
    levelData: EnemyConfig,
    slowEnemyBias: number
  ): { posX: number; posY: number } => {
    const playerData = this._player.getData();

    if (slowEnemyBias <= 0) {
      return {
        posX: playerData.posX,
        posY: playerData.posY,
      };
    }

    const playerDirection = this._vectorFromHeading(playerData.heading);
    const trailingDistance = slowEnemyTrailingDistance + levelData.hitRadius;

    return {
      posX:
        playerData.posX - playerDirection.x * trailingDistance * slowEnemyBias,
      posY:
        playerData.posY - playerDirection.y * trailingDistance * slowEnemyBias,
    };
  };

  private _getSlowEnemyBias = (levelData: EnemyConfig): number => {
    const playerVelocity = levels[this._data.level].player.velocity;

    if (playerVelocity <= 0 || levelData.velocity >= playerVelocity) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(1, (playerVelocity - levelData.velocity) / playerVelocity)
    );
  };

  private _getPlayerAvoidanceVector = (
    levelData: EnemyConfig,
    playerData: PlayerData
  ): { x: number; y: number } => {
    const offset = {
      x: this._data.posX - playerData.posX,
      y: this._data.posY - playerData.posY,
    };
    const distance = Math.hypot(offset.x, offset.y);
    const avoidDistance = playerAvoidanceRadius + levelData.hitRadius;

    if (distance >= avoidDistance || distance <= 0.001) {
      return { x: 0, y: 0 };
    }

    const strength = 1 - distance / avoidDistance;
    const away = this._normalizeVector(offset);

    return {
      x: away.x * strength,
      y: away.y * strength,
    };
  };

  private _getAttackPassVector = (
    targetVector: { x: number; y: number },
    playerAvoidanceVector: { x: number; y: number }
  ): { x: number; y: number } => {
    const playerData = this._player.getData();
    const distanceToPlayer = Math.hypot(
      playerData.posX - this._data.posX,
      playerData.posY - this._data.posY
    );

    if (distanceToPlayer > playerAvoidanceRadius + attackPassOffset) {
      return { x: 0, y: 0 };
    }

    const side =
      this._crossProduct(targetVector, playerAvoidanceVector) >= 0 ? 1 : -1;

    return {
      x: -targetVector.y * side,
      y: targetVector.x * side,
    };
  };

  private _getProjectileAvoidanceVector = (): { x: number; y: number } => {
    const enemy = this._data;
    let avoidX = 0;
    let avoidY = 0;

    this._context._bullets.getEntities().forEach((bullet) => {
      if (bullet.removeMe) {
        return;
      }

      const bulletData = bullet.getData() as BulletData;

      if (bulletData.explosionTick !== false) {
        return;
      }

      const bulletPosition = {
        posX: bulletData.posX + this._player.getData().posX,
        posY: bulletData.posY + this._player.getData().posY,
      };
      const toEnemy = {
        x: enemy.posX - bulletPosition.posX,
        y: enemy.posY - bulletPosition.posY,
      };
      const bulletDirection = this._vectorFromHeading(bulletData.heading);
      const alongPath = this._dotProduct(toEnemy, bulletDirection);

      if (alongPath < -16 || alongPath > projectileAvoidanceLookAhead) {
        return;
      }

      const closestPoint = {
        x: bulletPosition.posX + bulletDirection.x * alongPath,
        y: bulletPosition.posY + bulletDirection.y * alongPath,
      };
      const fromPath = {
        x: enemy.posX - closestPoint.x,
        y: enemy.posY - closestPoint.y,
      };
      const pathDistance = Math.hypot(fromPath.x, fromPath.y);

      if (pathDistance > projectileAvoidanceRadius) {
        return;
      }

      const perpendicular =
        pathDistance <= 0.001
          ? { x: -bulletDirection.y, y: bulletDirection.x }
          : this._normalizeVector(fromPath);
      const strength = 1 - pathDistance / projectileAvoidanceRadius;

      avoidX += perpendicular.x * strength;
      avoidY += perpendicular.y * strength;
    });

    return this._normalizeVector({ x: avoidX, y: avoidY });
  };

  private _headingFromVector = (x: number, y: number): Heading => {
    return helpers.findHeading({ posX: 0, posY: 0 }, { posX: x, posY: y });
  };

  private _vectorFromHeading = (heading: Heading): { x: number; y: number } => {
    const radians = heading * (Math.PI / 180);

    return {
      x: Math.sin(radians),
      y: -Math.cos(radians),
    };
  };

  private _normalizeVector = (vector: { x: number; y: number }): { x: number; y: number } => {
    const length = Math.hypot(vector.x, vector.y);

    if (length <= 0.001) {
      return { x: 0, y: 0 };
    }

    return {
      x: vector.x / length,
      y: vector.y / length,
    };
  };

  private _dotProduct = (
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number => a.x * b.x + a.y * b.y;

  private _crossProduct = (
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number => a.x * b.y - a.y * b.x;

  private _applyFormationWave = (tick: number): void => {
    const amplitude = this._data.formationWaveAmplitude ?? 0;
    const frequency = this._data.formationWaveFrequency ?? 0;

    if (!amplitude || !frequency) {
      return;
    }

    const phase = this._data.formationWavePhase ?? 0;
    const currentWave = Math.sin(tick * frequency + phase) * amplitude;
    const previousWave = Math.sin((tick - 1) * frequency + phase) * amplitude;
    const waveDelta = currentWave - previousWave;
    const perpendicularHeading = (this._data.heading + 90) % 360;

    this._data.posX += helpers.float(
      Math.sin(perpendicularHeading * (Math.PI / 180)) * waveDelta
    );
    this._data.posY -= helpers.float(
      Math.cos(perpendicularHeading * (Math.PI / 180)) * waveDelta
    );
  };

  private _render = (): void => {
    const levelData = this.getLevelData();
    const renderWidth = levelData.renderWidth ?? levelData.width;
    const renderHeight = levelData.renderHeight ?? levelData.height;
    const frameX = this._getFrameX(levelData);

    this._gameArena.renderSprite(this._enemySprite, {
      frameWidth: levelData.width,
      frameHeight: levelData.height,
      frameX,
      frameY: this._getFrameY(levelData),
      posX: this._data.posX - this._player.getData().posX - renderWidth / 2,
      posY:
        this._data.posY - this._player.getData().posY - renderHeight / 2,
      renderHeight,
      renderWidth,
    });
  };

  private _getFrameY = (levelData: EnemyConfig): number => {
    if (levelData.animationRows) {
      return (
        Math.floor(this._gameTicker.getTicks() / 10) %
        levelData.animationRows
      );
    }

    if (!levelData.canRotate) {
      return 0;
    }

    return 0;
  };

  private _getFrameX = (levelData: EnemyConfig): number => {
    if (levelData.damageFrames) {
      return this._getHorizontalDamageFrame(levelData);
    }

    if (levelData.bossDamageFrames) {
      return this._getBossDamageFrame(levelData);
    }

    if (levelData.horizontalDirectionFrames) {
      const leftRightPosition =
        (1 - Math.sin(this._data.heading * (Math.PI / 180))) / 2;

      return Math.round(
        leftRightPosition * (levelData.horizontalDirectionFrames - 1)
      );
    }

    if (levelData.canRotate) {
      const heading =
        (this._data.heading + (levelData.headingFrameOffset ?? 0) + 360) %
        360;

      return Math.floor(heading / 22.5);
    }

    return (
      Math.floor(this._gameTicker.getTicks() / 10) %
      (levelData.animationFrames ?? 8)
    );
  };

  private _getBossDamageFrame = (levelData: EnemyConfig): number => {
    const damageFrames = levelData.bossDamageFrames ?? 4;
    const maxHitPoints = levelData.hitPoints;
    const hitsTaken = maxHitPoints - this._data.hitPoints;
    const damageFrame = Math.min(
      damageFrames - 1,
      Math.floor((hitsTaken / maxHitPoints) * damageFrames)
    );
    const isFacingLeft = this._data.heading > 180;

    return damageFrame + (isFacingLeft ? damageFrames : 0);
  };

  private _getHorizontalDamageFrame = (levelData: EnemyConfig): number => {
    const damageFrames = levelData.damageFrames ?? 4;
    const maxHitPoints = levelData.hitPoints;
    const hitsTaken = maxHitPoints - this._data.hitPoints;
    const damageFrame = Math.min(
      damageFrames - 1,
      Math.floor((hitsTaken / maxHitPoints) * damageFrames)
    );
    const isFacingLeft = this._data.heading > 180;

    return damageFrame + (isFacingLeft ? levelData.leftFacingFrameOffset ?? damageFrames : 0);
  };

  private _renderDeath = (): void => {
    if (this._data.deathTick === false) {
      return;
    }

    const explosionData = this.getLevelData().explosion;
    const levelData = this.getLevelData();
    const elapsedTicks = this._gameTicker.getTicks() - this._data.deathTick;
    const flashTicks = levelData.deathFlashTicks ?? 0;

    if (levelData.deathFlashFrameY !== undefined && elapsedTicks < flashTicks) {
      const renderWidth = levelData.renderWidth ?? levelData.width;
      const renderHeight = levelData.renderHeight ?? levelData.height;

      this._gameArena.renderSprite(this._enemySprite, {
        frameWidth: levelData.width,
        frameHeight: levelData.height,
        frameX: this._getFrameX(levelData),
        frameY: levelData.deathFlashFrameY,
        posX: this._data.posX - this._player.getData().posX - renderWidth / 2,
        posY:
          this._data.posY - this._player.getData().posY - renderHeight / 2,
        renderHeight,
        renderWidth,
      });
      return;
    }

    const frameX = Math.floor(
      (elapsedTicks - flashTicks) / explosionData.frameLimiter
    );

    this._enemySprite.src = explosionData.sprite.src;

    this._gameArena.renderSprite(this._enemySprite, {
      frameWidth: explosionData.width,
      frameHeight: explosionData.height,
      frameX,
      frameY: 0,
      posX:
        this._data.posX - this._player.getData().posX - explosionData.width / 2,
      posY:
        this._data.posY -
        this._player.getData().posY -
        explosionData.height / 2,
    });

    if (frameX === explosionData.frames) {
      this.removeMe = true;
    }
  };

  render = (): void => {
    const levelData = this.getLevelData();

    if (!this._data.deathTick) {
      this._render();
    } else {
      this._renderDeath();
    }

    if (userOptions.enableDebug && userOptions.debug.showHitboxes) {
      this._gameArena.drawCircle(
        this._data.posX - this._player.getData().posX,
        this._data.posY - this._player.getData().posY,
        levelData.hitRadius,
        {
          borderColor: palette.debug.enemyHitbox,
        }
      );
    }

    if (
      userOptions.enableDebug &&
      userOptions.debug.showHeadingVectors &&
      !this._data.deathTick
    ) {
      const context = this._gameArena.getContext() as CanvasRenderingContext2D;

      drawDebugVectors(
        context,
        this._data.posX - this._player.getData().posX,
        this._data.posY - this._player.getData().posY,
        this._data.heading,
        this._steeringHeading,
        {
          fillTurnArc: userOptions.debug.showSteeringArc,
        }
      );
    }
  };

  kill = (): void => {
    if (!this.isAlive) {
      return;
    }

    this._data.hitPoints = Math.max(0, this._data.hitPoints - 1);

    if (this._data.hitPoints > 0) {
      return;
    }

    this.isAlive = false;
    this.stopAmbientSound();
    this.playExplosionSound();
    this._data.deathTick = this._gameTicker.getTicks();
    this._player.setData(
      "score",
      this._player.getData("score") + this.getLevelData("deathValue")!
    );
    if (!this._context._isDemoMode) {
      this._context._runStats.enemiesDestroyed += 1;

      if (this._data.type === "boss") {
        this._context._runStats.bossesDefeated += 1;
      }
    }
    this._trackBossKillProgress();
    this._trackBossDefeat();
    this._trackFormationKill();
  };

  destroy = (): void => {
    this.stopAmbientSound();
  };

  private stopAmbientSound = (): void => {
    this._ambientSound?.destroy();
    this._ambientSound = undefined;
  };

  private playExplosionSound = (): void => {
    const sound = this.getLevelData("explosion")?.sound;

    if (!sound) {
      return;
    }

    const explosionSound = new SoundEngine(sound.src, {
      instantDestroy: true,
    });

    explosionSound.setSpatialPosition(
      this._data.posX - this._player.getData().posX,
      this._data.posY - this._player.getData().posY,
      this._gameArena.width / 2,
      this._gameArena.height / 2
    );
    explosionSound.play();
  };

  private _trackBossKillProgress = (): void => {
    if (!this.getLevelData("countsTowardBoss")) {
      return;
    }

    const progress = this._context._levelProgress;

    if (progress.bossSpawned) {
      return;
    }

    progress.standardEnemyKills += 1;
  };

  private _trackBossDefeat = (): void => {
    if (this._data.type !== "boss") {
      return;
    }

    this._context._levelProgress.bossDefeated = true;
  };

  private _trackFormationKill = (): void => {
    const formationId = this._data.formationId;

    if (!formationId) {
      return;
    }

    const formation = this._context._formations[formationId];

    if (!formation || formation.awarded || formation.escaped) {
      return;
    }

    formation.remaining = Math.max(0, formation.remaining - 1);

    if (formation.remaining > 0) {
      return;
    }

    formation.awarded = true;
    this._context._achievements?.onWaveCompleted(formationId);
    this._player.setData(
      "score",
      this._player.getData("score") + scoring.formationBonus
    );
  };
}

export default Enemy;
