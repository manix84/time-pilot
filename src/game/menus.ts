/* Converted from TimePilot.Menu.js (AMD) to ESM TypeScript. */
import { levels, player } from "./constants";
import i18n, {
  availableLanguages,
  getCurrentLanguage,
  getLanguageName,
} from "./i18n";
import palette from "./palette";
import type {
  BonusConfig,
  ControllerType,
  EnemyConfig,
  GameArenaInstance,
  GameLanguage,
  KeyboardBindings,
  MenuPointerData,
  MenuSystemCommands,
  MenuSystemInstance,
  ShowStartMenuOptions,
} from "./types";
import {
  formatGameZoom,
  formatUiZoom,
  getGameScale,
  getUiScale,
} from "./ui-scale";
import userOptions from "./user-options";

type MenuScreen =
  | "start"
  | "options"
  | "controls"
  | "debug"
  | "language"
  | "level";
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
  languageFlag?: GameLanguage;
  isCurrent?: () => boolean;
  levelIcon?: number;
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

interface LevelBlurb {
  description?: string;
  introText: string;
  title?: string;
}

interface LevelShowcaseEntry {
  description: string;
  frame: {
    x: number;
    y: number;
  };
  frameHeight: number;
  frameWidth: number;
  key: string;
  label: string;
  renderHeight?: number;
  renderWidth?: number;
  spriteSrc: string;
}

const controllerTypes: ControllerType[] = ["keyboard1", "keyboard2"];
const menuEdgePadding = 24;
const menuDesignHeight = 500;
const menuDesignWidth = 660;
const submenuItemOffsetY = 22;
const menuTransitionDuration = 500;
const startLogoScale = 2;
const submenuLogoScale = 0.78;
const logoBottomWidth = 390;
const levelIconFrameDuration = 140;
const levelBlurbLineWidth = 24;
const levelMenuIdleFadeDelay = 3000;
const levelMenuIdleFadeDuration = 800;
const levelMenuIdleOpacity = 0.4;
const levelShowcaseDescriptionLineWidth = 18;
const levelShowcaseFrameDuration = 260;
const povPreviewFadeDuration = 250;
const povPreviewFrameDuration = 180;
const submenuHeaderTopGap = 34;
const keyBindingRows: Array<{ binding: BindingAction; label: string }> = [
  { binding: "up", label: i18n.keys.up },
  { binding: "left", label: i18n.keys.left },
  { binding: "down", label: i18n.keys.down },
  { binding: "right", label: i18n.keys.right },
  { binding: "fire", label: i18n.menu.fire },
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
  private _levelIconSprites: Partial<Record<number, HTMLImageElement>> = {};
  private _levelMenuLastInteractionAt = 0;
  private _levelPreviewedLevel?: number;
  private _levelShowcaseSprites: Partial<Record<string, HTMLImageElement>> = {};
  private _povPreviewSprites: Partial<Record<string, HTMLImageElement>> = {};
  private _logoLanguage?: GameLanguage;
  private _logoCanvas?: HTMLCanvasElement;
  private readonly _logoHeight = 96;
  private readonly _logoWidth = 420;
  private _povPreviewAlpha = 0;
  private _povPreviewUpdatedAt = performance.now();
  private _screen: MenuScreen = "start";
  private _screenHistory: MenuScreen[] = [];
  private _pressedItemIndex: number | null = null;
  private _selectedIndex = 0;
  private _sliderDragIndex: number | null = null;
  private _startLabel = i18n.menu.start;
  private _scrollY = 0;
  private _transition: MenuTransition | null = null;

  constructor(gameArena: GameArenaInstance, commands: MenuSystemCommands) {
    this._gameArena = gameArena;
    this._commands = commands;
    this._debugUnlocked = userOptions.enableDebug;
  }

  isActive = (): boolean => {
    return this._active;
  };

  showStart = (options: ShowStartMenuOptions = {}): void => {
    if (this._active && this._screen === "level") {
      this._commands.clearLevelPreview?.();
    }

    this._active = true;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._startLabel = options.startLabel ?? i18n.menu.start;
    this._screen = "start";
    this._screenHistory = [];
    this._pressedItemIndex = null;
    this._selectedIndex = 0;
    this._levelPreviewedLevel = undefined;
    this._resetLevelMenuIdleState();
    this._scrollY = 0;
    this._transition = null;
    this._buildItems();
  };

  hide = (): void => {
    if (this._screen === "level") {
      this._commands.clearLevelPreview?.();
    }

    this._active = false;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._sliderDragIndex = null;
  };

  next = (): void => {
    if (!this._active || !this._items.length) {
      return;
    }

    this._selectedIndex = (this._selectedIndex + 1) % this._items.length;
    this._resetLevelMenuIdleState();
    this._previewFocusedLevel();
  };

  previous = (): void => {
    if (!this._active || !this._items.length) {
      return;
    }

    this._selectedIndex =
      (this._selectedIndex - 1 + this._items.length) % this._items.length;
    this._resetLevelMenuIdleState();
    this._previewFocusedLevel();
  };

  adjust = (direction: -1 | 1): void => {
    if (!this._active) {
      return;
    }

    this._items[this._selectedIndex]?.onAdjust?.(direction);
  };

  goBack = (): void => {
    if (!this._active || this._screen === "start") {
      return;
    }

    this._goBack();
  };

  goToRoot = (): void => {
    if (!this._active || this._screen === "start") {
      return;
    }

    const previousScreen = this._screen;

    if (previousScreen === "level") {
      this._commands.clearLevelPreview?.();
    }

    this._screen = "start";
    this._screenHistory = [];
    this._selectedIndex = 0;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._sliderDragIndex = null;
    this._scrollY = 0;
    this._buildItems();
    this._startTransition(previousScreen, "start");
    this._levelPreviewedLevel = undefined;
    this._resetLevelMenuIdleState();
  };

  activate = (): void => {
    if (!this._active) {
      return;
    }

    this._resetLevelMenuIdleState();

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
  };

  captureKey = (keyCode: number): boolean => {
    if (!this._active) {
      return false;
    }

    this._resetLevelMenuIdleState();

    if (!this._awaitingBinding && (keyCode === 8 || keyCode === 27)) {
      if (this._screen === "start" && keyCode === 27) {
        if (this._isPausedRootMenu()) {
          this._commands.start();
        } else {
          this.hide();
        }
        return true;
      }

      const previousScreen = this._screen;

      this.goBack();
      return previousScreen !== this._screen;
    }

    if (!this._awaitingBinding) {
      this._captureKonamiKey(keyCode);
      return false;
    }

    const duplicateBinding = this._getDuplicateBinding(keyCode);

    if (duplicateBinding && duplicateBinding !== this._awaitingBinding) {
      this._bindingWarning = i18n.menu.alreadyAssignedTo(
        this._formatBindingLabel(duplicateBinding)
      );
      return true;
    }

    userOptions.setKeyboardBinding(this._awaitingBinding, [keyCode]);
    this._awaitingBinding = null;
    this._bindingWarning = "";
    return true;
  };

  handlePointer = (pointer: MenuPointerData): void => {
    if (!this._active) {
      return;
    }

    this._resetLevelMenuIdleState();

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
    this._previewFocusedLevel();

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
  };

  render = (): void => {
    if (!this._active) {
      return;
    }

    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const menuScale = this._getMenuScale();
    const levelMenuIdleProgress = this._getLevelMenuIdleProgress();
    const levelMenuOpacity = this._getLevelMenuOpacity(levelMenuIdleProgress);
    const backplateOpacity = 1 - levelMenuIdleProgress;

    if (backplateOpacity > 0) {
      context.save();
      context.globalAlpha *= backplateOpacity;
      context.fillStyle = palette.menu.backplate;
      context.fillRect(
        -(this._gameArena.width / 2),
        -(this._gameArena.height / 2),
        this._gameArena.width,
        this._gameArena.height
      );
      context.restore();
    }

    const transition = this._getTransitionState();
    const layout = this._getAnimatedLayout(transition);

    context.save();
    context.globalAlpha *= levelMenuOpacity;
    context.scale(menuScale, menuScale);
    this._renderLogo(context, layout.logoY, layout.logoScale);

    if (this._screen !== "start") {
      this._gameArena.renderText(this._getScreenTitle(), 0, layout.titleY, {
        size: 18,
        align: "center",
        valign: "middle",
        color: palette.menu.mutedText,
      });
    } else if (this._isPausedRootMenu()) {
      this._gameArena.renderText(i18n.hud.paused, 0, -42, {
        size: 18,
        align: "center",
        valign: "middle",
        color: palette.menu.mutedText,
      });
    }

    this._scrollY = this._getMenuScrollY();
    this._renderItems(context, transition.progress);

    if (this._awaitingBinding) {
      this._renderBindingWarning(context);
      this._gameArena.renderText(i18n.menu.pressAKey, 0, 136, {
        size: 16,
        align: "center",
        valign: "middle",
        color: palette.menu.waitingText,
      });
    }
    context.restore();
  };

  private _renderLogo = (
    context: CanvasRenderingContext2D,
    y: number,
    scale = 1
  ): void => {
    const logoCanvas = this._getLogoCanvas();

    context.save();
    context.translate(0, y);
    context.scale(scale, scale);
    this._drawPerspectiveLogo(
      context,
      logoCanvas,
      this._logoWidth,
      this._logoHeight
    );
    context.restore();
  };

  private _renderItems = (
    context: CanvasRenderingContext2D,
    transitionProgress: number
  ): void => {
    const viewport = this._getMenuViewport();
    const transitionOffset =
      (1 - transitionProgress) * this._getItemTransitionOffset();
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

    if (this._screen === "options") {
      this._renderPovZoomPreview();
    }

    if (this._screen === "level") {
      this._renderLevelBlurb();
      this._renderLevelShowcase();
    }
  };

  private _getLogoCanvas = (): HTMLCanvasElement => {
    const logoLanguage = getCurrentLanguage();

    if (this._logoCanvas && this._logoLanguage === logoLanguage) {
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
    this._logoLanguage = logoLanguage;
    return logoCanvas;
  };

  private _drawLogoText = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void => {
    const text = i18n.title;
    const textX = width / 2;
    const textY = height / 2 + 3;

    const fontSize = Math.min(52, Math.floor(520 / text.length));

    context.font = `900 ${fontSize}px 'Bookman Old Style', Georgia, serif`;
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
  };

  private _drawPerspectiveLogo = (
    context: CanvasRenderingContext2D,
    logoCanvas: HTMLCanvasElement,
    logoWidth: number,
    logoHeight: number
  ): void => {
    const topWidth = 260;
    const bottomWidth = 390;
    const targetHeight = 86;
    const sliceHeight = 2;

    for (let sourceY = 0; sourceY < logoHeight; sourceY += sliceHeight) {
      const progress = sourceY / (logoHeight - sliceHeight);
      const targetWidth = topWidth + (bottomWidth - topWidth) * progress;
      const targetY = -targetHeight / 2 + (sourceY / logoHeight) * targetHeight;
      const targetSliceHeight = Math.ceil(
        (sliceHeight / logoHeight) * targetHeight
      );

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
  };

  private _buildItems = (): void => {
    if (this._screen === "start") {
      this._items = this._createStartItems();
    } else if (this._screen === "options") {
      this._items = this._createOptionsItems();
    } else if (this._screen === "controls") {
      this._items = this._createControlsItems();
    } else if (this._screen === "language") {
      this._items = this._createLanguageItems();
    } else if (this._screen === "debug") {
      this._items = this._createDebugItems();
    } else {
      this._items = this._createLevelItems();
    }
  };

  private _createStartItems = (): MenuItem[] => {
    const items = [
      this._createItem(this._startLabel, "action", -22, {
        action: this._commands.start,
      }),
      this._createItem(i18n.menu.options, "action", 28, {
        action: () => this._goToScreen("options"),
      }),
    ];

    if (this._debugUnlocked) {
      items.push(
        this._createItem(i18n.menu.debug, "action", 78, {
          action: () => this._goToScreen("debug"),
        })
      );
    }

    return items;
  };

  private _createOptionsItems = (): MenuItem[] => {
    const items = [
      this._createItem(i18n.menu.masterVolume, "slider", -54, {
        getValue: () => `${userOptions.masterVolume}`,
        onAdjust: (direction) => this._adjustVolume("masterVolume", direction),
        onSetValue: (value) => this._setVolume("masterVolume", value),
      }),
      this._createItem(i18n.menu.musicVolume, "slider", -12, {
        getValue: () => `${userOptions.musicVolume}`,
        onAdjust: (direction) => this._adjustVolume("musicVolume", direction),
        onSetValue: (value) => this._setVolume("musicVolume", value),
      }),
      this._createItem(i18n.menu.effectsVolume, "slider", 30, {
        getValue: () => `${userOptions.effectsVolume}`,
        onAdjust: (direction) => this._adjustVolume("effectsVolume", direction),
        onSetValue: (value) => this._setVolume("effectsVolume", value),
      }),
      this._createItem(i18n.menu.uiZoom, "slider", 72, {
        getValue: () => formatUiZoom(),
        onAdjust: (direction) => this.adjustUiZoom(direction),
        onSetValue: (value) => this._setUiZoom(value),
      }),
      this._createItem(i18n.menu.gameZoom, "slider", 114, {
        getValue: () => formatGameZoom(),
        onAdjust: (direction) => this._adjustGameZoom(direction),
        onSetValue: (value) => this._setGameZoom(value),
      }),
      this._createItem(i18n.menu.language, "action", 156, {
        getValue: () => getLanguageName(userOptions.language),
        languageFlag: userOptions.language,
        action: () => this._goToScreen("language"),
      }),
      this._createItem(i18n.menu.controlType, "enum", 198, {
        getValue: () =>
          userOptions.controllerType === "keyboard1"
            ? i18n.menu.directional
            : i18n.menu.rotate,
        onAdjust: (direction) => this._adjustControllerType(direction),
      }),
      this._createItem(i18n.menu.remapControls, "action", 240, {
        action: () => this._goToScreen("controls"),
      }),
    ];

    items.push(
      this._createItem(i18n.menu.back, "action", 290, {
        action: () => this._goBack(),
      })
    );

    return items;
  };

  private _createControlsItems = (): MenuItem[] => {
    return [
      this._createKeyBindingItem("up", -43, -54, 86, 34),
      this._createKeyBindingItem("left", -146, -12, 86, 34),
      this._createKeyBindingItem("down", -43, -12, 86, 34),
      this._createKeyBindingItem("right", 60, -12, 86, 34),
      this._createKeyBindingItem("fire", -146, 30, 292, 34),
      this._createItem(i18n.menu.back, "action", 92, {
        action: () => this._goBack(),
      }),
    ];
  };

  private _createLanguageItems = (): MenuItem[] => {
    return [
      ...availableLanguages.map((language, index) =>
        this._createItem(
          getLanguageName(language),
          "action",
          -54 + index * 42,
          {
            action: () => this._setLanguage(language),
            getValue: () =>
              userOptions.language === language ? i18n.menu.current : "",
            isCurrent: () => userOptions.language === language,
            languageFlag: language,
          }
        )
      ),
      this._createItem(
        i18n.menu.back,
        "action",
        30 + availableLanguages.length * 42,
        {
          action: () => this._goBack(),
        }
      ),
    ];
  };

  private _createLevelItems = (): MenuItem[] => {
    const enabledLevels = this._getEnabledLevels();

    return [
      ...enabledLevels.map((level, index) =>
        this._createItem(
          this._getLevelLabel(level),
          "action",
          -54 + index * 42,
          {
            action: () => this._setSelectedLevel(level),
            levelIcon: level,
            rect: {
              x: -110,
              y: -54 + index * 42,
              width: 220,
              height: 36,
            },
          }
        )
      ),
      this._createItem(
        i18n.menu.back,
        "action",
        30 + enabledLevels.length * 42,
        {
          action: () => this._goBack(),
          rect: {
            x: -110,
            y: 30 + enabledLevels.length * 42,
            width: 220,
            height: 36,
          },
        }
      ),
    ];
  };

  private _createKeyBindingItem = (
    binding: BindingAction,
    x: number,
    y: number,
    width: number,
    height: number
  ): MenuItem => {
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
  };

  private _createDebugItems = (): MenuItem[] => {
    return [
      this._createToggleItem(i18n.menu.invincibilityShield, "invincible", -54),
      this._createToggleItem(i18n.menu.showHitBoxes, "showHitboxes", -12),
      this._createToggleItem(
        i18n.menu.showControlsOverlay,
        "showControlsOverlay",
        30
      ),
      this._createToggleItem(
        i18n.menu.showCoordinates,
        "showPlayerCoordinates",
        72
      ),
      this._createItem(i18n.menu.selectLevel, "action", 114, {
        action: () => this._goToScreen("level"),
        getValue: () => this._getSelectedLevelLabel(),
      }),
      this._createItem(i18n.menu.back, "action", 164, {
        action: () => this._goBack(),
      }),
    ];
  };

  private _createToggleItem = (
    label: string,
    option: ToggleDebugOption,
    y: number
  ): MenuItem => {
    return this._createItem(label, "toggle", y, {
      getValue: () =>
        userOptions.debug[option] ? i18n.menu.on : i18n.menu.off,
      onAdjust: () => {
        userOptions.setDebugOption(option, !userOptions.debug[option]);
      },
    });
  };

  private _createItem = (
    label: string,
    kind: MenuItemKind,
    y: number,
    options: Partial<MenuItem> = {}
  ): MenuItem => {
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
  };

  private _renderItem = (item: MenuItem, isSelected: boolean): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const isAwaiting = item.binding === this._awaitingBinding;
    const progress = this._getItemProgress(item);
    const progressWidth = progress === null ? 0 : item.rect.width * progress;

    const isCurrent = item.isCurrent?.() ?? false;

    if (item.disabled) {
      context.fillStyle = palette.menu.disabledBackground;
    } else if (isSelected) {
      context.fillStyle = palette.menu.selectedBackground;
    } else if (isCurrent) {
      context.fillStyle = palette.menu.progressFill;
    } else {
      context.fillStyle = palette.menu.itemBackground;
    }
    context.fillRect(
      item.rect.x,
      item.rect.y,
      item.rect.width,
      item.rect.height
    );

    if (progress !== null) {
      context.fillStyle = isSelected
        ? palette.menu.itemBackground
        : palette.menu.progressFill;
      context.fillRect(
        item.rect.x,
        item.rect.y,
        progressWidth,
        item.rect.height
      );
    }

    if (item.disabled) {
      context.strokeStyle = palette.menu.disabledBorder;
    } else if (isAwaiting) {
      context.strokeStyle = palette.menu.waitingBorder;
    } else if (isCurrent || isSelected) {
      context.strokeStyle = palette.menu.selectedBorder;
    } else {
      context.strokeStyle = palette.menu.itemBorder;
    }
    context.lineWidth = 2;
    context.strokeRect(
      item.rect.x,
      item.rect.y,
      item.rect.width,
      item.rect.height
    );

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
  };

  private _renderItemText = (item: MenuItem, color: string): void => {
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

    if (item.levelIcon) {
      this._renderLevelIcon(item, item.levelIcon);
    }

    if (item.getValue) {
      if (item.languageFlag) {
        this._renderLanguageFlag(item, item.languageFlag);
      }

      this._gameArena.renderText(
        item.getValue(),
        item.rect.x +
          item.rect.width -
          (item.languageFlag || item.levelIcon ? 48 : 14),
        item.rect.y + item.rect.height / 2,
        {
          size: item.kind === "key" ? 13 : 16,
          align: "right",
          valign: "middle",
          color,
        }
      );
    }
  };

  private _renderLevelBlurb = (): void => {
    const level = this._getBlurbLevel();
    const levelMessages = i18n.levels as Record<number, LevelBlurb>;
    const blurb = levelMessages[level];

    if (!blurb) {
      return;
    }

    const x = -260;
    let y = -54 + this._scrollY;
    const title = blurb.title ?? blurb.introText;
    const description = blurb.description ?? "";

    this._gameArena.renderText(blurb.introText, x, y, {
      size: 11,
      align: "left",
      valign: "top",
      color: palette.menu.mutedText,
    });
    y += 18;

    this._gameArena.renderText(title, x, y, {
      size: 15,
      align: "left",
      valign: "top",
      color: palette.menu.selectedBackground,
    });
    y += 24;

    this._wrapText(description, levelBlurbLineWidth).forEach((line) => {
      this._gameArena.renderText(line, x, y, {
        size: 10,
        align: "left",
        valign: "top",
        color: palette.menu.itemText,
      });
      y += 14;
    });
  };

  private _renderLevelShowcase = (): void => {
    const level = this._getBlurbLevel();
    const levelConfig = levels[level];

    if (!levelConfig) {
      return;
    }

    const entries = this._getLevelShowcaseEntries(level);
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const x = 148;
    let y = -58 + this._scrollY;

    context.imageSmoothingEnabled = false;

    entries.forEach((entry) => {
      const sprite = this._getLevelShowcaseSprite(entry.key, entry.spriteSrc);
      const maxSpriteWidth = 36;
      const maxSpriteHeight = 28;
      const baseRenderWidth = entry.renderWidth ?? entry.frameWidth;
      const baseRenderHeight = entry.renderHeight ?? entry.frameHeight;
      const spriteScale = Math.min(
        maxSpriteWidth / baseRenderWidth,
        maxSpriteHeight / baseRenderHeight
      );
      const renderWidth = Math.max(
        1,
        Math.round(baseRenderWidth * spriteScale)
      );
      const renderHeight = Math.max(
        1,
        Math.round(baseRenderHeight * spriteScale)
      );
      const spriteX = x;
      const spriteY = y + 2;
      const textX = x + 46;

      context.drawImage(
        sprite,
        entry.frame.x * entry.frameWidth,
        entry.frame.y * entry.frameHeight,
        entry.frameWidth,
        entry.frameHeight,
        spriteX,
        spriteY,
        renderWidth,
        renderHeight
      );

      this._gameArena.renderText(entry.label, textX, y, {
        size: 10,
        align: "left",
        valign: "top",
        color: palette.menu.selectedBackground,
      });

      let descriptionY = y + 13;
      this._wrapText(
        entry.description,
        levelShowcaseDescriptionLineWidth
      ).forEach((line) => {
        this._gameArena.renderText(line, textX, descriptionY, {
          size: 8,
          align: "left",
          valign: "top",
          color: palette.menu.itemText,
        });
        descriptionY += 10;
      });

      y += 52;
    });
  };

  private _renderPovZoomPreview = (): void => {
    const alpha = this._updatePovPreviewAlpha();

    if (alpha <= 0) {
      return;
    }

    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const gameZoomItem = this._items.find(
      (item) => item.label === i18n.menu.gameZoom
    );
    const tick = Math.floor(performance.now() / povPreviewFrameDuration);
    const frame = tick % player.rotationFrameCount;
    const frameX = player.spriteFrameAxis === "y" ? 0 : frame;
    const frameY = player.spriteFrameAxis === "y" ? frame : 0;
    const gameScale = getGameScale(
      this._gameArena.width,
      this._gameArena.height
    );
    const x =
      (gameZoomItem?.rect.x ?? -150) + (gameZoomItem?.rect.width ?? 300) + 43;
    const y =
      (gameZoomItem?.rect.y ?? 114) +
      (gameZoomItem?.rect.height ?? 36) / 2 +
      this._scrollY +
      this._getScreenItemOffset(this._screen);

    context.save();
    context.globalAlpha *= alpha;
    context.imageSmoothingEnabled = false;
    context.translate(x, y);
    context.scale(gameScale, gameScale);

    this._drawPovPreviewSprite({
      frameHeight: player.frameHeight,
      frameWidth: player.frameWidth,
      frameX,
      frameY,
      renderHeight: player.height,
      renderWidth: player.width,
      sprite: this._getPovPreviewSprite("player", player.sprite.src),
      x: -player.width / 2,
      y: -player.height / 2,
    });

    context.restore();
  };

  private _updatePovPreviewAlpha = (): number => {
    const now = performance.now();
    const elapsed = Math.max(0, now - this._povPreviewUpdatedAt);
    const targetAlpha = this._isGameZoomSelected() ? 1 : 0;
    const direction = targetAlpha > this._povPreviewAlpha ? 1 : -1;
    const nextAlpha =
      this._povPreviewAlpha + direction * (elapsed / povPreviewFadeDuration);

    this._povPreviewUpdatedAt = now;
    this._povPreviewAlpha =
      direction > 0
        ? Math.min(targetAlpha, nextAlpha)
        : Math.max(targetAlpha, nextAlpha);

    return this._povPreviewAlpha;
  };

  private _isGameZoomSelected = (): boolean => {
    return (
      this._screen === "options" &&
      this._items[this._selectedIndex]?.label === i18n.menu.gameZoom
    );
  };

  private _drawPovPreviewSprite = ({
    frameHeight,
    frameWidth,
    frameX,
    frameY,
    renderHeight,
    renderWidth,
    sprite,
    x,
    y,
  }: {
    frameHeight: number;
    frameWidth: number;
    frameX: number;
    frameY: number;
    renderHeight: number;
    renderWidth: number;
    sprite: HTMLImageElement;
    x: number;
    y: number;
  }): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;

    context.drawImage(
      sprite,
      frameX * frameWidth,
      frameY * frameHeight,
      frameWidth,
      frameHeight,
      x,
      y,
      renderWidth,
      renderHeight
    );
  };

  private _getPovPreviewSprite = (
    key: string,
    spriteSrc: string
  ): HTMLImageElement => {
    const cachedSprite = this._povPreviewSprites[key];

    if (cachedSprite) {
      return cachedSprite;
    }

    const sprite = new Image();
    sprite.src = spriteSrc;
    this._povPreviewSprites[key] = sprite;
    return sprite;
  };

  private _getLevelShowcaseEntries = (level: number): LevelShowcaseEntry[] => {
    const levelConfig = levels[level];
    const labels = i18n.menu.levelShowcase;
    const entries: LevelShowcaseEntry[] = [
      this._getEnemyShowcaseEntry(
        `${level}-basic`,
        labels.basic.label,
        labels.basic.description,
        levelConfig.enemies.basic
      ),
    ];

    if (levelConfig.enemies.specialBomber) {
      entries.push(
        this._getEnemyShowcaseEntry(
          `${level}-special`,
          labels.special.label,
          labels.special.description,
          levelConfig.enemies.specialBomber
        )
      );
    }

    entries.push(
      this._getEnemyShowcaseEntry(
        `${level}-boss`,
        labels.boss.label,
        labels.boss.description,
        levelConfig.enemies.boss
      ),
      this._getBonusShowcaseEntry(
        `${level}-bonus`,
        labels.bonus.label,
        labels.bonus.description,
        levelConfig.bonus
      )
    );

    return entries;
  };

  private _getEnemyShowcaseEntry = (
    key: string,
    label: string,
    description: string,
    enemyConfig: EnemyConfig
  ): LevelShowcaseEntry => ({
    description,
    frame: this._getLevelShowcaseEnemyFrame(enemyConfig),
    frameHeight: enemyConfig.height,
    frameWidth: enemyConfig.width,
    key,
    label,
    renderHeight: enemyConfig.renderHeight,
    renderWidth: enemyConfig.renderWidth,
    spriteSrc: enemyConfig.sprite.src,
  });

  private _getBonusShowcaseEntry = (
    key: string,
    label: string,
    description: string,
    bonusConfig: BonusConfig
  ): LevelShowcaseEntry => ({
    description,
    frame: this._getLevelShowcaseBonusFrame(bonusConfig),
    frameHeight: bonusConfig.height,
    frameWidth: bonusConfig.width,
    key,
    label,
    spriteSrc: bonusConfig.sprite.src,
  });

  private _getLevelShowcaseEnemyFrame = (
    enemyConfig: EnemyConfig
  ): { x: number; y: number } => {
    const tick = Math.floor(performance.now() / levelShowcaseFrameDuration);

    if (enemyConfig.bossDamageFrames) {
      return {
        x: tick % enemyConfig.bossDamageFrames,
        y: 0,
      };
    }

    if (enemyConfig.animationRows && enemyConfig.horizontalDirectionFrames) {
      const frameX = this._getHorizontalDirectionPreviewFrame(
        enemyConfig.horizontalDirectionFrames,
        tick
      );

      return {
        x: frameX,
        y: tick % enemyConfig.animationRows,
      };
    }

    if (enemyConfig.animationRows) {
      return {
        x: enemyConfig.canRotate
          ? tick % 16
          : tick % (enemyConfig.animationFrames ?? 1),
        y: Math.floor(tick / 2) % enemyConfig.animationRows,
      };
    }

    if (enemyConfig.animationFrames && !enemyConfig.canRotate) {
      return {
        x: tick % enemyConfig.animationFrames,
        y: 0,
      };
    }

    if (enemyConfig.canRotate) {
      return {
        x: tick % 16,
        y: 0,
      };
    }

    return { x: 0, y: 0 };
  };

  private _getLevelShowcaseBonusFrame = (
    bonusConfig: BonusConfig
  ): { x: number; y: number } => {
    const tick = Math.floor(performance.now() / levelShowcaseFrameDuration);
    const cycle = bonusConfig.animationCycle;
    const frame = cycle[tick % cycle.length] ?? 1;

    return {
      x: Math.max(0, frame - 1),
      y: 0,
    };
  };

  private _getLevelShowcaseSprite = (
    key: string,
    spriteSrc: string
  ): HTMLImageElement => {
    const cachedSprite = this._levelShowcaseSprites[key];

    if (cachedSprite) {
      return cachedSprite;
    }

    const sprite = new Image();
    sprite.src = spriteSrc;
    this._levelShowcaseSprites[key] = sprite;
    return sprite;
  };

  private _getBlurbLevel = (): number => {
    const selectedLevel = this._items[this._selectedIndex]?.levelIcon;

    if (selectedLevel) {
      return selectedLevel;
    }

    return this._commands.getLevel?.() ?? 1;
  };

  private _wrapText = (text: string, maxLineLength: number): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";

    words.forEach((word) => {
      const nextLine = line ? `${line} ${word}` : word;

      if (nextLine.length > maxLineLength && line) {
        lines.push(line);
        line = word;
      } else {
        line = nextLine;
      }
    });

    if (line) {
      lines.push(line);
    }

    return lines;
  };

  private _renderLevelIcon = (item: MenuItem, level: number): void => {
    const levelConfig = levels[level];

    if (!levelConfig) {
      return;
    }

    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const sprite = this._getLevelIconSprite(level);
    const enemyConfig = levelConfig.enemies.basic;
    const frame = this._getLevelIconFrame(enemyConfig);
    const size = 28;
    const x = item.rect.x + item.rect.width - 38;
    const y = item.rect.y + item.rect.height / 2 - size / 2;

    context.imageSmoothingEnabled = false;
    context.drawImage(
      sprite,
      frame.x * enemyConfig.width,
      frame.y * enemyConfig.height,
      enemyConfig.width,
      enemyConfig.height,
      x,
      y,
      size,
      size
    );
  };

  private _getLevelIconFrame = (
    enemyConfig: EnemyConfig
  ): { x: number; y: number } => {
    const tick = Math.floor(performance.now() / levelIconFrameDuration);

    if (enemyConfig.animationRows && enemyConfig.horizontalDirectionFrames) {
      return {
        x: 0,
        y: tick % enemyConfig.animationRows,
      };
    }

    if (enemyConfig.animationRows) {
      return {
        x: enemyConfig.canRotate
          ? 0
          : tick % (enemyConfig.animationFrames ?? 1),
        y: tick % enemyConfig.animationRows,
      };
    }

    if (enemyConfig.animationFrames && !enemyConfig.canRotate) {
      return {
        x: tick % enemyConfig.animationFrames,
        y: 0,
      };
    }

    if (enemyConfig.canRotate) {
      return {
        x: tick % 16,
        y: 0,
      };
    }

    return { x: 0, y: 0 };
  };

  private _getHorizontalDirectionPreviewFrame = (
    frameCount: number,
    tick: number
  ): number => {
    const maxFrame = Math.max(0, frameCount - 1);

    if (maxFrame === 0) {
      return 0;
    }

    const cyclePosition = tick % (maxFrame * 2);

    return cyclePosition <= maxFrame
      ? cyclePosition
      : maxFrame * 2 - cyclePosition;
  };

  private _getLevelIconSprite = (level: number): HTMLImageElement => {
    if (this._levelIconSprites[level]) {
      return this._levelIconSprites[level];
    }

    const sprite = new Image();
    sprite.src = levels[level].enemies.basic.sprite.src;
    this._levelIconSprites[level] = sprite;
    return sprite;
  };

  private _renderLanguageFlag = (
    item: MenuItem,
    language: GameLanguage
  ): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const scale = 2;
    const x = item.rect.x + item.rect.width - 38;
    const y = item.rect.y + item.rect.height / 2 - 8;
    const rect = (
      gridX: number,
      gridY: number,
      width: number,
      height: number,
      color: string
    ): void => {
      context.fillStyle = color;
      context.fillRect(
        x + gridX * scale,
        y + gridY * scale,
        width * scale,
        height * scale
      );
    };

    const verticalTricolor = (colors: [string, string, string]): void => {
      rect(0, 0, 5, 8, colors[0]);
      rect(5, 0, 6, 8, colors[1]);
      rect(11, 0, 5, 8, colors[2]);
    };
    const horizontalTricolor = (colors: [string, string, string]): void => {
      rect(0, 0, 16, 3, colors[0]);
      rect(0, 3, 16, 2, colors[1]);
      rect(0, 5, 16, 3, colors[2]);
    };
    const drawUnionFlagPixel = (gridX: number, gridY: number): void => {
      const diagonalA = Math.floor(gridX / 2);
      const diagonalB = 7 - Math.floor(gridX / 2);
      const isWhiteDiagonal =
        Math.abs(gridY - diagonalA) <= 1 || Math.abs(gridY - diagonalB) <= 1;
      const isRedDiagonal =
        gridX % 2 === 0 && (gridY === diagonalA || gridY === diagonalB);
      const isWhiteCross =
        (gridX >= 6 && gridX <= 9) || (gridY >= 2 && gridY <= 5);
      const isRedCross =
        (gridX >= 7 && gridX <= 8) || (gridY >= 3 && gridY <= 4);

      if (isRedCross || isRedDiagonal) {
        rect(gridX, gridY, 1, 1, "#C8102E");
      } else if (isWhiteCross || isWhiteDiagonal) {
        rect(gridX, gridY, 1, 1, "#FFFFFF");
      } else {
        rect(gridX, gridY, 1, 1, "#012169");
      }
    };
    const drawUsFlagPixel = (gridX: number, gridY: number): void => {
      if (gridX < 7 && gridY < 4) {
        rect(
          gridX,
          gridY,
          1,
          1,
          (gridX + gridY) % 2 === 0 ? "#FFFFFF" : "#3C3B6E"
        );
        return;
      }

      rect(gridX, gridY, 1, 1, gridY % 2 === 0 ? "#B22234" : "#FFFFFF");
    };
    const drawEnglishFlag = (): void => {
      for (let gridY = 0; gridY < 8; gridY++) {
        for (let gridX = 0; gridX < 16; gridX++) {
          if (gridX < 8) {
            drawUsFlagPixel(gridX, gridY);
          } else {
            drawUnionFlagPixel(gridX, gridY);
          }
        }
      }
    };

    if (language === "fr") {
      verticalTricolor(["#0055A4", "#FFFFFF", "#EF4135"]);
      return;
    }

    if (language === "es") {
      horizontalTricolor(["#AA151B", "#F1BF00", "#AA151B"]);
      return;
    }

    if (language === "de") {
      horizontalTricolor(["#000000", "#DD0000", "#FFCE00"]);
      return;
    }

    if (language === "it") {
      verticalTricolor(["#009246", "#FFFFFF", "#CE2B37"]);
      return;
    }

    if (language === "nl") {
      horizontalTricolor(["#AE1C28", "#FFFFFF", "#21468B"]);
      return;
    }

    if (language === "ro") {
      verticalTricolor(["#002B7F", "#FCD116", "#CE1126"]);
      return;
    }

    drawEnglishFlag();
  };

  private _renderBindingWarning = (context: CanvasRenderingContext2D): void => {
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
  };

  private _getItemProgress = (item: MenuItem): number | null => {
    if (item.kind !== "slider" || !item.getValue) {
      return null;
    }

    const value =
      item.label === i18n.menu.uiZoom
        ? userOptions.uiZoom
        : item.label === i18n.menu.gameZoom
          ? userOptions.gameZoom
          : Number(item.getValue());
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.max(0, Math.min(1, value / 10));
  };

  private _setSliderFromPointer = (
    item: MenuItem,
    pointer: MenuPointerData
  ): void => {
    if (!item.onSetValue) {
      return;
    }

    const progress = Math.max(
      0,
      Math.min(1, (pointer.posX - item.rect.x) / item.rect.width)
    );

    item.onSetValue(Math.round(progress * 10));
  };

  private _getMenuViewport = (): MenuViewport => {
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
  };

  private _getMenuScale = (): number => {
    const designWidth = this._getMenuDesignWidth();
    const availableWidth = Math.max(
      1,
      this._gameArena.width - menuEdgePadding * 2
    );
    const availableHeight = Math.max(
      1,
      this._gameArena.height - menuEdgePadding * 2
    );

    return (
      Math.min(
        1,
        availableWidth / designWidth,
        availableHeight / menuDesignHeight
      ) * getUiScale(this._gameArena.width, this._gameArena.height)
    );
  };

  private _getMenuDesignWidth = (): number => {
    const from = this._transition?.from ?? this._screen;
    const to = this._transition?.to ?? this._screen;
    const logoWidth =
      Math.max(this._getLogoScale(from), this._getLogoScale(to)) *
      logoBottomWidth;

    return Math.max(menuDesignWidth, logoWidth + menuEdgePadding * 2);
  };

  private _getScaledPointer = (pointer: MenuPointerData): MenuPointerData => {
    const scale = this._getMenuScale();

    return {
      ...pointer,
      posX: pointer.posX / scale,
      posY: pointer.posY / scale,
    };
  };

  private _getMenuScrollY = (): number => {
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
  };

  private _getItemsBounds = (): { bottom: number; top: number } => {
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
  };

  private _getScreenItemOffset = (screen: MenuScreen): number => {
    return screen === "start" ? 0 : submenuItemOffsetY;
  };

  private _getTransitionState = (): {
    easedProgress: number;
    progress: number;
  } => {
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
  };

  private _getAnimatedLayout = (transition: {
    easedProgress: number;
  }): { logoScale: number; logoY: number; titleY: number } => {
    const from = this._transition?.from ?? this._screen;
    const to = this._transition?.to ?? this._screen;

    return {
      logoScale: this._lerp(
        this._getLogoScale(from),
        this._getLogoScale(to),
        transition.easedProgress
      ),
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
  };

  private _getLogoY = (screen: MenuScreen): number => {
    if (screen === "start") {
      return -126;
    }

    return this._getMenuViewport().y + submenuHeaderTopGap;
  };

  private _getLogoScale = (screen: MenuScreen): number => {
    return screen === "start" ? startLogoScale : submenuLogoScale;
  };

  private _getTitleY = (screen: MenuScreen): number => {
    if (screen === "start") {
      return -82;
    }

    return this._getLogoY(screen) + 42;
  };

  private _getItemTransitionOffset = (): number => {
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
  };

  private _startTransition = (from: MenuScreen, to: MenuScreen): void => {
    if (from === to) {
      this._transition = null;
      return;
    }

    this._transition = {
      from,
      startedAt: performance.now(),
      to,
    };
  };

  private _easeInOutCubic = (progress: number): number => {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  };

  private _lerp = (from: number, to: number, progress: number): number => {
    return from + (to - from) * progress;
  };

  private _captureKonamiKey = (keyCode: number): void => {
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
  };

  private _getScreenTitle = (): string => {
    if (this._screen === "options") {
      return i18n.menu.options;
    }

    if (this._screen === "controls") {
      return i18n.menu.controls;
    }

    if (this._screen === "debug") {
      return i18n.menu.debug;
    }

    if (this._screen === "language") {
      return i18n.menu.language;
    }

    if (this._screen === "level") {
      return i18n.menu.selectLevel;
    }

    return i18n.levels[1].introText;
  };

  private _isPausedRootMenu = (): boolean => {
    return this._screen === "start" && this._startLabel === i18n.menu.continue;
  };

  private _goToScreen = (screen: MenuScreen): void => {
    const previousScreen = this._screen;

    if (previousScreen === "level" && screen !== "level") {
      this._commands.clearLevelPreview?.();
    }

    this._screenHistory.push(this._screen);
    this._screen = screen;
    this._selectedIndex = 0;
    this._levelMenuLastInteractionAt = performance.now();
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._sliderDragIndex = null;
    this._scrollY = 0;
    this._buildItems();
    this._startTransition(previousScreen, screen);
    this._levelPreviewedLevel = undefined;
    this._resetLevelMenuIdleState();
    this._previewFocusedLevel();
  };

  private _goBack = (): void => {
    const previousScreen = this._screen;
    const nextScreen = this._screenHistory.pop() ?? "start";

    if (previousScreen === "level" && nextScreen !== "level") {
      this._commands.clearLevelPreview?.();
    }

    this._screen = nextScreen;
    this._selectedIndex = 0;
    this._levelMenuLastInteractionAt = performance.now();
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._sliderDragIndex = null;
    this._scrollY = 0;
    this._buildItems();
    this._startTransition(previousScreen, nextScreen);
    this._levelPreviewedLevel = undefined;
    this._resetLevelMenuIdleState();
    this._previewFocusedLevel();
  };

  private _adjustControllerType = (direction: -1 | 1): void => {
    const currentIndex = controllerTypes.indexOf(userOptions.controllerType);
    const nextIndex =
      (currentIndex + direction + controllerTypes.length) %
      controllerTypes.length;

    userOptions.setOption("controllerType", controllerTypes[nextIndex]);
  };

  private _getSelectedLevelLabel = (): string => {
    return this._getLevelLabel(this._commands.getLevel?.() ?? 1);
  };

  private _getLevelLabel = (level: number): string => {
    const levelMessages = i18n.levels as Record<number, { introText: string }>;

    return levelMessages[level]?.introText ?? `${level}`;
  };

  private _getEnabledLevels = (): number[] => {
    return Object.keys(levels)
      .map(Number)
      .filter((level) => levels[level].enabled)
      .sort((a, b) => a - b);
  };

  private _setSelectedLevel = (level: number): void => {
    this._commands.clearLevelPreview?.();
    this._commands.selectLevel?.(level);
  };

  adjustUiZoom = (direction: -1 | 1): void => {
    this._setUiZoom(userOptions.uiZoom + direction);
  };

  private _setUiZoom = (value: number): void => {
    userOptions.setOption("uiZoom", Math.max(0, Math.min(10, value)));
  };

  private _adjustGameZoom = (direction: -1 | 1): void => {
    this._setGameZoom(userOptions.gameZoom + direction);
  };

  private _setGameZoom = (value: number): void => {
    userOptions.setOption("gameZoom", Math.max(0, Math.min(10, value)));
  };

  private _getLevelMenuOpacity = (idleProgress: number): number => {
    return 1 - idleProgress * (1 - levelMenuIdleOpacity);
  };

  private _getLevelMenuIdleProgress = (): number => {
    if (
      this._screen !== "level" ||
      !this._items[this._selectedIndex]?.levelIcon
    ) {
      return 0;
    }

    const elapsed = performance.now() - this._levelMenuLastInteractionAt;

    if (elapsed <= levelMenuIdleFadeDelay) {
      return 0;
    }

    return Math.min(
      1,
      (elapsed - levelMenuIdleFadeDelay) / levelMenuIdleFadeDuration
    );
  };

  private _resetLevelMenuIdleState = (): void => {
    this._levelMenuLastInteractionAt = performance.now();
  };

  private _previewFocusedLevel = (): void => {
    if (this._screen !== "level") {
      return;
    }

    const level = this._items[this._selectedIndex]?.levelIcon;

    if (!level || this._levelPreviewedLevel === level) {
      return;
    }

    this._levelPreviewedLevel = level;
    this._commands.previewLevel?.(level);
  };

  private _setLanguage = (language: GameLanguage): void => {
    userOptions.setOption("language", language);
    this._goBack();
  };

  private _adjustVolume = (
    key: "masterVolume" | "musicVolume" | "effectsVolume",
    direction: -1 | 1
  ): void => {
    this._setVolume(key, userOptions[key] + direction);
  };

  private _setVolume = (
    key: "masterVolume" | "musicVolume" | "effectsVolume",
    value: number
  ): void => {
    userOptions.setOption(key, Math.max(0, Math.min(10, value)));
  };

  private _formatKey = (keyCode: number): string => {
    if (keyCode === 32) {
      return i18n.keys.space;
    }

    if (keyCode >= 65 && keyCode <= 90) {
      return String.fromCharCode(keyCode);
    }

    const namedKeys: Record<number, string> = {
      37: i18n.keys.left,
      38: i18n.keys.up,
      39: i18n.keys.right,
      40: i18n.keys.down,
    };

    return namedKeys[keyCode] ?? `${keyCode}`;
  };

  private _formatBindingLabel = (binding: BindingAction): string => {
    return (
      keyBindingRows.find((row) => row.binding === binding)?.label ?? binding
    );
  };

  private _getDuplicateBinding = (keyCode: number): BindingAction | null => {
    const duplicate = Object.entries(userOptions.keyboardBindings).find(
      ([, keyCodes]) => keyCodes.includes(keyCode)
    );

    return (duplicate?.[0] as BindingAction | undefined) ?? null;
  };

  private _isInsideItem = (
    pointer: MenuPointerData,
    item: MenuItem
  ): boolean => {
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
  };
}

export default Menus;
