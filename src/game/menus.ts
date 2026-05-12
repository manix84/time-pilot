/* Converted from TimePilot.Menu.js (AMD) to ESM TypeScript. */
import palette from "./palette";
import userOptions from "./user-options";
import type {
  ControllerType,
  GameArenaInstance,
  KeyboardBindings,
  MenuPointerData,
  MenuSystemCommands,
  MenuSystemInstance,
  ShowStartMenuOptions,
} from "./types";

type MenuScreen = "start" | "options" | "controls" | "debug";
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
  onSetValue?: (value: number) => void;
  rect: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
}

interface MenuViewport {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface MenuTransition {
  from: MenuScreen;
  startedAt: number;
  to: MenuScreen;
}

const controllerTypes: ControllerType[] = ["keyboard1", "keyboard2"];
const menuEdgePadding = 24;
const menuDesignHeight = 500;
const menuDesignWidth = 438;
const submenuItemOffsetY = 22;
const menuTransitionDuration = 500;
const keyBindingRows: Array<{ binding: BindingAction; label: string }> = [
  { binding: "up", label: "Up" },
  { binding: "left", label: "Left" },
  { binding: "down", label: "Down" },
  { binding: "right", label: "Right" },
  { binding: "fire", label: "Fire" },
];
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

class Menus implements MenuSystemInstance {
  private _active = false;
  private _awaitingBinding: BindingAction | null = null;
  private _bindingWarning = "";
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
  private _pressedItemIndex: number | null = null;
  private _selectedIndex = 0;
  private _sliderDragIndex: number | null = null;
  private _startLabel = "Start";
  private _scrollY = 0;
  private _transition: MenuTransition | null = null;

  constructor(gameArena: GameArenaInstance, commands: MenuSystemCommands) {
    this._gameArena = gameArena;
    this._commands = commands;
    this._debugUnlocked = userOptions.enableDebug;
  }

  isActive(): boolean {
    return this._active;
  }

  showStart(options: ShowStartMenuOptions = {}): void {
    this._active = true;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._startLabel = options.startLabel ?? "Start";
    this._screen = "start";
    this._screenHistory = [];
    this._pressedItemIndex = null;
    this._selectedIndex = 0;
    this._scrollY = 0;
    this._transition = null;
    this._buildItems();
  }

  hide(): void {
    this._active = false;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._sliderDragIndex = null;
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
      this._bindingWarning = "";
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

    const duplicateBinding = this._getDuplicateBinding(keyCode);

    if (duplicateBinding && duplicateBinding !== this._awaitingBinding) {
      this._bindingWarning = `Already assigned to ${this._formatBindingLabel(
        duplicateBinding
      )}`;
      return true;
    }

    userOptions.setKeyboardBinding(this._awaitingBinding, [keyCode]);
    this._awaitingBinding = null;
    this._bindingWarning = "";
    return true;
  }

  handlePointer(pointer: MenuPointerData): void {
    if (!this._active) {
      return;
    }

    const menuPointer = this._getScaledPointer(pointer);

    if (pointer.type === "release") {
      const releasedItemIndex = this._items.findIndex((item) =>
        this._isInsideItem(menuPointer, item)
      );
      const pressedItemIndex = this._pressedItemIndex;

      this._sliderDragIndex = null;
      this._pressedItemIndex = null;

      if (
        pressedItemIndex !== null &&
        releasedItemIndex === pressedItemIndex &&
        this._items[pressedItemIndex].kind !== "slider"
      ) {
        this._selectedIndex = pressedItemIndex;
        this.activate();
      }

      return;
    }

    if (pointer.type === "drag" && this._sliderDragIndex !== null) {
      this._setSliderFromPointer(
        this._items[this._sliderDragIndex],
        menuPointer
      );
      return;
    }

    const itemIndex = this._items.findIndex((item) =>
      this._isInsideItem(menuPointer, item)
    );

    if (itemIndex === -1) {
      return;
    }

    this._selectedIndex = itemIndex;

    if (pointer.type === "press") {
      this._pressedItemIndex = itemIndex;

      if (this._items[itemIndex].kind === "slider") {
        this._sliderDragIndex = itemIndex;
        this._setSliderFromPointer(this._items[itemIndex], menuPointer);
      }

      return;
    }

    if (pointer.type === "click") {
      if (this._items[itemIndex].kind === "slider") {
        this._setSliderFromPointer(this._items[itemIndex], menuPointer);
        return;
      }

      this.activate();
    }
  }

  render(): void {
    if (!this._active) {
      return;
    }

    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const menuScale = this._getMenuScale();

    context.fillStyle = palette.menu.backplate;
    context.fillRect(
      -(this._gameArena.width / 2),
      -(this._gameArena.height / 2),
      this._gameArena.width,
      this._gameArena.height
    );

    const transition = this._getTransitionState();
    const layout = this._getAnimatedLayout(transition);

    context.save();
    context.scale(menuScale, menuScale);
    this._renderLogo(context, layout.logoY);
    this._gameArena.renderText(this._getScreenTitle(), 0, layout.titleY, {
      size: 18,
      align: "center",
      valign: "middle",
      color: palette.menu.mutedText,
    });

    this._scrollY = this._getMenuScrollY();
    this._renderItems(context, transition.progress);

    if (this._awaitingBinding) {
      this._renderBindingWarning(context);
      this._gameArena.renderText("Press a key", 0, 136, {
        size: 16,
        align: "center",
        valign: "middle",
        color: palette.menu.waitingText,
      });
    }
    context.restore();
  }

  private _renderLogo(context: CanvasRenderingContext2D, y: number): void {
    const logoCanvas = this._getLogoCanvas();

    context.save();
    context.translate(0, y);
    this._drawPerspectiveLogo(
      context,
      logoCanvas,
      this._logoWidth,
      this._logoHeight
    );
    context.restore();
  }

  private _renderItems(
    context: CanvasRenderingContext2D,
    transitionProgress: number
  ): void {
    const viewport = this._getMenuViewport();
    const transitionOffset = (1 - transitionProgress) * this._getItemTransitionOffset();
    const screenOffset = this._getScreenItemOffset(this._screen);

    context.save();
    context.beginPath();
    context.rect(viewport.x, viewport.y, viewport.width, viewport.height);
    context.clip();
    context.globalAlpha *= 0.35 + transitionProgress * 0.65;
    context.translate(0, this._scrollY + transitionOffset + screenOffset);

    this._items.forEach((item, index) => {
      this._renderItem(item, index === this._selectedIndex);
    });

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
      { x: 9, y: 9, color: palette.title.shadowDeep },
      { x: 7, y: 7, color: palette.title.shadowDark },
      { x: 5, y: 5, color: palette.title.shadowMid },
      { x: 3, y: 3, color: palette.title.shadowOrange },
      { x: 2, y: 2, color: palette.title.shadowLight },
      { x: 1, y: 1, color: palette.title.shadowGold },
    ];

    for (const layer of layers) {
      context.fillStyle = layer.color;
      context.fillText(text, textX + layer.x, textY + layer.y);
    }

    context.fillStyle = palette.title.face;
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
    } else if (this._screen === "controls") {
      this._items = this._createControlsItems();
    } else {
      this._items = this._createDebugItems();
    }
  }

  private _createStartItems(): MenuItem[] {
    const items = [
      this._createItem(this._startLabel, "action", -22, {
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
        onSetValue: (value) => this._setVolume("masterVolume", value),
      }),
      this._createItem("Music Volume", "slider", -12, {
        getValue: () => `${userOptions.musicVolume}`,
        onAdjust: (direction) => this._adjustVolume("musicVolume", direction),
        onSetValue: (value) => this._setVolume("musicVolume", value),
      }),
      this._createItem("Effects Volume", "slider", 30, {
        getValue: () => `${userOptions.effectsVolume}`,
        onAdjust: (direction) => this._adjustVolume("effectsVolume", direction),
        onSetValue: (value) => this._setVolume("effectsVolume", value),
      }),
      this._createItem("Control Type", "enum", 72, {
        getValue: () =>
          userOptions.controllerType === "keyboard1" ? "Directional" : "Rotate",
        onAdjust: (direction) => this._adjustControllerType(direction),
      }),
      this._createItem("Remap Controls", "action", 114, {
        action: () => this._goToScreen("controls"),
      }),
    ];

    items.push(
      this._createItem("Back", "action", 164, {
        action: () => this._goBack(),
      })
    );

    return items;
  }

  private _createControlsItems(): MenuItem[] {
    return [
      this._createKeyBindingItem("up", -43, -54, 86, 34),
      this._createKeyBindingItem("left", -146, -12, 86, 34),
      this._createKeyBindingItem("down", -43, -12, 86, 34),
      this._createKeyBindingItem("right", 60, -12, 86, 34),
      this._createKeyBindingItem("fire", -146, 30, 292, 34),
      this._createItem("Back", "action", 92, {
        action: () => this._goBack(),
      }),
    ];
  }

  private _createKeyBindingItem(
    binding: BindingAction,
    x: number,
    y: number,
    width: number,
    height: number
  ): MenuItem {
    const row = keyBindingRows.find((item) => item.binding === binding);

    return this._createItem(row?.label ?? binding, "key", y, {
      binding,
      getValue: () => this._formatKey(userOptions.keyboardBindings[binding][0]),
      rect: {
        x,
        y,
        width,
        height,
      },
    });
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
        userOptions.setDebugOption(option, !userOptions.debug[option]);
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

    context.fillStyle = item.disabled
      ? palette.menu.disabledBackground
      : isSelected
        ? palette.menu.selectedBackground
        : palette.menu.itemBackground;
    context.fillRect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);

    if (progress !== null) {
      context.fillStyle = isSelected
        ? palette.menu.itemBackground
        : palette.menu.progressFill;
      context.fillRect(item.rect.x, item.rect.y, progressWidth, item.rect.height);
    }

    context.strokeStyle = item.disabled
      ? palette.menu.disabledBorder
      : isAwaiting
        ? palette.menu.waitingBorder
        : isSelected
          ? palette.menu.selectedBorder
          : palette.menu.itemBorder;
    context.lineWidth = 2;
    context.strokeRect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);

    this._renderItemText(
      item,
      item.disabled
        ? palette.menu.disabledText
        : isSelected
          ? palette.menu.selectedText
          : palette.menu.itemText
    );

    if (progress !== null && progressWidth > 0) {
      context.save();
      context.beginPath();
      context.rect(item.rect.x, item.rect.y, progressWidth, item.rect.height);
      context.clip();
      this._renderItemText(
        item,
        isSelected ? palette.menu.itemText : palette.menu.selectedText
      );
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

  private _renderBindingWarning(context: CanvasRenderingContext2D): void {
    if (!this._bindingWarning) {
      return;
    }

    context.fillStyle = palette.menu.backplate;
    context.fillRect(-154, 154, 308, 36);
    context.strokeStyle = palette.menu.waitingBorder;
    context.lineWidth = 2;
    context.strokeRect(-154, 154, 308, 36);

    this._gameArena.renderText(this._bindingWarning, 0, 172, {
      size: 14,
      align: "center",
      valign: "middle",
      color: palette.menu.waitingText,
    });
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

  private _setSliderFromPointer(item: MenuItem, pointer: MenuPointerData): void {
    if (!item.onSetValue) {
      return;
    }

    const progress = Math.max(
      0,
      Math.min(1, (pointer.posX - item.rect.x) / item.rect.width)
    );

    item.onSetValue(Math.round(progress * 10));
  }

  private _getMenuViewport(): MenuViewport {
    const scale = this._getMenuScale();
    const logicalWidth = this._gameArena.width / scale;
    const logicalHeight = this._gameArena.height / scale;
    const logicalPadding = menuEdgePadding / scale;

    return {
      x: -(logicalWidth / 2) + logicalPadding,
      y: -(logicalHeight / 2) + logicalPadding,
      width: logicalWidth - logicalPadding * 2,
      height: logicalHeight - logicalPadding * 2,
    };
  }

  private _getMenuScale(): number {
    const availableWidth = Math.max(1, this._gameArena.width - menuEdgePadding * 2);
    const availableHeight = Math.max(
      1,
      this._gameArena.height - menuEdgePadding * 2
    );

    return Math.min(
      1,
      availableWidth / menuDesignWidth,
      availableHeight / menuDesignHeight
    );
  }

  private _getScaledPointer(pointer: MenuPointerData): MenuPointerData {
    const scale = this._getMenuScale();

    return {
      ...pointer,
      posX: pointer.posX / scale,
      posY: pointer.posY / scale,
    };
  }

  private _getMenuScrollY(): number {
    const selectedItem = this._items[this._selectedIndex];

    if (!selectedItem) {
      return 0;
    }

    const viewport = this._getMenuViewport();
    const viewportTop = viewport.y;
    const viewportBottom = viewport.y + viewport.height;
    const bounds = this._getItemsBounds();

    let scrollY = this._scrollY;
    const selectedTop = selectedItem.rect.y + scrollY;
    const selectedBottom = selectedTop + selectedItem.rect.height;

    if (selectedTop < viewportTop) {
      scrollY += viewportTop - selectedTop;
    } else if (selectedBottom > viewportBottom) {
      scrollY -= selectedBottom - viewportBottom;
    }

    const contentHeight = bounds.bottom - bounds.top;

    if (contentHeight <= viewport.height) {
      const contentTop = bounds.top + scrollY;
      const contentBottom = bounds.bottom + scrollY;

      if (contentTop < viewportTop) {
        scrollY += viewportTop - contentTop;
      }

      if (contentBottom > viewportBottom) {
        scrollY -= contentBottom - viewportBottom;
      }

      return scrollY;
    }

    const maxScrollY = viewportTop - bounds.top;
    const minScrollY = viewportBottom - bounds.bottom;

    return Math.min(maxScrollY, Math.max(minScrollY, scrollY));
  }

  private _getItemsBounds(): { bottom: number; top: number } {
    const screenOffset = this._getScreenItemOffset(this._screen);

    return this._items.reduce(
      (bounds, item) => ({
        bottom: Math.max(
          bounds.bottom,
          item.rect.y + item.rect.height + screenOffset
        ),
        top: Math.min(bounds.top, item.rect.y + screenOffset),
      }),
      { bottom: -Infinity, top: Infinity }
    );
  }

  private _getScreenItemOffset(screen: MenuScreen): number {
    return screen === "start" ? 0 : submenuItemOffsetY;
  }

  private _getTransitionState(): { easedProgress: number; progress: number } {
    if (!this._transition) {
      return {
        easedProgress: 1,
        progress: 1,
      };
    }

    const elapsed = performance.now() - this._transition.startedAt;
    const progress = Math.max(0, Math.min(1, elapsed / menuTransitionDuration));

    if (progress >= 1) {
      this._transition = null;
    }

    return {
      easedProgress: this._easeInOutCubic(progress),
      progress,
    };
  }

  private _getAnimatedLayout(transition: {
    easedProgress: number;
  }): { logoY: number; titleY: number } {
    const from = this._transition?.from ?? this._screen;
    const to = this._transition?.to ?? this._screen;

    return {
      logoY: this._lerp(
        this._getLogoY(from),
        this._getLogoY(to),
        transition.easedProgress
      ),
      titleY: this._lerp(
        this._getTitleY(from),
        this._getTitleY(to),
        transition.easedProgress
      ),
    };
  }

  private _getLogoY(screen: MenuScreen): number {
    if (screen === "start") {
      return -126;
    }

    return Math.min(-126, -(this._gameArena.height / 2) + 82);
  }

  private _getTitleY(screen: MenuScreen): number {
    if (screen === "start") {
      return -82;
    }

    return this._getLogoY(screen) + 52;
  }

  private _getItemTransitionOffset(): number {
    if (!this._transition) {
      return 0;
    }

    const fromY = this._getLogoY(this._transition.from);
    const toY = this._getLogoY(this._transition.to);

    if (toY < fromY) {
      return 24;
    }

    if (toY > fromY) {
      return -24;
    }

    return 0;
  }

  private _startTransition(from: MenuScreen, to: MenuScreen): void {
    if (from === to) {
      this._transition = null;
      return;
    }

    this._transition = {
      from,
      startedAt: performance.now(),
      to,
    };
  }

  private _easeInOutCubic(progress: number): number {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  private _lerp(from: number, to: number, progress: number): number {
    return from + (to - from) * progress;
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
      userOptions.setOption("enableDebug", true);
      this._konamiIndex = 0;
      this._buildItems();
    }
  }

  private _getScreenTitle(): string {
    if (this._screen === "options") {
      return "Options";
    }

    if (this._screen === "controls") {
      return "Controls";
    }

    if (this._screen === "debug") {
      return "Debug";
    }

    return "A.D. 1910";
  }

  private _goToScreen(screen: MenuScreen): void {
    const previousScreen = this._screen;

    this._screenHistory.push(this._screen);
    this._screen = screen;
    this._selectedIndex = 0;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._sliderDragIndex = null;
    this._scrollY = 0;
    this._buildItems();
    this._startTransition(previousScreen, screen);
  }

  private _goBack(): void {
    const previousScreen = this._screen;
    const nextScreen = this._screenHistory.pop() ?? "start";

    this._screen = nextScreen;
    this._selectedIndex = 0;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._sliderDragIndex = null;
    this._scrollY = 0;
    this._buildItems();
    this._startTransition(previousScreen, nextScreen);
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
    this._setVolume(key, userOptions[key] + direction);
  }

  private _setVolume(
    key: "masterVolume" | "musicVolume" | "effectsVolume",
    value: number
  ): void {
    userOptions.setOption(key, Math.max(0, Math.min(10, value)));
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

  private _formatBindingLabel(binding: BindingAction): string {
    return keyBindingRows.find((row) => row.binding === binding)?.label ?? binding;
  }

  private _getDuplicateBinding(keyCode: number): BindingAction | null {
    const duplicate = Object.entries(userOptions.keyboardBindings).find(
      ([, keyCodes]) => keyCodes.includes(keyCode)
    );

    return (duplicate?.[0] as BindingAction | undefined) ?? null;
  }

  private _isInsideItem(pointer: MenuPointerData, item: MenuItem): boolean {
    const viewport = this._getMenuViewport();
    const itemPosY =
      pointer.posY - this._scrollY - this._getScreenItemOffset(this._screen);

    return (
      pointer.posX >= viewport.x &&
      pointer.posX <= viewport.x + viewport.width &&
      pointer.posY >= viewport.y &&
      pointer.posY <= viewport.y + viewport.height &&
      pointer.posX >= item.rect.x &&
      pointer.posX <= item.rect.x + item.rect.width &&
      itemPosY >= item.rect.y &&
      itemPosY <= item.rect.y + item.rect.height
    );
  }
}

export default Menus;
