/* Converted from TimePilot.Hud.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import userOptions from "./user-options";
import type {
  ControlInputState,
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

    if (userOptions.enableDebug && userOptions.debug.showControlsOverlay) {
      this.renderControlsOverlay();
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

  private renderControlsOverlay(): void {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const inputState = this._context._controlInputState;
    const y = this._gameArena.height / 2 - 102;

    context.save();
    context.globalAlpha = 0.9;
    this.renderKeyboardOverlay(context, -210, y, inputState);
    this.renderGamepadOverlay(context, 120, y + 14, inputState);
    context.restore();
  }

  private renderKeyboardOverlay(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    inputState: ControlInputState
  ): void {
    this.renderKey(context, "W", x + 44, y, 34, 28, inputState.up);
    this.renderKey(context, "A", x, y + 32, 34, 28, inputState.left);
    this.renderKey(context, "S", x + 44, y + 32, 34, 28, inputState.down);
    this.renderKey(context, "D", x + 88, y + 32, 34, 28, inputState.right);
    this.renderKey(context, "Space", x, y + 68, 122, 28, inputState.fire);
  }

  private renderKey(
    context: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    isPressed: boolean
  ): void {
    context.globalAlpha = isPressed ? 0.92 : 0.5;
    context.fillStyle = isPressed ? "rgba(255, 212, 0, 0.22)" : "transparent";
    context.strokeStyle = isPressed ? "#FFD400" : "#C7D5EB";
    context.lineWidth = 2;
    context.fillRect(x, y, width, height);
    context.strokeRect(x, y, width, height);

    context.globalAlpha = isPressed ? 1 : 0.6;
    this._gameArena.renderText(label, x + width / 2, y + height / 2, {
      size: 12,
      align: "center",
      valign: "middle",
      color: isPressed ? "#FFD400" : "#C7D5EB",
    });
  }

  private renderGamepadOverlay(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    inputState: ControlInputState
  ): void {
    context.globalAlpha = 0.5;
    context.strokeStyle = "#C7D5EB";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x + 32, y + 20);
    context.lineTo(x + 78, y + 8);
    context.lineTo(x + 134, y + 8);
    context.lineTo(x + 180, y + 20);
    context.lineTo(x + 196, y + 64);
    context.lineTo(x + 174, y + 90);
    context.lineTo(x + 136, y + 70);
    context.lineTo(x + 76, y + 70);
    context.lineTo(x + 38, y + 90);
    context.lineTo(x + 16, y + 64);
    context.closePath();
    context.stroke();

    this.renderStick(context, x + 70, y + 48, inputState);
    this.renderButton(context, "A", x + 148, y + 52, inputState.fire);
    this.renderButton(context, "Menu", x + 106, y + 38, inputState.menu);
    this.renderButton(context, "P", x + 122, y + 38, inputState.pause);
  }

  private renderStick(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    inputState: ControlInputState
  ): void {
    const isPressed =
      inputState.up || inputState.right || inputState.down || inputState.left;
    const offsetX = inputState.left ? -5 : inputState.right ? 5 : 0;
    const offsetY = inputState.up ? -5 : inputState.down ? 5 : 0;

    context.globalAlpha = 0.5;
    context.strokeStyle = "#C7D5EB";
    context.beginPath();
    context.arc(x, y, 16, 0, 2 * Math.PI);
    context.stroke();

    context.globalAlpha = isPressed ? 0.95 : 0.55;
    context.fillStyle = isPressed ? "#FFD400" : "transparent";
    context.strokeStyle = isPressed ? "#FFD400" : "#C7D5EB";
    context.beginPath();
    context.arc(x + offsetX, y + offsetY, 9, 0, 2 * Math.PI);
    context.fill();
    context.stroke();
  }

  private renderButton(
    context: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    isPressed: boolean
  ): void {
    const radius = label.length > 1 ? 9 : 12;

    context.globalAlpha = isPressed ? 0.95 : 0.5;
    context.fillStyle = isPressed ? "rgba(255, 212, 0, 0.24)" : "transparent";
    context.strokeStyle = isPressed ? "#FFD400" : "#C7D5EB";
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fill();
    context.stroke();

    context.globalAlpha = isPressed ? 1 : 0.65;
    this._gameArena.renderText(label, x, y, {
      size: label.length > 1 ? 7 : 10,
      align: "center",
      valign: "middle",
      color: isPressed ? "#FFD400" : "#C7D5EB",
    });
  }
}

export default Hud;
