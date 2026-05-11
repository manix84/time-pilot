/* Converted from TimePilot.ControllerInterface.js (AMD) to ESM TypeScript. */
import CONSTS from "./constants";
import type {
  ControllerCommands,
  ControllerInterfaceInstance,
  GameArenaInstance,
  GameDataStore,
  Heading,
  HudInstance,
  PlayerInstance,
  TickerInstance,
} from "./types";

class ControllerInterface implements ControllerInterfaceInstance {
  private _commands: Required<ControllerCommands>;
  private _gameArena: GameArenaInstance;
  private _gameTicker: TickerInstance;
  private _hud: HudInstance;
  private _player: PlayerInstance;
  private _rotationStep: number;

  constructor(context: GameDataStore, commands: ControllerCommands) {
    this._player = context._player;
    this._gameTicker = context._gameTicker;
    this._hud = context._hud;
    this._gameArena = context._gameArena;

    this._commands = {
      restart: commands.restart || (() => {}),
      pause: commands.pause || (() => {}),
    };

    this._rotationStep = 360 / CONSTS.player.rotationFrameCount;
  }

  rotateToHeading(desiredHeading: Heading): void {
    this._player.setData(
      "newHeading",
      Math.floor(desiredHeading / 22.5) * 22.5
    );
  }

  rotateClockwise(): void {
    const currentHeading = this._player.getData().heading;
    const desiredHeading = (currentHeading + this._rotationStep) % 360;

    this._player.setData(
      "newHeading",
      Math.floor(desiredHeading / 22.5) * 22.5
    );
  }

  rotateAntiClockwise(): void {
    const currentHeading = this._player.getData().heading;
    let desiredHeading = currentHeading - this._rotationStep;

    desiredHeading = desiredHeading < 0 ? 360 + desiredHeading : desiredHeading;

    this._player.setData(
      "newHeading",
      Math.floor(desiredHeading / 22.5) * 22.5
    );
  }

  stop(): void {
    this._player.setData("newHeading", false);
  }

  toggleMenu(): void {
    window.console.log("Opening Menu");
  }

  openMenu(): void {
    this.toggleMenu();
  }

  startShooting(): void {
    this._player.startShooting();
  }

  stopShooting(): void {
    this._player.stopShooting();
  }

  toggleFullScreen(): void {
    this._gameArena.toggleFullScreen();
  }

  togglePause(): void {
    this._commands.pause();
  }

  restart(): void {
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
}

export default ControllerInterface;
