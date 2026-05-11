/* Converted from TimePilot.Menu.js (AMD) to ESM TypeScript. */
import type {
  GameArenaInstance,
  MenuPointerData,
  MenuSystemCommands,
  MenuSystemInstance,
} from "./types";

interface MenuButton {
  action: () => void;
  label: string;
  rect: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
}

class Menus implements MenuSystemInstance {
  private _active = false;
  private _buttons: MenuButton[] = [];
  private _commands: MenuSystemCommands;
  private _gameArena: GameArenaInstance;
  private _selectedIndex = 0;

  constructor(gameArena: GameArenaInstance, commands: MenuSystemCommands) {
    this._gameArena = gameArena;
    this._commands = commands;
  }

  isActive(): boolean {
    return this._active;
  }

  showStart(): void {
    this._active = true;
    this._selectedIndex = 0;
    this._buttons = [
      {
        label: "Start",
        action: this._commands.start,
        rect: {
          x: -110,
          y: 42,
          width: 220,
          height: 42,
        },
      },
    ];
  }

  hide(): void {
    this._active = false;
  }

  next(): void {
    if (!this._active || !this._buttons.length) {
      return;
    }

    this._selectedIndex = (this._selectedIndex + 1) % this._buttons.length;
  }

  previous(): void {
    if (!this._active || !this._buttons.length) {
      return;
    }

    this._selectedIndex =
      (this._selectedIndex - 1 + this._buttons.length) % this._buttons.length;
  }

  activate(): void {
    if (!this._active) {
      return;
    }

    this._buttons[this._selectedIndex]?.action();
  }

  handlePointer(pointer: MenuPointerData): void {
    if (!this._active) {
      return;
    }

    const buttonIndex = this._buttons.findIndex((button) =>
      this._isInsideButton(pointer, button)
    );

    if (buttonIndex === -1) {
      return;
    }

    this._selectedIndex = buttonIndex;

    if (pointer.type === "click") {
      this.activate();
    }
  }

  render(): void {
    if (!this._active) {
      return;
    }

    const context = this._gameArena.getContext() as CanvasRenderingContext2D;

    context.fillStyle = "rgba(4, 10, 18, 0.78)";
    context.fillRect(
      -(this._gameArena.width / 2),
      -(this._gameArena.height / 2),
      this._gameArena.width,
      this._gameArena.height
    );

    this._gameArena.renderText("Time Pilot", 0, -96, {
      size: 38,
      align: "center",
      valign: "middle",
      color: "#F2B84B",
    });
    this._gameArena.renderText("A.D. 1910", 0, -54, {
      size: 18,
      align: "center",
      valign: "middle",
      color: "#C7D5EB",
    });

    this._buttons.forEach((button, index) => {
      this._renderButton(button, index === this._selectedIndex);
    });
  }

  private _renderButton(button: MenuButton, isSelected: boolean): void {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;

    context.fillStyle = isSelected ? "#F2B84B" : "#0B1727";
    context.fillRect(
      button.rect.x,
      button.rect.y,
      button.rect.width,
      button.rect.height
    );
    context.strokeStyle = isSelected ? "#FFF1B8" : "#466485";
    context.lineWidth = 2;
    context.strokeRect(
      button.rect.x,
      button.rect.y,
      button.rect.width,
      button.rect.height
    );

    this._gameArena.renderText(
      button.label,
      button.rect.x + button.rect.width / 2,
      button.rect.y + button.rect.height / 2,
      {
        size: 18,
        align: "center",
        valign: "middle",
        color: isSelected ? "#111927" : "#E9F3FF",
      }
    );
  }

  private _isInsideButton(pointer: MenuPointerData, button: MenuButton): boolean {
    return (
      pointer.posX >= button.rect.x &&
      pointer.posX <= button.rect.x + button.rect.width &&
      pointer.posY >= button.rect.y &&
      pointer.posY <= button.rect.y + button.rect.height
    );
  }
}

export default Menus;
