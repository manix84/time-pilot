/* Converted from TimePilot.Enemy.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import userOptions from "./user-options";
import helpers from "./engine/helpers";
import palette from "./palette";
import { getDespawnRadius } from "./viewport";
import type {
  EnemyConfig,
  EnemyData,
  EnemyInstance,
  EnemySpawnOptions,
  GameArenaInstance,
  GameDataStore,
  Heading,
  PlayerInstance,
  TickerInstance,
} from "./types";

class Enemy implements EnemyInstance {
  private _context: GameDataStore;
  private _data: EnemyData;
  private _enemySprite: HTMLImageElement;
  private _gameArena: GameArenaInstance;
  private _gameTicker: TickerInstance;
  private _player: PlayerInstance;

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
      level: context._level || 1,
      deathTick: false,
      tickOffset: Math.floor(Math.random() * 100),
      ...options,
    };

    this._enemySprite = new Image();
    this._enemySprite.src = this.getLevelData().sprite.src;
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

  setData<K extends keyof EnemyData>(key: K, value: EnemyData[K]): boolean {
    if (this._data[key] !== undefined) {
      this._data[key] = value;
      return this._data[key] === value;
    }

    return false;
  }

  getLevelData(): EnemyConfig;
  getLevelData<K extends keyof EnemyConfig>(key: K): EnemyConfig[K] | undefined;
  getLevelData<K extends keyof EnemyConfig>(key?: K) {
    const levelData = CONSTS.levels[this._data.level].enemies.basic;

    if (!key) {
      return levelData;
    }

    if (Object.prototype.hasOwnProperty.call(levelData, key)) {
      return levelData[key];
    }

    return undefined;
  }

  detectCollision(
    objectPosX: number,
    objectPosY: number,
    objectHitRadius: number
  ): boolean {
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
  }

  private _checkInArena(): void {
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
  }

  reposition(): void {
    const enemy = this._data;
    const { heading } = this._data;
    const levelData = this.getLevelData();
    const player = this._player.getData();
    const tick = this._gameTicker.getTicks() - this._data.tickOffset;
    const formationActive =
      this._data.formationUntilTick !== undefined &&
      this._gameTicker.getTicks() < this._data.formationUntilTick;
    const canTurn =
      !formationActive && !this.removeMe && tick % levelData.turnLimiter === 0;

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

    if (canTurn) {
      let turnTo = helpers.findHeading(this._data, {
        posX: player.posX + levelData.width / 2,
        posY: player.posY + levelData.height / 2,
      });
      turnTo = Math.floor(turnTo / 22.5) * 22.5;

      enemy.heading = helpers.rotateTo(turnTo, enemy.heading, 22.5);
    }
  }

  private _applyFormationWave(tick: number): void {
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
  }

  private _render(): void {
    const levelData = this.getLevelData();

    this._gameArena.renderSprite(this._enemySprite, {
      frameWidth: levelData.width,
      frameHeight: levelData.height,
      frameX: Math.floor(this._data.heading / 22.5),
      frameY: Math.floor(this._gameTicker.getTicks() / 10) % 2,
      posX: this._data.posX - this._player.getData().posX - levelData.width / 2,
      posY:
        this._data.posY - this._player.getData().posY - levelData.height / 2,
    });
  }

  private _renderDeath(): void {
    if (this._data.deathTick === false) {
      return;
    }

    const explosionData = this.getLevelData().explosion;
    const frameX = Math.floor(
      (this._gameTicker.getTicks() - this._data.deathTick) /
        explosionData.frameLimiter
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
  }

  render(): void {
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
  }

  kill(): void {
    if (!this.isAlive) {
      return;
    }

    this.isAlive = false;
    this._data.deathTick = this._gameTicker.getTicks();
    this._player.setData(
      "score",
      this._player.getData("score") + this.getLevelData("deathValue")!
    );
    this._trackFormationKill();
  }

  private _trackFormationKill(): void {
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
    this._player.setData(
      "score",
      this._player.getData("score") + CONSTS.scoring.formationBonus
    );
  }
}

export default Enemy;
