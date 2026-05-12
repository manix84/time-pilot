/* Converted from TimePilot.Bonus.js (AMD) to ESM TypeScript. */
import { levels, scoring } from "./constants";
import helpers from "./engine/helpers";
import palette from "./palette";
import userOptions from "./user-options";
import { getDespawnRadius } from "./viewport";
import type {
  BonusInstance,
  BonusConfig,
  BonusData,
  GameArenaInstance,
  GameDataStore,
  PlayerInstance,
  TickerInstance,
} from "./types";

const collectedScorePopupDurationTicks = 60;

class Bonus implements BonusInstance {
  private _bonusSprite: HTMLImageElement;
  private _canvas: GameArenaInstance;
  private _collectedScore: number | false = false;
  private _collectedTick: number | false = false;
  private _context: GameDataStore;
  private _data: BonusData;
  private _gameTicker: TickerInstance;
  private _player: PlayerInstance;

  removeMe = false;

  constructor(
    context: GameDataStore,
    posX: number,
    posY: number,
    type: BonusData["type"] = "parachute"
  ) {
    this._context = context;
    this._canvas = context._gameArena;
    this._player = context._player;
    this._gameTicker = context._gameTicker;

    this._data = {
      posX,
      posY,
      level: context._level || 1,
      layer: 1,
      removeMe: false,
      type,
    };

    this._bonusSprite = new Image();
    this._bonusSprite.src = this.getLevelData().sprite.src;
  }

  getData(): BonusData;
  getData<K extends keyof BonusData>(key: K): BonusData[K] | undefined;
  getData<K extends keyof BonusData>(key?: K) {
    if (!key) {
      return this._data;
    }

    if (Object.prototype.hasOwnProperty.call(this._data, key)) {
      return this._data[key];
    }

    return undefined;
  }

  private getLevelData(): BonusConfig {
    return levels[this._data.level].bonus;
  }

  private _checkInArena(): void {
    if (this.removeMe) {
      return;
    }

    this.removeMe = helpers.detectAreaExit(
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
    this._data.removeMe = this.removeMe;
  }

  detectCollision(
    objectPosX: number,
    objectPosY: number,
    objectHitRadius: number
  ): boolean {
    if (this._collectedScore !== false) {
      return false;
    }

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

  collect(): void {
    if (this.removeMe) {
      return;
    }

    const parachuteScoring = scoring.parachute;
    const value = this._context._nextParachuteScore ?? parachuteScoring.min;

    this._player.setData("score", this._player.getData("score") + value);
    this._context._nextParachuteScore = Math.min(
      value + parachuteScoring.step,
      parachuteScoring.max
    );
    this._collectedScore = value;
    this._collectedTick = this._gameTicker.getTicks();
  }

  reposition(): void {
    if (this._collectedScore !== false) {
      this._checkCollectedPopupDuration();
      return;
    }

    const levelData = this.getLevelData();

    this._data.posY += levelData.velocity;

    this._checkInArena();
  }

  render(): void {
    if (this._collectedScore !== false) {
      this._renderCollectedScore();
      return;
    }

    const levelData = this.getLevelData();
    const frameIndex =
      Math.floor(this._gameTicker.getTicks() / 8) %
      levelData.animationCycle.length;
    const frameX = levelData.animationCycle[frameIndex] - 1;

    this._canvas.renderSprite(this._bonusSprite, {
      frameWidth: levelData.width,
      frameHeight: levelData.height,
      frameX,
      frameY: 0,
      posX: this._data.posX - this._player.getData().posX - levelData.width / 2,
      posY:
        this._data.posY - this._player.getData().posY - levelData.height / 2,
    });

    if (userOptions.enableDebug && userOptions.debug.showHitboxes) {
      this._canvas.drawCircle(
        this._data.posX - this._player.getData().posX,
        this._data.posY - this._player.getData().posY,
        levelData.hitRadius,
        {
          borderColor: palette.debug.bonusHitbox,
        }
      );
    }
  }

  private _checkCollectedPopupDuration(): void {
    if (
      this._collectedTick === false ||
      this._gameTicker.getTicks() - this._collectedTick <
        collectedScorePopupDurationTicks
    ) {
      return;
    }

    this.removeMe = true;
    this._data.removeMe = true;
  }

  private _renderCollectedScore(): void {
    this._checkCollectedPopupDuration();

    if (this.removeMe || this._collectedScore === false) {
      return;
    }

    this._canvas.renderText(
      this._collectedScore,
      this._data.posX - this._player.getData().posX,
      this._data.posY - this._player.getData().posY,
      {
        align: "center",
        color: palette.text.white,
        size: 20,
        valign: "middle",
      }
    );
  }
}

export default Bonus;
