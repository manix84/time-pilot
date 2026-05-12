/* Converted from TimePilot.Menu.js (AMD) to ESM TypeScript. */
import userOptions from "./user-options";
import type {
  ControllerType,
  GameArenaInstance,
  KeyboardBindings,
  MenuPointerData,
  MenuSystemCommands,
  MenuSystemInstance,
} from "./types";

type MenuScreen = "start" | "options" | "debug";
type MenuItemKind = "action" | "enum" | "slider" | "key" | "toggle";
type ToggleDebugOption =
  | "invincible"
  | "showControlsOverlay"
  | "showHitboxes"
  | "showPlayerCoordinates";
type BindingAction = keyof KeyboardBindings;

interface MenuItem {
  action?: () => void;
  binding?: BindingAction;
  disabled?: boolean;
  getValue?: () => string;
  kind: MenuItemKind;
  label: string;
  onAdjust?: (direction: -1 | 1) => void;
  rect: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
}

const controllerTypes: ControllerType[] = ["keyboard1", "keyboard2"];
const keyBindingRows: Array<{ binding: BindingAction; label: string }> = [
  { binding: "up", label: "Key Up" },
  { binding: "down", label: "Key Down" },
  { binding: "left", label: "Key Left" },
  { binding: "right", label: "Key Right" },
  { binding: "fire", label: "Key Fire" },
];
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
const debugUnlockedStorageKey = "timePilot.debugUnlocked";

class Menus implements MenuSystemInstance {
  private _active = false;
  private _awaitingBinding: BindingAction | null = null;
  private _commands: MenuSystemCommands;
  private _debugUnlocked = false;
  private _gameArena: GameArenaInstance;
  private _items: MenuItem[] = [];
  private _konamiIndex = 0;
  private _logoCanvas?: HTMLCanvasElement;
  private readonly _logoHeight = 96;
  private readonly _logoWidth = 420;
  private _screen: MenuScreen = "start";
  private _screenHistory: MenuScreen[] = [];
  private _selectedIndex = 0;

  constructor(gameArena: GameArenaInstance, commands: MenuSystemCommands) {
    this._gameArena = gameArena;
    this._commands = commands;
    this._debugUnlocked = sessionStorage.getItem(debugUnlockedStorageKey) === "true";
  }

  isActive(): boolean {
    return this._active;
  }

  showStart(): void {
    this._active = true;
    this._awaitingBinding = null;
    this._screen = "start";
    this._screenHistory = [];
    this._selectedIndex = 0;
    this._buildItems();
  }

  hide(): void {
    this._active = false;
    this._awaitingBinding = null;
  }

  next(): void {
    if (!this._active || !this._items.length) {
      return;
    }

    this._selectedIndex = (this._selectedIndex + 1) % this._items.length;
  }

  previous(): void {
    if (!this._active || !this._items.length) {
      return;
    }

    this._selectedIndex =
      (this._selectedIndex - 1 + this._items.length) % this._items.length;
  }

  adjust(direction: -1 | 1): void {
    if (!this._active) {
      return;
    }

    this._items[this._selectedIndex]?.onAdjust?.(direction);
  }

  activate(): void {
    if (!this._active) {
      return;
    }

    const item = this._items[this._selectedIndex];

    if (!item || item.disabled) {
      return;
    }

    if (item.kind === "key" && item.binding) {
      this._awaitingBinding = item.binding;
      return;
    }

    if (item.kind === "toggle") {
      item.onAdjust?.(1);
      return;
    }

    item.action?.();
  }

  captureKey(keyCode: number): boolean {
    if (!this._active) {
      return false;
    }

    if (!this._awaitingBinding) {
      this._captureKonamiKey(keyCode);
      return false;
    }

    userOptions.keyboardBindings[this._awaitingBinding] = [keyCode];
    this._awaitingBinding = null;
    return true;
  }

  handlePointer(pointer: MenuPointerData): void {
    if (!this._active) {
      return;
    }

    const itemIndex = this._items.findIndex((item) =>
      this._isInsideItem(pointer, item)
    );

    if (itemIndex === -1) {
      return;
    }

    this._selectedIndex = itemIndex;

    if (pointer.type === "click") {
      this.activate();
    }
  }

  render(): void {
    if (!this._active) {
      return;
    }

    const context = this._gameArena.getContext() as CanvasRenderingContext2D;

    context.fillStyle = "rgba(4, 10, 18, 0.82)";
    context.fillRect(
      -(this._gameArena.width / 2),
      -(this._gameArena.height / 2),
      this._gameArena.width,
      this._gameArena.height
    );

    this._renderLogo(context);
    this._gameArena.renderText(this._getScreenTitle(), 0, -82, {
      size: 18,
      align: "center",
      valign: "middle",
      color: "#C7D5EB",
    });

    this._items.forEach((item, index) => {
      this._renderItem(item, index === this._selectedIndex);
    });

    if (this._awaitingBinding) {
      this._gameArena.renderText("Press a key", 0, 136, {
        size: 16,
        align: "center",
        valign: "middle",
        color: "#7EDBD3",
      });
    }
  }

  private _renderLogo(context: CanvasRenderingContext2D): void {
    const logoCanvas = this._getLogoCanvas();

    context.save();
    context.translate(0, -126);
    this._drawPerspectiveLogo(
      context,
      logoCanvas,
      this._logoWidth,
      this._logoHeight
    );
    context.restore();
  }

  private _getLogoCanvas(): HTMLCanvasElement {
    if (this._logoCanvas) {
      return this._logoCanvas;
    }

    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = this._logoWidth;
    logoCanvas.height = this._logoHeight;

    const logoContext = logoCanvas.getContext("2d");
    if (logoContext) {
      this._drawLogoText(logoContext, this._logoWidth, this._logoHeight);
    }

    this._logoCanvas = logoCanvas;
    return logoCanvas;
  }

  private _drawLogoText(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const text = "TIME PILOT";
    const textX = width / 2;
    const textY = height / 2 + 3;

    context.font = "900 52px 'Bookman Old Style', Georgia, serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    const layers = [
      { x: 9, y: 9, color: "#3F0700" },
      { x: 7, y: 7, color: "#7A1200" },
      { x: 5, y: 5, color: "#A72A00" },
      { x: 3, y: 3, color: "#C94F00" },
      { x: 2, y: 2, color: "#FF8C00" },
      { x: 1, y: 1, color: "#FFAA00" },
    ];

    for (const layer of layers) {
      context.fillStyle = layer.color;
      context.fillText(text, textX + layer.x, textY + layer.y);
    }

    context.fillStyle = "#FFD400";
    context.fillText(text, textX, textY);
  }

  private _drawPerspectiveLogo(
    context: CanvasRenderingContext2D,
    logoCanvas: HTMLCanvasElement,
    logoWidth: number,
    logoHeight: number
  ): void {
    const topWidth = 260;
    const bottomWidth = 390;
    const targetHeight = 86;
    const sliceHeight = 2;

    for (let sourceY = 0; sourceY < logoHeight; sourceY += sliceHeight) {
      const progress = sourceY / (logoHeight - sliceHeight);
      const targetWidth = topWidth + (bottomWidth - topWidth) * progress;
      const targetY = -targetHeight / 2 + (sourceY / logoHeight) * targetHeight;
      const targetSliceHeight = Math.ceil((sliceHeight / logoHeight) * targetHeight);

      context.drawImage(
        logoCanvas,
        0,
        sourceY,
        logoWidth,
        sliceHeight,
        -targetWidth / 2,
        targetY,
        targetWidth,
        targetSliceHeight
      );
    }
  }

  private _buildItems(): void {
    if (this._screen === "start") {
      this._items = this._createStartItems();
    } else if (this._screen === "options") {
      this._items = this._createOptionsItems();
    } else {
      this._items = this._createDebugItems();
    }
  }

  private _createStartItems(): MenuItem[] {
    const items = [
      this._createItem("Start", "action", -22, {
        action: this._commands.start,
      }),
      this._createItem("Options", "action", 28, {
        action: () => this._goToScreen("options"),
      }),
    ];

    if (this._debugUnlocked) {
      items.push(
        this._createItem("Debug", "action", 78, {
          action: () => this._goToScreen("debug"),
        })
      );
    }

    return items;
  }

  private _createOptionsItems(): MenuItem[] {
    const items = [
      this._createItem("Master Volume", "slider", -54, {
        getValue: () => `${userOptions.masterVolume}`,
        onAdjust: (direction) => this._adjustVolume("masterVolume", direction),
      }),
      this._createItem("Music Volume", "slider", -12, {
        getValue: () => `${userOptions.musicVolume}`,
        onAdjust: (direction) => this._adjustVolume("musicVolume", direction),
      }),
      this._createItem("Effects Volume", "slider", 30, {
        getValue: () => `${userOptions.effectsVolume}`,
        onAdjust: (direction) => this._adjustVolume("effectsVolume", direction),
      }),
      this._createItem("Control Type", "enum", 72, {
        getValue: () =>
          userOptions.controllerType === "keyboard1" ? "Directional" : "Rotate",
        onAdjust: (direction) => this._adjustControllerType(direction),
      }),
    ];

    keyBindingRows.forEach((row, index) => {
      items.push(
        this._createItem(row.label, "key", 114 + index * 34, {
          binding: row.binding,
          getValue: () => this._formatKey(userOptions.keyboardBindings[row.binding][0]),
        })
      );
    });

    items.push(
      this._createItem("Back", "action", 288, {
        action: () => this._goBack(),
      })
    );

    return items;
  }

  private _createDebugItems(): MenuItem[] {
    return [
      this._createToggleItem("Invincibility Shield", "invincible", -54),
      this._createToggleItem("Show Hit Boxes", "showHitboxes", -12),
      this._createToggleItem("Show Controls Overlay", "showControlsOverlay", 30),
      this._createToggleItem("Show Coordinates", "showPlayerCoordinates", 72),
      this._createItem("Select Level", "enum", 114, {
        disabled: true,
        getValue: () => "Soon",
      }),
      this._createItem("Back", "action", 164, {
        action: () => this._goBack(),
      }),
    ];
  }

  private _createToggleItem(
    label: string,
    option: ToggleDebugOption,
    y: number
  ): MenuItem {
    return this._createItem(label, "toggle", y, {
      getValue: () => (userOptions.debug[option] ? "On" : "Off"),
      onAdjust: () => {
        userOptions.debug[option] = !userOptions.debug[option];
      },
    });
  }

  private _createItem(
    label: string,
    kind: MenuItemKind,
    y: number,
    options: Partial<MenuItem> = {}
  ): MenuItem {
    return {
      label,
      kind,
      rect: {
        x: -150,
        y,
        width: 300,
        height: kind === "key" ? 28 : 36,
      },
      ...options,
    };
  }

  private _renderItem(item: MenuItem, isSelected: boolean): void {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const isAwaiting = item.binding === this._awaitingBinding;
    const progress = this._getItemProgress(item);
    const progressWidth = progress === null ? 0 : item.rect.width * progress;

    context.fillStyle = item.disabled ? "#152033" : isSelected ? "#F2B84B" : "#0B1727";
    context.fillRect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);

    if (progress !== null) {
      context.fillStyle = isSelected ? "#0B1727" : "#F2B84B";
      context.fillRect(item.rect.x, item.rect.y, progressWidth, item.rect.height);
    }

    context.strokeStyle = item.disabled
      ? "#334158"
      : isAwaiting
        ? "#7EDBD3"
        : isSelected
          ? "#FFF1B8"
          : "#466485";
    context.lineWidth = 2;
    context.strokeRect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);

    this._renderItemText(
      item,
      item.disabled ? "#718099" : isSelected ? "#111927" : "#E9F3FF"
    );

    if (progress !== null && progressWidth > 0) {
      context.save();
      context.beginPath();
      context.rect(item.rect.x, item.rect.y, progressWidth, item.rect.height);
      context.clip();
      this._renderItemText(item, isSelected ? "#E9F3FF" : "#111927");
      context.restore();
    }
  }

  private _renderItemText(item: MenuItem, color: string): void {
    this._gameArena.renderText(
      item.label,
      item.rect.x + 14,
      item.rect.y + item.rect.height / 2,
      {
        size: item.kind === "key" ? 13 : 16,
        align: "left",
        valign: "middle",
        color,
      }
    );

    if (item.getValue) {
      this._gameArena.renderText(
        item.getValue(),
        item.rect.x + item.rect.width - 14,
        item.rect.y + item.rect.height / 2,
        {
          size: item.kind === "key" ? 13 : 16,
          align: "right",
          valign: "middle",
          color,
        }
      );
    }
  }

  private _getItemProgress(item: MenuItem): number | null {
    if (item.kind !== "slider" || !item.getValue) {
      return null;
    }

    const value = Number(item.getValue());
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.max(0, Math.min(1, value / 10));
  }

  private _captureKonamiKey(keyCode: number): void {
    if (this._screen !== "start" || this._debugUnlocked) {
      return;
    }

    if (keyCode === konamiCode[this._konamiIndex]) {
      this._konamiIndex++;
    } else {
      this._konamiIndex = keyCode === konamiCode[0] ? 1 : 0;
    }

    if (this._konamiIndex === konamiCode.length) {
      this._debugUnlocked = true;
      userOptions.enableDebug = true;
      sessionStorage.setItem(debugUnlockedStorageKey, "true");
      this._konamiIndex = 0;
      this._buildItems();
    }
  }

  private _getScreenTitle(): string {
    if (this._screen === "options") {
      return "Options";
    }

    if (this._screen === "debug") {
      return "Debug";
    }

    return "A.D. 1910";
  }

  private _goToScreen(screen: MenuScreen): void {
    this._screenHistory.push(this._screen);
    this._screen = screen;
    this._selectedIndex = 0;
    this._awaitingBinding = null;
    this._buildItems();
  }

  private _goBack(): void {
    this._screen = this._screenHistory.pop() ?? "start";
    this._selectedIndex = 0;
    this._awaitingBinding = null;
    this._buildItems();
  }

  private _adjustControllerType(direction: -1 | 1): void {
    const currentIndex = controllerTypes.indexOf(userOptions.controllerType);
    const nextIndex =
      (currentIndex + direction + controllerTypes.length) % controllerTypes.length;

    userOptions.setOption("controllerType", controllerTypes[nextIndex]);
  }

  private _adjustVolume(
    key: "masterVolume" | "musicVolume" | "effectsVolume",
    direction: -1 | 1
  ): void {
    userOptions.setOption(
      key,
      Math.max(0, Math.min(10, userOptions[key] + direction))
    );
  }

  private _formatKey(keyCode: number): string {
    if (keyCode === 32) {
      return "Space";
    }

    if (keyCode >= 65 && keyCode <= 90) {
      return String.fromCharCode(keyCode);
    }

    const namedKeys: Record<number, string> = {
      37: "Left",
      38: "Up",
      39: "Right",
      40: "Down",
    };

    return namedKeys[keyCode] ?? `${keyCode}`;
  }

  private _isInsideItem(pointer: MenuPointerData, item: MenuItem): boolean {
    return (
      pointer.posX >= item.rect.x &&
      pointer.posX <= item.rect.x + item.rect.width &&
      pointer.posY >= item.rect.y &&
      pointer.posY <= item.rect.y + item.rect.height
    );
  }
}

export default Menus;
