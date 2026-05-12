/* Converted from TimePilot.ControllerInterface.js (AMD) to ESM TypeScript. */
import { player } from "./constants";
import type {
  ControllerCommands,
  ControllerInterfaceInstance,
  GameArenaInstance,
  GameDataStore,
  Heading,
  HudInstance,
  MenuPointerData,
  MenuSystemInstance,
  PlayerInstance,
  TickerInstance,
} from "./types";

class ControllerInterface implements ControllerInterfaceInstance {
  private _commands: Required<ControllerCommands>;
  private _gameArena: GameArenaInstance;
  private _gameTicker: TickerInstance;
  private _hud: HudInstance;
  private _menus: MenuSystemInstance;
  private _player: PlayerInstance;
  private _rotationStep: number;

  constructor(context: GameDataStore, commands: ControllerCommands) {
    this._player = context._player;
    this._gameTicker = context._gameTicker;
    this._hud = context._hud;
    this._gameArena = context._gameArena;
    this._menus = context._menus;

    this._commands = {
      openMenu:
        commands.openMenu ||
        (() => {
          if (!this._menus.isActive()) {
            if (this._gameTicker.isRunning) {
              this._commands.pause();
            }

            this._menus.showStart({ startLabel: "Continue" });
          }
        }),
      restart: commands.restart || (() => {}),
      pause: commands.pause || (() => {}),
    };

    this._rotationStep = 360 / player.rotationFrameCount;
  }

  rotateToHeading(desiredHeading: Heading): void {
    if (this._menus.isActive()) {
      if (desiredHeading === 0) {
        this._menus.previous();
      } else if (desiredHeading === 180) {
        this._menus.next();
      } else if (desiredHeading === 270) {
        this._menus.adjust(-1);
      } else {
        this._menus.adjust(1);
      }
      return;
    }

    this._player.setData("newHeading", this._quantizeHeading(desiredHeading));
  }

  rotateClockwise(): void {
    if (this._menus.isActive()) {
      this._menus.adjust(1);
      return;
    }

    const currentHeading = this._player.getData().heading;
    const desiredHeading = (currentHeading + this._rotationStep) % 360;

    this._player.setData("newHeading", this._quantizeHeading(desiredHeading));
  }

  rotateAntiClockwise(): void {
    if (this._menus.isActive()) {
      this._menus.adjust(-1);
      return;
    }

    const currentHeading = this._player.getData().heading;
    let desiredHeading = currentHeading - this._rotationStep;

    desiredHeading = desiredHeading < 0 ? 360 + desiredHeading : desiredHeading;

    this._player.setData("newHeading", this._quantizeHeading(desiredHeading));
  }

  stop(): void {
    this._player.setData("newHeading", false);
  }

  toggleMenu(): void {
    if (this._menus.isActive()) {
      this._menus.hide();
    } else {
      this._menus.showStart();
    }
  }

  openMenu(): void {
    this._commands.openMenu();
  }

  startShooting(): void {
    if (this._menus.isActive()) {
      this._menus.activate();
      return;
    }

    this._player.startShooting();
  }

  stopShooting(): void {
    this._player.stopShooting();
  }

  toggleFullScreen(): void {
    this._gameArena.toggleFullScreen();
  }

  togglePause(): void {
    if (this._menus.isActive()) {
      this._menus.activate();
      return;
    }

    this._commands.pause();
  }

  restart(): void {
    if (this._menus.isActive()) {
      this._menus.activate();
      return;
    }

    this._commands.restart();
  }

  rotateCounterClockwise(): void {
    this.rotateAntiClockwise();
  }

  rotateRight(): void {
    this.rotateClockwise();
  }

  rotateLeft(): void {
    this.rotateAntiClockwise();
  }

  handlePointer(pointer: MenuPointerData): void {
    this._menus.handlePointer(pointer);
  }

  captureKey(keyCode: number): boolean {
    return this._menus.captureKey(keyCode);
  }

  isMenuActive(): boolean {
    return this._menus.isActive();
  }

  private _quantizeHeading(heading: Heading): Heading {
    const quantized =
      Math.round(heading / this._rotationStep) * this._rotationStep;

    return (quantized + 360) % 360;
  }
}

export default ControllerInterface;
