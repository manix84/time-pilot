/* Converted from TimePilot.Hud.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import userOptions from "./user-options";
import type {
  GameArenaInstance,
  GameDataStore,
  HudInstance,
  PlayerData,
  SpriteImage,
} from "./types";

class Hud implements HudInstance {
  private _context: GameDataStore;
  private _gameArena: GameArenaInstance;
  private _playerData: PlayerData;
  private _playerSprite: SpriteImage;

  constructor(context: GameDataStore) {
    this._context = context;
    this._gameArena = context._gameArena;
    this._playerData = context._player.getData();

    this._playerSprite = new Image() as SpriteImage;
    this._playerSprite.src = CONSTS.player.sprite.src;
    this._playerSprite.frameWidth = CONSTS.player.width;
    this._playerSprite.frameHeight = CONSTS.player.height;
    this._playerSprite.frameX = 0;
    this._playerSprite.frameY = 0;
  }

  render(): void {
    this._gameArena.renderText(
      this._playerData.score,
      -(this._gameArena.width / 2) + 20,
      -(this._gameArena.height / 2) + 10,
      { size: 30 }
    );

    if (userOptions.enableDebug && userOptions.debug.showPlayerCoordinates) {
      this._gameArena.renderText(
        `${this._playerData.posX.toFixed(2)} x ${this._playerData.posY.toFixed(2)}`,
        -(this._gameArena.width / 2) + 20,
        -(this._gameArena.height / 2) + 40,
        { size: 15 }
      );
      this._gameArena.renderText(
        `${this._playerData.heading}°`,
        -(this._gameArena.width / 2) + 20,
        -(this._gameArena.height / 2) + 55,
        { size: 15 }
      );
    }

    if (!this._playerData.isAlive) {
      this._gameArena.renderText("Game Over", 0, 0, {
        size: 30,
        align: "center",
        valign: "middle",
        color: "#FFF",
      });
      this._gameArena.renderText('Press "R" to reset', 0, 30, {
        size: 20,
        align: "center",
        valign: "middle",
        color: "#FFF",
      });
    }

    if (!this._context._gameTicker.isRunning) {
      this._gameArena.renderText("Paused", 0, 25, {
        size: 25,
        align: "center",
        valign: "middle",
        color: "#FFF",
      });
      this._gameArena.renderText('Press "P" to continue', 0, 45, {
        size: 20,
        align: "center",
        valign: "middle",
        color: "#FFF",
      });
    }

    for (let i = 0; i < this._playerData.lives; ++i) {
      this._gameArena.renderSprite(this._playerSprite, {
        frameWidth: this._playerSprite.frameWidth ?? CONSTS.player.width,
        frameHeight: this._playerSprite.frameHeight ?? CONSTS.player.height,
        frameX: this._playerSprite.frameX ?? 0,
        frameY: this._playerSprite.frameY ?? 0,
        posX:
          this._gameArena.width / 2 -
          CONSTS.player.width -
          (CONSTS.player.width + 10) * i -
          10,
        posY: -(this._gameArena.height / 2 - 10),
      });
    }
  }

  restart(): void {
    this._gameArena.renderText("Restarting", 0, 0, {
      size: 30,
      align: "center",
      valign: "middle",
      color: "#FFF",
    });
  }
}

export default Hud;
