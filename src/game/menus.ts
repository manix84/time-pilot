/* Converted from TimePilot.Menu.js (AMD) to ESM TypeScript. */
import { levels, player } from "./constants";
import {
  defaultFilterMode,
  filterModeLabels,
  filterModes,
  filterSettingKeys,
  filterSettingLabels,
  filterSettingDescriptions,
  filterPresets,
  normalizeFilterIntensity,
} from "./filter-settings";
import i18n, {
  availableLanguages,
  getCurrentLanguage,
  getLanguageName,
} from "./i18n";
import {
  achievementCardHeight,
  achievementCardIconSize,
  achievementCardWidth,
} from "./achievement-layout";
import { getNextLogLevel } from "./log-levels";
import palette from "./palette";
import type { AchievementStatus } from "./achievements";
import type {
  BonusConfig,
  ControllerType,
  EnemyConfig,
  GameArenaInstance,
  GameLanguage,
  KeyboardBindings,
  MenuRenderOptions,
  MenuPointerData,
  MenuSystemCommands,
  MenuSystemInstance,
  ProjectileConfig,
  ShowStartMenuOptions,
} from "./types";
import type { StoredDataResetScope } from "./storage-reset";
import {
  formatGameZoom,
  formatUiZoom,
  getGameScale,
  getUiScale,
  zoomMaxPercent,
  zoomDefaultPercent,
  zoomMinPercent,
  zoomStepPercent,
} from "./ui-scale";
import userOptions from "./user-options";

type MenuScreen =
  | "start"
  | "achievements"
  | "options"
  | "controls"
  | "filters"
  | "filter-custom"
  | "debug"
  | "debug-reset"
  | "debug-reset-confirm"
  | "demo-watch"
  | "game-over"
  | "language"
  | "restart-confirm"
  | "level";
type MenuItemKind = "action" | "enum" | "slider" | "key" | "toggle";
type ToggleDebugOption =
  | "invincible"
  | "showHeadingVectors"
  | "showControlsOverlay"
  | "showHitboxes"
  | "showPlayerCoordinates"
  | "showSteeringArc";
type BindingAction = keyof KeyboardBindings;

interface MenuItem {
  action?: () => void;
  binding?: BindingAction;
  description?: string;
  disabled?: boolean;
  getValue?: () => string;
  kind: MenuItemKind;
  label: string;
  languageFlag?: GameLanguage;
  isCurrent?: () => boolean;
  achievement?: AchievementStatus;
  levelIcon?: number;
  onAdjust?: (direction: -1 | 1) => void;
  onSetValue?: (value: number) => void;
  opensSubmenu?: boolean;
  rect: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  sliderSteps?: number;
  sliderMin?: number;
}

interface MenuViewport {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface ScrollThumbGeometry {
  contentHeight: number;
  thumbHeight: number;
  thumbY: number;
  trackHeight: number;
  x: number;
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
  projectile?: LevelShowcaseProjectile;
  spriteSrc: string;
}

interface LevelShowcaseProjectile {
  color: string;
  frame: {
    x: number;
    y: number;
  };
  frameHeight: number;
  frameWidth: number;
  label: string;
  renderHeight?: number;
  renderWidth?: number;
  spriteSrc?: string;
}

const controllerTypes: ControllerType[] = ["keyboard1", "keyboard2"];
const menuEdgePadding = 24;
const menuDesignHeight = 500;
const menuDesignWidth = 660;
const submenuItemOffsetY = 22;
const menuTransitionDuration = 500;
const demoSubtitleFadeDuration = 250;
const demoSubtitleExitFadeDuration = 100;
const startLogoScale = 2;
const submenuLogoScale = 0.78;
const logoBottomWidth = 390;
const levelIconFrameDuration = 140;
const levelBlurbLineWidth = 24;
const alternatingFlagHoldDuration = 3000;
const alternatingFlagFadeDuration = 500;
const levelShowcaseDescriptionLineWidth = 18;
const levelShowcaseFrameDuration = 260;
const povPreviewFadeDuration = 250;
const povPreviewFrameDuration = 180;
const submenuHeaderTopGap = 34;
const touchScrollDragThreshold = 8;
const achievementCardGap = 12;
const achievementIconRenderSize = achievementCardIconSize;
const timePilotVersion =
  typeof __TIME_PILOT_VERSION__ === "undefined"
    ? "dev"
    : __TIME_PILOT_VERSION__;
const keyBindingRows: Array<{ binding: BindingAction; label: string }> = [
  { binding: "up", label: i18n.keys.up },
  { binding: "left", label: i18n.keys.left },
  { binding: "down", label: i18n.keys.down },
  { binding: "right", label: i18n.keys.right },
  { binding: "fire", label: i18n.menu.fire },
];
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
const touchKonamiSwipeThreshold = 36;
const menuChevronPixelSize = 3;
const menuChevronBlocks = [
  { x: -4, y: -7 },
  { x: -1, y: -4 },
  { x: 2, y: -1 },
  { x: -1, y: 2 },
  { x: -4, y: 5 },
];

/**
 * Canvas-rendered menu system for root, options, debug, achievements, and pause flows.
 */
class Menus implements MenuSystemInstance {
  private _active = false;
  private _awaitingBinding: BindingAction | null = null;
  private _bindingWarning = "";
  private _commands: MenuSystemCommands;
  private _debugUnlocked = false;
  private _demoWatchStartedAt = 0;
  private _gameArena: GameArenaInstance;
  private _items: MenuItem[] = [];
  private _konamiIndex = 0;
  private _achievementIconSprites: Partial<Record<string, HTMLImageElement>> = {};
  private _achievementLayoutSignature = "";
  private _levelIconSprites: Partial<Record<number, HTMLImageElement>> = {};
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
  private _pendingResetScope: StoredDataResetScope | null = null;
  private _pressedItemDragged = false;
  private _pressStartPointer: MenuPointerData | null = null;
  private _touchScrollDrag:
    | { lastY: number; pointerStartY: number; scrollStarted: boolean }
    | null = null;
  private _scrollBarDrag: { pointerStartY: number; scrollStartY: number } | null = null;
  private _selectedIndex = 0;
  private _shouldRevealSelected = true;
  private _showRestartFromStart = false;
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

  isWatchingDemo = (): boolean => {
    return this._active && this._screen === "demo-watch";
  };

  showStart = (options: ShowStartMenuOptions = {}): void => {
    if (this._active && this._screen === "level") {
      this._commands.clearLevelPreview?.();
    }

    this._active = true;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._startLabel = options.startLabel ?? i18n.menu.start;
    this._showRestartFromStart = options.showRestart ?? false;
    this._screen = "start";
    this._screenHistory = [];
    this._pressedItemIndex = null;
    this._pressedItemDragged = false;
    this._pressStartPointer = null;
    this._touchScrollDrag = null;
    this._scrollBarDrag = null;
    this._selectedIndex = 0;
    this._shouldRevealSelected = true;
    this._levelPreviewedLevel = undefined;
    this._scrollY = 0;
    this._transition = null;
    this._buildItems();
  };

  showRestartConfirm = (): void => {
    if (!this._active) {
      this.showStart({ startLabel: i18n.menu.continue });
    }

    this._goToScreen("restart-confirm");
  };

  showDemoWatch = (): void => {
    const previousScreen = this._screen;

    this._active = true;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._screen = "demo-watch";
    this._screenHistory = [];
    this._pressedItemIndex = null;
    this._pressedItemDragged = false;
    this._pressStartPointer = null;
    this._touchScrollDrag = null;
    this._scrollBarDrag = null;
    this._sliderDragIndex = null;
    this._selectedIndex = 0;
    this._shouldRevealSelected = false;
    this._levelPreviewedLevel = undefined;
    this._scrollY = 0;
    this._buildItems();
    this._demoWatchStartedAt = performance.now();
    this._startTransition(previousScreen, "demo-watch");
  };

  showGameOver = (): void => {
    this._active = true;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._screen = "game-over";
    this._screenHistory = [];
    this._pressedItemIndex = null;
    this._pressedItemDragged = false;
    this._pressStartPointer = null;
    this._touchScrollDrag = null;
    this._scrollBarDrag = null;
    this._selectedIndex = 0;
    this._shouldRevealSelected = true;
    this._levelPreviewedLevel = undefined;
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
    this._pressedItemDragged = false;
    this._pressStartPointer = null;
    this._touchScrollDrag = null;
    this._scrollBarDrag = null;
    this._sliderDragIndex = null;
  };

  next = (): void => {
    if (this.isWatchingDemo()) {
      this._exitDemoWatch();
      return;
    }

    if (!this._active || !this._items.length) {
      return;
    }

    this._selectedIndex = (this._selectedIndex + 1) % this._items.length;
    this._shouldRevealSelected = true;
    this._previewFocusedLevel();
  };

  previous = (): void => {
    if (this.isWatchingDemo()) {
      this._exitDemoWatch();
      return;
    }

    if (!this._active || !this._items.length) {
      return;
    }

    this._selectedIndex =
      (this._selectedIndex - 1 + this._items.length) % this._items.length;
    this._shouldRevealSelected = true;
    this._previewFocusedLevel();
  };

  adjust = (direction: -1 | 1): void => {
    if (this.isWatchingDemo()) {
      this._exitDemoWatch();
      return;
    }

    if (!this._active) {
      return;
    }

    if (this._screen === "achievements") {
      this._refreshAchievementItems();
    }

    const item = this._items[this._selectedIndex];

    if (item?.disabled) {
      return;
    }

    item?.onAdjust?.(direction);
  };

  goBack = (): void => {
    if (this.isWatchingDemo()) {
      this._exitDemoWatch();
      return;
    }

    if (!this._active || this._screen === "start") {
      return;
    }

    this._goBack();
  };

  goToRoot = (): void => {
    if (this.isWatchingDemo()) {
      this._exitDemoWatch();
      return;
    }

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
    this._shouldRevealSelected = true;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._pressedItemDragged = false;
    this._pressStartPointer = null;
    this._touchScrollDrag = null;
    this._scrollBarDrag = null;
    this._sliderDragIndex = null;
    this._scrollY = 0;
    this._buildItems();
    this._startTransition(previousScreen, "start");
    this._levelPreviewedLevel = undefined;
  };

  activate = (): void => {
    if (this.isWatchingDemo()) {
      this._exitDemoWatch();
      return;
    }

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

    if ((item.kind === "enum" || item.kind === "slider") && item.onAdjust) {
      item.onAdjust(-1);
      return;
    }

    item.action?.();
  };

  captureKey = (keyCode: number): boolean => {
    if (!this._active) {
      return false;
    }

    if (this.isWatchingDemo()) {
      this._exitDemoWatch();
      return true;
    }

    if (!this._awaitingBinding && (keyCode === 8 || keyCode === 27)) {
      if (this._screen === "start" && keyCode === 27) {
        if (this._isPausedRootMenu()) {
          this._commands.start();
        }
        return true;
      }

      const previousScreen = this._screen;

      this.goBack();
      return previousScreen !== this._screen;
    }

    if (!this._awaitingBinding) {
      this._captureKonamiInput(keyCode);
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

    if (this.isWatchingDemo()) {
      if (pointer.type !== "move") {
        this._exitDemoWatch();
      }
      return;
    }

    const menuPointer = this._getScaledPointer(pointer);

    if (this._screen === "achievements") {
      this._refreshAchievementItems();
    }

    if (
      pointer.type === "release" &&
      pointer.source === "touch" &&
      this._captureTouchKonamiInput(menuPointer)
    ) {
      this._sliderDragIndex = null;
      this._scrollBarDrag = null;
      this._pressedItemIndex = null;
      this._pressStartPointer = null;
      this._touchScrollDrag = null;
      this._pressedItemDragged = false;
      return;
    }

    if (pointer.type === "wheel") {
      this._scrollBy((pointer.deltaY ?? 0) / this._getMenuScale());
      this._shouldRevealSelected = false;
      return;
    }

    if (pointer.type === "press") {
      this._pressStartPointer = menuPointer;
      this._touchScrollDrag =
        pointer.source === "touch"
          ? {
            lastY: menuPointer.posY,
            pointerStartY: menuPointer.posY,
            scrollStarted: false,
          }
          : null;
    }

    if (pointer.type === "release") {
      const releasedItemIndex = this._items.findIndex((item) =>
        this._isInsideItem(menuPointer, item)
      );
      const pressedItemIndex = this._pressedItemIndex;

      this._sliderDragIndex = null;
      this._scrollBarDrag = null;
      this._pressedItemIndex = null;
      this._pressStartPointer = null;
      this._touchScrollDrag = null;
      const wasDragged = this._pressedItemDragged;
      this._pressedItemDragged = false;

      if (
        pressedItemIndex !== null &&
        releasedItemIndex === pressedItemIndex &&
        (this._items[pressedItemIndex].kind !== "slider" || !wasDragged)
      ) {
        this._selectedIndex = pressedItemIndex;
        this.activate();
      }

      return;
    }

    if (pointer.type === "drag" && this._scrollBarDrag) {
      this._pressedItemDragged = true;
      this._setScrollFromThumbDrag(menuPointer.posY);
      this._shouldRevealSelected = false;
      return;
    }

    if (pointer.type === "drag" && pointer.source === "touch") {
      if (this._handleTouchScrollDrag(menuPointer)) {
        return;
      }
    }

    if (pointer.type === "drag" && this._sliderDragIndex !== null) {
      const item = this._items[this._sliderDragIndex];
      this._pressedItemDragged = true;

      if (!item.disabled) {
        this._setSliderFromPointer(item, menuPointer);
      }
      return;
    }

    if (pointer.type === "press" && this._isInsideScrollThumb(menuPointer)) {
      this._scrollBarDrag = {
        pointerStartY: menuPointer.posY,
        scrollStartY: this._scrollY,
      };
      this._pressedItemIndex = null;
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
      this._pressedItemDragged = false;

      if (
        this._items[itemIndex].kind === "slider" &&
        !this._items[itemIndex].disabled
      ) {
        this._sliderDragIndex = itemIndex;
      }

      return;
    }

    if (pointer.type === "click") {
      if (this._items[itemIndex].kind === "slider") {
        if (this._items[itemIndex].disabled) {
          return;
        }

        this.activate();
        return;
      }

      this.activate();
    }
  };

  render = (options: MenuRenderOptions = {}): void => {
    if (!this._active) {
      return;
    }

    const renderLogo = options.renderLogo ?? true;
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const menuScale = this._getMenuScale();
    const backplateOpacity = 1;

    if (this._screen !== "demo-watch" && backplateOpacity > 0) {
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
    context.scale(menuScale, menuScale);
    if (renderLogo) {
      this._renderLogo(context, layout.logoY, layout.logoScale);
    }

    if (this._shouldRenderScreenTitle()) {
      const titleOpacity = this._getScreenTitleOpacity();
      context.save();
      context.globalAlpha *= titleOpacity;
      if (titleOpacity > 0.01) {
        this._gameArena.renderText(this._getRenderedScreenTitle(), 0, layout.titleY, {
          size: 18,
          align: "center",
          valign: "middle",
          color: palette.menu.mutedText,
        });
      }
      context.restore();
    } else if (this._isPausedRootMenu()) {
      this._gameArena.renderText(i18n.hud.paused, 0, -42, {
        size: 18,
        align: "center",
        valign: "middle",
        color: palette.menu.mutedText,
      });
    }

    if (this._screen === "achievements") {
      this._refreshAchievementItems();
    }

    this._scrollY = this._getMenuScrollY(this._shouldRevealSelected);
    if (transition.progress >= 1) {
      this._shouldRevealSelected = false;
    }
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

    if (this._screen === "start") {
      this._renderBuildNumber(menuScale);
    }
    context.restore();
  };

  private _renderBuildNumber = (menuScale: number): void => {
    this._gameArena.renderText(
      `v${timePilotVersion}`,
      this._gameArena.width / (2 * menuScale) - 12 / menuScale,
      this._gameArena.height / (2 * menuScale) - 10 / menuScale,
      {
        size: 10,
        align: "right",
        valign: "bottom",
        color: palette.menu.mutedText,
      }
    );
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
    const viewport = this._getItemsViewport();
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
      if (this._screen === "achievements" && item.achievement) {
        this._renderAchievementItem(item, index === this._selectedIndex);
        return;
      }

      this._renderItem(item, index === this._selectedIndex);
    });

    context.restore();

    this._renderScrollIndicator(context, viewport);

    if (this._screen === "options") {
      this._renderPovZoomPreview();
    }

    if (this._screen === "level") {
      this._renderLevelBlurb();
      this._renderLevelShowcase();
    }

    if (this._screen === "filter-custom") {
      this._renderCustomFilterDescription();
    }

    if (this._screen === "debug-reset-confirm") {
      this._renderResetWarning();
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
    } else if (this._screen === "demo-watch") {
      this._items = [];
    } else if (this._screen === "options") {
      this._items = this._createOptionsItems();
    } else if (this._screen === "achievements") {
      this._items = this._createAchievementItems();
    } else if (this._screen === "filters") {
      this._items = this._createFilterItems();
    } else if (this._screen === "filter-custom") {
      this._items = this._createCustomFilterItems();
    } else if (this._screen === "controls") {
      this._items = this._createControlsItems();
    } else if (this._screen === "language") {
      this._items = this._createLanguageItems();
    } else if (this._screen === "game-over") {
      this._items = this._createGameOverItems();
    } else if (this._screen === "restart-confirm") {
      this._items = this._createRestartConfirmItems();
    } else if (this._screen === "debug") {
      this._items = this._createDebugItems();
    } else if (this._screen === "debug-reset") {
      this._items = this._createDebugResetItems();
    } else if (this._screen === "debug-reset-confirm") {
      this._items = this._createDebugResetConfirmItems();
    } else {
      this._items = this._createLevelItems();
    }
  };

  private _createStartItems = (): MenuItem[] => {
    let itemY = -22;
    const items = [
      this._createItem(this._startLabel, "action", -22, {
        action: this._commands.start,
      }),
    ];

    const showWatchDemo = this._commands.canWatchDemo?.() ?? false;
    const showUpdate =
      !this._isPausedRootMenu() && (this._commands.canApplyUpdate?.() ?? false);
    itemY += 50;

    if (this._showRestartFromStart) {
      items.push(
        this._createItem(i18n.menu.restart, "action", itemY, {
          action: () =>
            (this._commands.startNewGame ?? this._commands.restart)?.(),
        })
      );
      itemY += 50;
    }

    items.push(
      this._createItem(i18n.menu.options, "action", itemY, {
        action: () => this._goToScreen("options"),
        opensSubmenu: true,
      })
    );
    itemY += 50;

    items.push(
      this._createItem(i18n.menu.achievements, "action", itemY, {
        action: () => this._goToScreen("achievements"),
        opensSubmenu: true,
      })
    );
    itemY += 50;

    if (this._debugUnlocked) {
      items.push(
        this._createItem(i18n.menu.debug, "action", itemY, {
          action: () => this._goToScreen("debug"),
          opensSubmenu: true,
        })
      );
      itemY += 50;
    }

    if (showWatchDemo) {
      items.push(
        this._createItem(
          i18n.menu.watchDemo,
          "action",
          itemY,
          {
            action: () => {
              this._commands.watchDemo?.();
              this.showDemoWatch();
            },
          }
        )
      );
      itemY += 50;
    }

    if (showUpdate) {
      items.push(
        this._createItem(i18n.menu.update, "action", itemY, {
          action: () => this._commands.applyUpdate?.(),
        })
      );
      itemY += 50;
    }

    if (this._commands.exitApp) {
      items.push(
        this._createItem(i18n.menu.exit, "action", itemY, {
          action: () => this._commands.exitApp?.(),
        })
      );
    }

    return items;
  };

  private _createAchievementItems = (): MenuItem[] => {
    const achievements = this._commands.getAchievements?.() ?? [];
    const layout = this._getAchievementGridLayout();
    const rows = Math.ceil(achievements.length / layout.columns);

    return [
      ...achievements.map((achievement, index) => {
        const column = index % layout.columns;
        const row = Math.floor(index / layout.columns);
        const x = layout.startX + column * (layout.cardWidth + achievementCardGap);
        const y = layout.startY + row * (achievementCardHeight + achievementCardGap);

        return this._createItem(achievement.name, "action", y, {
          achievement,
          rect: {
            x,
            y,
            width: layout.cardWidth,
            height: achievementCardHeight,
          },
        });
      }),
      this._createItem(
        i18n.menu.back,
        "action",
        layout.startY + rows * (achievementCardHeight + achievementCardGap) + 10,
        {
          action: () => this._goBack(),
        }
      ),
    ];
  };

  private _createOptionsItems = (): MenuItem[] => {
    const showControlType = this._shouldShowControlTypeOption();
    const showWakeLock = this._commands.canUseScreenWakeLock?.() ?? false;
    let itemY = -54;
    const nextItemY = (): number => {
      const y = itemY;

      itemY += 42;
      return y;
    };
    const items: MenuItem[] = [
      this._createItem(i18n.menu.masterVolume, "slider", nextItemY(), {
        getValue: () => `${userOptions.masterVolume}`,
        onAdjust: (direction) => this._adjustVolume("masterVolume", direction),
        onSetValue: (value) => this._setVolume("masterVolume", value),
      }),
      this._createItem(i18n.menu.musicVolume, "slider", nextItemY(), {
        getValue: () => `${userOptions.musicVolume}`,
        onAdjust: (direction) => this._adjustVolume("musicVolume", direction),
        onSetValue: (value) => this._setVolume("musicVolume", value),
      }),
      this._createItem(i18n.menu.effectsVolume, "slider", nextItemY(), {
        getValue: () => `${userOptions.effectsVolume}`,
        onAdjust: (direction) => this._adjustVolume("effectsVolume", direction),
        onSetValue: (value) => this._setVolume("effectsVolume", value),
      }),
      this._createItem(i18n.menu.uiZoom, "slider", nextItemY(), {
        getValue: () => formatUiZoom(),
        onAdjust: (direction) => this.adjustUiZoom(direction),
        onSetValue: (value) => this._setUiZoom(this._getZoomValueFromStep(value)),
        sliderSteps: this._getZoomSliderSteps(),
      }),
      this._createItem(i18n.menu.gameZoom, "slider", nextItemY(), {
        getValue: () => formatGameZoom(),
        onAdjust: (direction) => this._adjustGameZoom(direction),
        onSetValue: (value) => this._setGameZoom(this._getZoomValueFromStep(value)),
        sliderSteps: this._getZoomSliderSteps(),
      }),
      this._createItem(i18n.menu.filters, "action", nextItemY(), {
        getValue: () => filterModeLabels[userOptions.videoFilterMode],
        action: () => this._goToScreen("filters"),
        opensSubmenu: true,
      }),
      this._createItem(i18n.menu.fullScreen, "toggle", nextItemY(), {
        disabled:
          this._gameArena.isFullScreenLocked() ||
          !this._gameArena.canToggleFullScreen(),
        getValue: () =>
          this._gameArena.isFullScreen() ? i18n.menu.on : i18n.menu.off,
        onAdjust: () => this._gameArena.toggleFullScreen(),
      }),
    ];

    if (showWakeLock) {
      items.push(
        this._createItem(i18n.menu.keepScreenAwake, "toggle", nextItemY(), {
          getValue: () =>
            userOptions.keepScreenAwake ? i18n.menu.on : i18n.menu.off,
          onAdjust: () => this._toggleKeepScreenAwake(),
        })
      );
    }

    if (this._shouldShowTouchSteeringOverlayOption()) {
      items.push(
        this._createItem(i18n.menu.touchSteeringOverlay, "toggle", nextItemY(), {
          getValue: () =>
            userOptions.touchSteeringOverlay ? i18n.menu.on : i18n.menu.off,
          onAdjust: () =>
            userOptions.setOption(
              "touchSteeringOverlay",
              !userOptions.touchSteeringOverlay
            ),
        })
      );
    }

    items.push(
      this._createToggleItem(
        i18n.menu.showControlsOverlay,
        "showControlsOverlay",
        nextItemY()
      ),
      this._createItem(i18n.menu.language, "action", nextItemY(), {
        getValue: () => getLanguageName(userOptions.language),
        languageFlag: userOptions.language,
        action: () => this._goToScreen("language"),
        opensSubmenu: true,
      })
    );

    if (showControlType) {
      items.push(
        this._createItem(i18n.menu.controlType, "enum", nextItemY(), {
          getValue: () =>
            userOptions.controllerType === "keyboard1"
              ? i18n.menu.directional
              : i18n.menu.rotate,
          onAdjust: (direction) => this._adjustControllerType(direction),
        })
      );
    }

    items.push(
      this._createItem(i18n.menu.back, "action", itemY + 8, {
        action: () => this._goBack(),
      })
    );

    return items;
  };

  private _shouldShowControlTypeOption = (): boolean => {
    const url = new URL(window.location.href);

    return url.searchParams.get("showControlType") === "true";
  };

  private _shouldShowTouchSteeringOverlayOption = (): boolean => {
    return (
      navigator.maxTouchPoints > 0 ||
      window.matchMedia?.("(pointer: coarse)").matches === true
    );
  };

  private _createFilterItems = (): MenuItem[] => {
    return [
      this._createItem(i18n.menu.videoFilterMode, "enum", -54, {
        getValue: () => filterModeLabels[userOptions.videoFilterMode],
        onAdjust: (direction) => this._adjustFilterMode(direction),
      }),
      this._createItem(i18n.menu.customCrtOptions, "action", -12, {
        action: () => this._goToScreen("filter-custom"),
        opensSubmenu: true,
      }),
      this._createItem(i18n.menu.resetFilters, "action", 30, {
        action: () => this._resetFilters(),
      }),
      this._createItem(i18n.menu.back, "action", 80, {
        action: () => this._goBack(),
      }),
    ];
  };

  private _createCustomFilterItems = (): MenuItem[] => {
    const items = filterSettingKeys.map((key, index) =>
      this._createItem(filterSettingLabels[key], "slider", -54 + index * 42, {
        description: filterSettingDescriptions[key],
        getValue: () => `${this._getEditableFilterSettings()[key]}`,
        onAdjust: (direction) =>
          this._setFilterSetting(
            key,
            this._getEditableFilterSettings()[key] + direction
          ),
        onSetValue: (value) => this._setFilterSetting(key, value),
        sliderSteps: 100,
      })
    );

    items.push(
      this._createItem(
        i18n.menu.back,
        "action",
        -4 + filterSettingKeys.length * 42,
        {
          action: () => this._goBack(),
        }
      )
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

  private _createRestartConfirmItems = (): MenuItem[] => {
    return [
      this._createItem(i18n.menu.restart, "action", -12, {
        action: () => this._commands.restart?.(),
      }),
      this._createItem(i18n.menu.cancel, "action", 38, {
        action: () => this._goBack(),
      }),
    ];
  };

  private _createGameOverItems = (): MenuItem[] => {
    const continues = this._commands.getContinues?.() ?? 0;
    const canContinue = continues > 0;

    return [
      this._createItem(
        canContinue ? i18n.menu.continue : i18n.menu.restart,
        "action",
        -12,
        {
          action: () =>
            canContinue
              ? this._commands.continueGame?.()
              : this._commands.restart?.(),
        }
      ),
      this._createItem(i18n.menu.exit, "action", 38, {
        action: () => this._commands.exitToRoot?.(),
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
        -42 + enabledLevels.length * 42,
        {
          action: () => this._goBack(),
          rect: {
            x: -110,
            y: -42 + enabledLevels.length * 42,
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
        i18n.menu.showCoordinates,
        "showPlayerCoordinates",
        30
      ),
      this._createToggleItem(
        i18n.menu.showHeadingVectors,
        "showHeadingVectors",
        72
      ),
      this._createToggleItem(
        i18n.menu.showSteeringArc,
        "showSteeringArc",
        114
      ),
      this._createItem(i18n.menu.logLevel, "enum", 156, {
        getValue: () => i18n.menu.logLevels[userOptions.logLevel],
        onAdjust: (direction) => this._adjustLogLevel(direction),
      }),
      this._createItem(i18n.menu.lives, "slider", 198, {
        getValue: () => `${userOptions.debugLives}`,
        onAdjust: (direction) =>
          this._setDebugLives(userOptions.debugLives + direction),
        onSetValue: (value) => this._setDebugLives(value),
        sliderMin: 1,
        sliderSteps: 99,
      }),
      this._createItem(i18n.menu.continues, "slider", 240, {
        getValue: () => `${userOptions.debugContinues}`,
        onAdjust: (direction) =>
          this._setDebugContinues(userOptions.debugContinues + direction),
        onSetValue: (value) => this._setDebugContinues(value),
        sliderMin: 0,
        sliderSteps: 99,
      }),
      this._createItem(i18n.menu.selectLevel, "action", 282, {
        action: () => this._goToScreen("level"),
        getValue: () => this._getSelectedLevelLabel(),
        opensSubmenu: true,
      }),
      this._createItem(i18n.menu.playPreroll, "action", 332, {
        action: () => this._commands.playPreroll?.(),
      }),
      this._createItem(i18n.menu.resetData, "action", 382, {
        action: () => this._goToScreen("debug-reset"),
        opensSubmenu: true,
      }),
      this._createItem(i18n.menu.back, "action", 432, {
        action: () => this._goBack(),
      }),
    ];
  };

  private _createDebugResetItems = (): MenuItem[] => {
    return [
      this._createItem(i18n.menu.resetPreferences, "action", -54, {
        action: () => this._showResetConfirm("preferences"),
        opensSubmenu: true,
      }),
      this._createItem(i18n.menu.resetScores, "action", -12, {
        action: () => this._showResetConfirm("scores"),
        opensSubmenu: true,
      }),
      this._createItem(i18n.menu.resetAchievements, "action", 30, {
        action: () => this._showResetConfirm("achievements"),
        opensSubmenu: true,
      }),
      this._createItem(i18n.menu.resetAllStoredData, "action", 72, {
        action: () => this._showResetConfirm("all"),
        opensSubmenu: true,
      }),
      this._createItem(i18n.menu.back, "action", 122, {
        action: () => this._goBack(),
      }),
    ];
  };

  private _createDebugResetConfirmItems = (): MenuItem[] => {
    return [
      this._createItem(i18n.menu.confirmReset, "action", 38, {
        action: () => this._confirmReset(),
      }),
      this._createItem(i18n.menu.cancel, "action", 88, {
        action: () => this._cancelReset(),
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
    const isBackItem = item.label === i18n.menu.back;
    const labelInset = isBackItem ? 30 : 14;

    this._gameArena.renderText(
      item.label,
      item.rect.x + labelInset,
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
          (item.opensSubmenu
            ? 34
            : item.languageFlag || item.levelIcon
              ? 48
              : 14),
        item.rect.y + item.rect.height / 2,
        {
          size: item.kind === "key" ? 13 : 16,
          align: "right",
          valign: "middle",
          color,
        }
      );
    }

    this._renderItemChevron(item, color);
  };

  private _renderItemChevron = (item: MenuItem, color: string): void => {
    const isBackItem = item.label === i18n.menu.back;

    if (!item.opensSubmenu && !isBackItem) {
      return;
    }

    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const centerY = item.rect.y + item.rect.height / 2;
    const chevronX = isBackItem
      ? item.rect.x + 15
      : item.rect.x + item.rect.width - 16;
    const direction = isBackItem ? -1 : 1;

    context.save();
    context.fillStyle = color;
    menuChevronBlocks.forEach((block) => {
      context.fillRect(
        chevronX + block.x * direction,
        centerY + block.y,
        menuChevronPixelSize,
        menuChevronPixelSize
      );
    });
    context.restore();
  };

  private _renderAchievementItem = (
    item: MenuItem,
    isSelected: boolean
  ): void => {
    const achievement = item.achievement;

    if (!achievement) {
      return;
    }

    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const padding = 8;
    const iconX = item.rect.x + padding;
    const iconY = item.rect.y + (item.rect.height - achievementIconRenderSize) / 2;
    const textX = iconX + achievementIconRenderSize + 8;
    const textWidth =
      item.rect.width - padding * 2 - achievementIconRenderSize - 8;
    const progress = achievement.progress
      ? Math.max(
        0,
        Math.min(1, achievement.progress.current / achievement.progress.goal)
      )
      : null;

    context.fillStyle = achievement.unlocked
      ? palette.menu.itemBackground
      : palette.menu.disabledBackground;
    context.fillRect(
      item.rect.x,
      item.rect.y,
      item.rect.width,
      item.rect.height
    );

    context.strokeStyle = isSelected
      ? palette.menu.selectedBorder
      : achievement.unlocked
        ? palette.menu.itemBorder
        : palette.menu.disabledBorder;
    context.lineWidth = 2;
    context.strokeRect(
      item.rect.x,
      item.rect.y,
      item.rect.width,
      item.rect.height
    );

    this._renderAchievementIcon(achievement, iconX, iconY);

    this._gameArena.renderText(achievement.name, textX, item.rect.y + 10, {
      size: 9,
      align: "left",
      valign: "top",
      color: achievement.unlocked
        ? palette.menu.selectedBackground
        : palette.menu.disabledText,
    });

    this._wrapText(
      achievement.description,
      Math.max(12, Math.floor(textWidth / 5))
    ).slice(0, 2).forEach((line, index) => {
      this._gameArena.renderText(line, textX, item.rect.y + 28 + index * 10, {
        size: 7,
        align: "left",
        valign: "top",
        color: achievement.unlocked
          ? palette.menu.itemText
          : palette.menu.disabledText,
      });
    });

    if (!achievement.progress || progress === null) {
      return;
    }

    const barX = textX;
    const barY = item.rect.y + item.rect.height - 11;
    const label = `${achievement.progress.current}/${achievement.progress.goal}`;
    const labelWidth = 42;
    const barWidth = Math.max(24, textWidth - labelWidth - 6);

    context.fillStyle = palette.menu.disabledBackground;
    context.fillRect(barX, barY, barWidth, 5);
    context.fillStyle = achievement.unlocked
      ? palette.menu.selectedBackground
      : palette.menu.progressFill;
    context.fillRect(barX, barY, barWidth * progress, 5);
    context.strokeStyle = palette.menu.itemBorder;
    context.lineWidth = 1;
    context.strokeRect(barX, barY, barWidth, 5);

    this._gameArena.renderText(label, barX + barWidth + 6, barY + 2, {
      size: 7,
      align: "left",
      valign: "middle",
      color: achievement.unlocked
        ? palette.menu.itemText
        : palette.menu.disabledText,
    });
  };

  private _renderAchievementIcon = (
    achievement: AchievementStatus,
    x: number,
    y: number
  ): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const sprite = this._getAchievementIconSprite(achievement);
    const frameX = achievement.unlocked
      ? achievement.icon.unlockedFrameX
      : achievement.icon.lockedFrameX;

    context.imageSmoothingEnabled = false;

    if (!sprite.complete || sprite.naturalWidth <= 0 || sprite.naturalHeight <= 0) {
      this._renderAchievementIconPlaceholder(achievement, x, y);
      return;
    }

    try {
      context.drawImage(
        sprite,
        frameX * achievement.icon.frameWidth,
        0,
        achievement.icon.frameWidth,
        achievement.icon.frameHeight,
        x,
        y,
        achievementIconRenderSize,
        achievementIconRenderSize
      );
    } catch {
      this._renderAchievementIconPlaceholder(achievement, x, y);
    }
  };

  private _renderAchievementIconPlaceholder = (
    achievement: AchievementStatus,
    x: number,
    y: number
  ): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const centerX = x + achievementIconRenderSize / 2;
    const centerY = y + achievementIconRenderSize / 2;
    const radius = achievementIconRenderSize / 2 - 5;

    context.fillStyle = achievement.unlocked
      ? palette.menu.progressFill
      : palette.menu.disabledBackground;
    context.fillRect(x, y, achievementIconRenderSize, achievementIconRenderSize);
    context.strokeStyle = achievement.unlocked
      ? palette.menu.selectedBorder
      : palette.menu.disabledBorder;
    context.lineWidth = 2;
    context.strokeRect(x, y, achievementIconRenderSize, achievementIconRenderSize);
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.stroke();
  };

  private _getAchievementIconSprite = (
    achievement: AchievementStatus
  ): HTMLImageElement => {
    const cachedSprite = this._achievementIconSprites[achievement.icon.src];

    if (cachedSprite) {
      return cachedSprite;
    }

    const sprite = new Image();
    sprite.src = achievement.icon.src;
    this._achievementIconSprites[achievement.icon.src] = sprite;

    return sprite;
  };

  private _renderLevelBlurb = (): void => {
    const level = this._getBlurbLevel();
    const levelMessages = i18n.levels as Record<number, LevelBlurb>;
    const blurb = levelMessages[level];

    if (!blurb) {
      return;
    }

    const x = -260;
    let y = -54;
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
    let y = -58;

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
      const projectileX = x + 46;
      const textX = x + (entry.projectile ? 84 : 46);

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

      if (entry.projectile) {
        this._renderLevelShowcaseProjectile(
          entry.projectile,
          projectileX,
          y
        );
      }

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

  private _renderCustomFilterDescription = (): void => {
    const item = this._items[this._selectedIndex];

    if (!item?.description) {
      return;
    }

    const x = -390;
    const y = -54;
    const lines = this._wrapText(item.description, 28);

    this._gameArena.renderText(item.label, x, y, {
      size: 14,
      align: "left",
      valign: "middle",
      color: palette.menu.selectedBackground,
    });

    lines.forEach((line, index) => {
      this._gameArena.renderText(line, x, y + 24 + index * 18, {
        size: 12,
        align: "left",
        valign: "middle",
        color: palette.menu.itemText,
      });
    });
  };

  private _renderResetWarning = (): void => {
    const lines = this._wrapText(
      i18n.menu.resetWarning(this._getResetWarningScopeLabel()),
      36
    );

    lines.forEach((line, index) => {
      this._gameArena.renderText(line, 0, -74 + index * 18, {
        size: index === 0 ? 15 : 13,
        align: "center",
        valign: "middle",
        color: index === 0 ? palette.menu.waitingText : palette.menu.mutedText,
      });
    });
  };

  private _getResetWarningScopeLabel = (): string => {
    if (this._pendingResetScope === "preferences") {
      return i18n.menu.resetWarningPreferences;
    }

    if (this._pendingResetScope === "scores") {
      return i18n.menu.resetWarningScores;
    }

    if (this._pendingResetScope === "achievements") {
      return i18n.menu.resetWarningAchievements;
    }

    return i18n.menu.resetWarningAllStoredData;
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
        levelConfig.enemies.basic,
        levelConfig.enemies.basic.projectile
      ),
    ];

    if (levelConfig.enemies.specialBomber) {
      entries.push(
        this._getEnemyShowcaseEntry(
          `${level}-special`,
          labels.special.label,
          labels.special.description,
          levelConfig.enemies.specialBomber,
          levelConfig.enemies.specialBomber.projectile
        )
      );
    }

    entries.push(
      this._getEnemyShowcaseEntry(
        `${level}-boss`,
        labels.boss.label,
        labels.boss.description,
        levelConfig.enemies.boss,
        levelConfig.enemies.boss.projectile
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
    enemyConfig: EnemyConfig,
    projectileConfig?: ProjectileConfig
  ): LevelShowcaseEntry => ({
    description,
    frame: this._getLevelShowcaseEnemyFrame(enemyConfig),
    frameHeight: enemyConfig.height,
    frameWidth: enemyConfig.width,
    key,
    label,
    projectile: projectileConfig
      ? this._getProjectileShowcaseEntry(projectileConfig)
      : undefined,
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

    if (enemyConfig.damageFrames) {
      return {
        x: tick % enemyConfig.damageFrames,
        y: enemyConfig.animationRows
          ? Math.floor(tick / 2) % enemyConfig.animationRows
          : 0,
      };
    }

    if (enemyConfig.bossDamageFrames) {
      return {
        x: tick % enemyConfig.bossDamageFrames,
        y: enemyConfig.animationRows
          ? Math.floor(tick / 2) % enemyConfig.animationRows
          : 0,
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

  private _getProjectileShowcaseEntry = (
    projectileConfig: ProjectileConfig
  ): LevelShowcaseProjectile => {
    const projectileType = this._getProjectileType(projectileConfig);
    const projectileLabels = i18n.menu.levelShowcase.projectiles;
    const spriteConfig = projectileConfig.sprite;

    if (spriteConfig) {
      const tick = Math.floor(performance.now() / levelShowcaseFrameDuration);
      const frameCount = spriteConfig.frames ?? 1;

      return {
        color: projectileConfig.color,
        frame: {
          x: spriteConfig.frameAxis === "y" ? 0 : tick % frameCount,
          y: spriteConfig.frameAxis === "y" ? tick % frameCount : 0,
        },
        frameHeight: spriteConfig.height,
        frameWidth: spriteConfig.width,
        label: projectileLabels[projectileType],
        renderHeight: spriteConfig.renderHeight,
        renderWidth: spriteConfig.renderWidth,
        spriteSrc: spriteConfig.sprite.src,
      };
    }

    return {
      color: projectileConfig.color,
      frame: { x: 0, y: 0 },
      frameHeight: projectileConfig.size,
      frameWidth: projectileConfig.size,
      label: projectileLabels[projectileType],
      renderHeight: projectileConfig.size,
      renderWidth: projectileConfig.size,
    };
  };

  private _getProjectileType = (
    projectileConfig: ProjectileConfig
  ): "bomb" | "bullet" | "plasma" | "rocket" => {
    const spriteSrc = projectileConfig.sprite?.sprite.src ?? "";

    if (spriteSrc.includes("rocket")) {
      return "rocket";
    }

    if (spriteSrc.includes("bomb")) {
      return "bomb";
    }

    if (spriteSrc.includes("plasma")) {
      return "plasma";
    }

    if (projectileConfig.velocity >= levels[5].enemies.basic.projectile.velocity) {
      return "plasma";
    }

    return "bullet";
  };

  private _renderLevelShowcaseProjectile = (
    projectile: LevelShowcaseProjectile,
    x: number,
    y: number
  ): void => {
    const context = this._gameArena.getContext() as CanvasRenderingContext2D;
    const baseRenderWidth = projectile.renderWidth ?? projectile.frameWidth;
    const baseRenderHeight = projectile.renderHeight ?? projectile.frameHeight;
    const renderWidth = Math.max(1, Math.round(baseRenderWidth));
    const renderHeight = Math.max(1, Math.round(baseRenderHeight));
    const centerX = x + 12;
    const centerY = y + 13;

    if (projectile.spriteSrc) {
      const sprite = this._getLevelShowcaseSprite(
        `${projectile.label}-${projectile.spriteSrc}`,
        projectile.spriteSrc
      );

      context.drawImage(
        sprite,
        projectile.frame.x * projectile.frameWidth,
        projectile.frame.y * projectile.frameHeight,
        projectile.frameWidth,
        projectile.frameHeight,
        Math.round(centerX - renderWidth / 2),
        Math.round(centerY - renderHeight / 2),
        renderWidth,
        renderHeight
      );
    } else {
      const radius = Math.max(2, Math.round(renderWidth / 2));

      context.save();
      context.fillStyle = projectile.color;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    this._gameArena.renderText(projectile.label, centerX, y + 28, {
      size: 7,
      align: "center",
      valign: "top",
      color: palette.menu.mutedText,
    });
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
    return this._getFocusedLevel();
  };

  private _getFocusedLevel = (): number => {
    const focusedLevel = this._items[this._selectedIndex]?.levelIcon;

    if (focusedLevel) {
      return focusedLevel;
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

    if (enemyConfig.damageFrames) {
      return {
        x: 0,
        y: tick % (enemyConfig.animationRows ?? 1),
      };
    }

    if (enemyConfig.animationRows && enemyConfig.horizontalDirectionFrames) {
      return {
        x: 0,
        y: tick % enemyConfig.animationRows,
      };
    }

    if (enemyConfig.animationRows) {
      return {
        x: enemyConfig.canRotate
          ? this._getDirectionalFrameForHeading(enemyConfig, 90)
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

  private _getDirectionalFrameForHeading = (
    enemyConfig: EnemyConfig,
    heading: number
  ): number => {
    return Math.floor(
      ((heading + (enemyConfig.headingFrameOffset ?? 0) + 360) % 360) / 22.5
    );
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
    const drawUnionFlag = (): void => {
      for (let gridY = 0; gridY < 8; gridY++) {
        for (let gridX = 0; gridX < 16; gridX++) {
          drawUnionFlagPixel(gridX, gridY);
        }
      }
    };
    const drawUsFlag = (): void => {
      for (let gridY = 0; gridY < 8; gridY++) {
        for (let gridX = 0; gridX < 16; gridX++) {
          drawUsFlagPixel(gridX, gridY);
        }
      }
    };
    const drawWithAlpha = (alpha: number, draw: () => void): void => {
      context.save();
      context.globalAlpha *= alpha;
      draw();
      context.restore();
    };
    const drawAlternatingFlag = (
      primary: () => void,
      secondary: () => void
    ): void => {
      const cycleDuration =
        alternatingFlagHoldDuration * 2 + alternatingFlagFadeDuration * 2;
      const elapsed = performance.now() % cycleDuration;

      if (elapsed < alternatingFlagHoldDuration) {
        primary();
        return;
      }

      if (elapsed < alternatingFlagHoldDuration + alternatingFlagFadeDuration) {
        const progress =
          (elapsed - alternatingFlagHoldDuration) /
          alternatingFlagFadeDuration;
        primary();
        drawWithAlpha(progress, secondary);
        return;
      }

      if (
        elapsed <
        alternatingFlagHoldDuration * 2 + alternatingFlagFadeDuration
      ) {
        secondary();
        return;
      }

      const progress =
        (elapsed -
          alternatingFlagHoldDuration * 2 -
          alternatingFlagFadeDuration) /
        alternatingFlagFadeDuration;
      secondary();
      drawWithAlpha(progress, primary);
    };
    const drawSpanishFlag = (): void => {
      horizontalTricolor(["#AA151B", "#F1BF00", "#AA151B"]);
    };
    const drawMexicanFlag = (): void => {
      verticalTricolor(["#006847", "#FFFFFF", "#CE1126"]);
      rect(7, 3, 2, 2, "#8C5A2B");
      rect(8, 2, 1, 1, "#006847");
      rect(7, 5, 2, 1, "#CE1126");
    };
    const drawEnglishFlag = (): void => {
      drawAlternatingFlag(drawUnionFlag, drawUsFlag);
    };
    const drawSpanishLanguageFlag = (): void => {
      drawAlternatingFlag(drawSpanishFlag, drawMexicanFlag);
    };

    if (language === "fr") {
      verticalTricolor(["#0055A4", "#FFFFFF", "#EF4135"]);
      return;
    }

    if (language === "es") {
      drawSpanishLanguageFlag();
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

    if (item.label === i18n.menu.uiZoom || item.label === i18n.menu.gameZoom) {
      return Math.max(
        0,
        Math.min(1, (value - zoomMinPercent) / (zoomMaxPercent - zoomMinPercent))
      );
    }

    const sliderMin = item.sliderMin ?? 0;
    const sliderMax = item.sliderSteps ?? 10;

    return Math.max(0, Math.min(1, (value - sliderMin) / (sliderMax - sliderMin)));
  };

  private _setSliderFromPointer = (
    item: MenuItem,
    pointer: MenuPointerData
  ): void => {
    if (item.disabled || !item.onSetValue) {
      return;
    }

    const progress = Math.max(
      0,
      Math.min(1, (pointer.posX - item.rect.x) / item.rect.width)
    );

    const sliderMin = item.sliderMin ?? 0;
    const sliderMax = item.sliderSteps ?? 10;

    item.onSetValue(Math.round(sliderMin + progress * (sliderMax - sliderMin)));
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

  private _getItemsViewport = (): MenuViewport => {
    const viewport = this._getMenuViewport();
    const headerBottom = this._getHeaderBottomY() + 16;
    const minHeight = 64;
    const y = Math.min(
      Math.max(viewport.y, headerBottom),
      viewport.y + viewport.height - minHeight
    );

    return {
      ...viewport,
      y,
      height: viewport.y + viewport.height - y,
    };
  };

  private _getAchievementGridLayout = (): {
    cardWidth: number;
    columns: number;
    signature: string;
    startX: number;
    startY: number;
  } => {
    const viewport = this._getItemsViewport();
    const availableWidth = Math.max(160, viewport.width - 14);
    const columns = Math.max(
      1,
      Math.min(
        3,
        Math.floor(
          (availableWidth + achievementCardGap) /
            (achievementCardWidth + achievementCardGap)
        )
      )
    );
    const cardWidth = Math.min(achievementCardWidth, availableWidth);
    const totalWidth = cardWidth * columns + achievementCardGap * (columns - 1);

    return {
      cardWidth,
      columns,
      signature: `${columns}:${Math.round(cardWidth)}:${Math.round(viewport.width)}`,
      startX: -totalWidth / 2,
      startY: -54,
    };
  };

  private _refreshAchievementItems = (): void => {
    const layout = this._getAchievementGridLayout();
    const achievements = this._commands.getAchievements?.() ?? [];
    const achievementSignature = achievements
      .map((achievement) =>
        [
          achievement.id,
          achievement.unlocked ? "1" : "0",
          achievement.progress?.current ?? "",
          achievement.progress?.goal ?? "",
        ].join(":")
      )
      .join("|");
    const signature = `${layout.signature}:${achievementSignature}`;

    if (signature === this._achievementLayoutSignature) {
      return;
    }

    this._achievementLayoutSignature = signature;
    this._items = this._createAchievementItems();
    this._selectedIndex = Math.min(this._selectedIndex, this._items.length - 1);
    this._scrollY = this._clampScrollY(this._scrollY);
  };

  private _getHeaderBottomY = (): number => {
    const logoBottom =
      this._getLogoY(this._screen) + (86 * this._getLogoScale(this._screen)) / 2;

    if (this._screen === "start") {
      return this._isPausedRootMenu()
        ? Math.max(logoBottom, -42 + 16)
        : logoBottom;
    }

    return Math.max(logoBottom, this._getTitleY(this._screen) + 18);
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

  private _getMenuScrollY = (revealSelected: boolean): number => {
    const selectedItem = this._items[this._selectedIndex];

    if (!selectedItem) {
      return 0;
    }

    const viewport = this._getItemsViewport();
    const viewportTop = viewport.y;
    const viewportBottom = viewport.y + viewport.height;
    const bounds = this._getItemsBounds();
    const screenOffset = this._getScreenItemOffset(this._screen);

    let scrollY = this._scrollY;

    if (revealSelected) {
      const selectedTop = selectedItem.rect.y + screenOffset + scrollY;
      const selectedBottom = selectedTop + selectedItem.rect.height;

      if (selectedTop < viewportTop) {
        scrollY += viewportTop - selectedTop;
      } else if (selectedBottom > viewportBottom) {
        scrollY -= selectedBottom - viewportBottom;
      }
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

  private _renderScrollIndicator = (
    context: CanvasRenderingContext2D,
    viewport: MenuViewport
  ): void => {
    const geometry = this._getScrollThumbGeometry(viewport);

    if (!geometry) {
      return;
    }

    context.save();
    context.globalAlpha *= 0.7;
    context.fillStyle = palette.menu.itemBorder;
    context.fillRect(geometry.x, viewport.y, 2, geometry.trackHeight);
    context.fillStyle = palette.menu.selectedBackground;
    context.fillRect(geometry.x - 1, geometry.thumbY, 4, geometry.thumbHeight);
    context.restore();
  };

  private _getScrollThumbGeometry = (
    viewport: MenuViewport
  ): ScrollThumbGeometry | null => {
    const bounds = this._getItemsBounds();
    const contentHeight = bounds.bottom - bounds.top;

    if (contentHeight <= viewport.height) {
      return null;
    }

    const scrollRange = contentHeight - viewport.height;
    const trackHeight = viewport.height;
    const progress =
      scrollRange === 0
        ? 0
        : (viewport.y - bounds.top - this._scrollY) / scrollRange;
    const thumbHeight = Math.max(24, (viewport.height / contentHeight) * trackHeight);
    const thumbY =
      viewport.y + Math.max(0, Math.min(1, progress)) * (trackHeight - thumbHeight);

    return {
      contentHeight,
      thumbHeight,
      thumbY,
      trackHeight,
      x: viewport.x + viewport.width - 6,
    };
  };

  private _isInsideScrollThumb = (pointer: MenuPointerData): boolean => {
    const geometry = this._getScrollThumbGeometry(this._getItemsViewport());

    if (!geometry) {
      return false;
    }

    return (
      pointer.posX >= geometry.x - 10 &&
      pointer.posX <= geometry.x + 10 &&
      pointer.posY >= geometry.thumbY &&
      pointer.posY <= geometry.thumbY + geometry.thumbHeight
    );
  };

  private _scrollBy = (deltaY: number): void => {
    this._scrollY = this._clampScrollY(this._scrollY - deltaY);
  };

  private _handleTouchScrollDrag = (pointer: MenuPointerData): boolean => {
    if (!this._touchScrollDrag || !this._isMenuScrollable()) {
      return false;
    }

    if (!this._touchScrollDrag.scrollStarted) {
      const startPointer = this._pressStartPointer;
      const dragX = startPointer ? pointer.posX - startPointer.posX : 0;
      const dragY = pointer.posY - this._touchScrollDrag.pointerStartY;

      if (Math.abs(dragY) < touchScrollDragThreshold) {
        return false;
      }

      if (Math.abs(dragX) > Math.abs(dragY)) {
        return false;
      }

      this._touchScrollDrag.scrollStarted = true;
      this._pressedItemDragged = true;
      this._sliderDragIndex = null;
    }

    const pointerDeltaY = pointer.posY - this._touchScrollDrag.lastY;
    this._touchScrollDrag.lastY = pointer.posY;

    this._scrollBy(-pointerDeltaY);
    this._shouldRevealSelected = false;
    return true;
  };

  private _isMenuScrollable = (): boolean =>
    this._getScrollThumbGeometry(this._getItemsViewport()) !== null;

  private _setScrollFromThumbDrag = (pointerY: number): void => {
    if (!this._scrollBarDrag) {
      return;
    }

    const viewport = this._getItemsViewport();
    const geometry = this._getScrollThumbGeometry(viewport);

    if (!geometry) {
      return;
    }

    const bounds = this._getItemsBounds();
    const scrollRange = geometry.contentHeight - viewport.height;
    const thumbRange = geometry.trackHeight - geometry.thumbHeight;
    const pointerDelta = pointerY - this._scrollBarDrag.pointerStartY;
    const scrollDelta = thumbRange === 0 ? 0 : (pointerDelta / thumbRange) * scrollRange;

    this._scrollY = this._clampScrollY(
      this._scrollBarDrag.scrollStartY - scrollDelta,
      bounds,
      viewport
    );
  };

  private _clampScrollY = (
    scrollY: number,
    bounds = this._getItemsBounds(),
    viewport = this._getItemsViewport()
  ): number => {
    const contentHeight = bounds.bottom - bounds.top;

    if (contentHeight <= viewport.height) {
      return this._getMenuScrollY(false);
    }

    const maxScrollY = viewport.y - bounds.top;
    const minScrollY = viewport.y + viewport.height - bounds.bottom;

    return Math.min(maxScrollY, Math.max(minScrollY, scrollY));
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

  private _getScreenTitleOpacity = (): number => {
    if (this._isExitingDemoWatch()) {
      const elapsed = performance.now() - (this._transition?.startedAt ?? 0);

      return Math.max(0, Math.min(1, 1 - elapsed / demoSubtitleExitFadeDuration));
    }

    if (this._screen !== "demo-watch") {
      return 1;
    }

    const elapsed = performance.now() - this._demoWatchStartedAt;
    const progress =
      (elapsed - menuTransitionDuration) / demoSubtitleFadeDuration;

    return Math.max(0, Math.min(1, progress));
  };

  private _shouldRenderScreenTitle = (): boolean => {
    return this._screen !== "start" || this._isExitingDemoWatch();
  };

  private _getRenderedScreenTitle = (): string => {
    if (this._isExitingDemoWatch()) {
      return i18n.menu.demo;
    }

    return this._getScreenTitle();
  };

  private _isExitingDemoWatch = (): boolean => {
    return this._transition?.from === "demo-watch" && this._transition.to === "start";
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

  private _captureTouchKonamiInput = (pointer: MenuPointerData): boolean => {
    if (this._screen !== "start" || this._debugUnlocked || !this._pressStartPointer) {
      return false;
    }

    const deltaX = pointer.posX - this._pressStartPointer.posX;
    const deltaY = pointer.posY - this._pressStartPointer.posY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) >= touchKonamiSwipeThreshold) {
      this._captureKonamiInput(
        absX > absY ? (deltaX < 0 ? 37 : 39) : deltaY < 0 ? 38 : 40
      );
      return true;
    }

    const expectedInput = konamiCode[this._konamiIndex];

    if (expectedInput === 66 || expectedInput === 65) {
      this._captureKonamiInput(expectedInput);
      return true;
    }

    return false;
  };

  private _captureKonamiInput = (keyCode: number): void => {
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
      this._shouldRevealSelected = true;
      this._buildItems();
    }
  };

  private _getScreenTitle = (): string => {
    if (this._screen === "options") {
      return i18n.menu.options;
    }

    if (this._screen === "achievements") {
      return i18n.menu.achievements;
    }

    if (this._screen === "controls") {
      return i18n.menu.controls;
    }

    if (this._screen === "filters") {
      return i18n.menu.filters;
    }

    if (this._screen === "filter-custom") {
      return i18n.menu.customCrtOptions;
    }

    if (this._screen === "debug") {
      return i18n.menu.debug;
    }

    if (this._screen === "debug-reset") {
      return i18n.menu.resetData;
    }

    if (this._screen === "debug-reset-confirm") {
      return i18n.menu.resetConfirmTitle;
    }

    if (this._screen === "demo-watch") {
      return i18n.menu.demo;
    }

    if (this._screen === "game-over") {
      return i18n.menu.gameOver;
    }

    if (this._screen === "language") {
      return i18n.menu.language;
    }

    if (this._screen === "restart-confirm") {
      return i18n.menu.restartConfirmTitle;
    }

    if (this._screen === "level") {
      return i18n.menu.selectLevel;
    }

    return i18n.levels[1].introText;
  };

  private _isPausedRootMenu = (): boolean => {
    return this._screen === "start" && this._startLabel === i18n.menu.continue;
  };

  private _exitDemoWatch = (): void => {
    const previousScreen = this._screen;

    this._active = true;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._startLabel = i18n.menu.start;
    this._showRestartFromStart = false;
    this._screen = "start";
    this._screenHistory = [];
    this._pressedItemIndex = null;
    this._pressedItemDragged = false;
    this._pressStartPointer = null;
    this._touchScrollDrag = null;
    this._scrollBarDrag = null;
    this._sliderDragIndex = null;
    this._selectedIndex = 0;
    this._shouldRevealSelected = true;
    this._levelPreviewedLevel = undefined;
    this._scrollY = 0;
    this._buildItems();
    this._startTransition(previousScreen, "start");
  };

  private _goToScreen = (screen: MenuScreen): void => {
    const previousScreen = this._screen;

    if (previousScreen === "level" && screen !== "level") {
      this._commands.clearLevelPreview?.();
    }

    this._screenHistory.push(this._screen);
    this._screen = screen;
    this._selectedIndex = 0;
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._pressedItemDragged = false;
    this._pressStartPointer = null;
    this._touchScrollDrag = null;
    this._scrollBarDrag = null;
    this._sliderDragIndex = null;
    this._scrollY = 0;
    this._shouldRevealSelected = true;
    this._buildItems();
    this._startTransition(previousScreen, screen);
    this._levelPreviewedLevel = undefined;
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
    this._awaitingBinding = null;
    this._bindingWarning = "";
    this._pressedItemIndex = null;
    this._pressedItemDragged = false;
    this._pressStartPointer = null;
    this._touchScrollDrag = null;
    this._scrollBarDrag = null;
    this._sliderDragIndex = null;
    this._scrollY = 0;
    this._shouldRevealSelected = true;
    this._buildItems();
    this._startTransition(previousScreen, nextScreen);
    this._pendingResetScope =
      previousScreen === "debug-reset-confirm" ? null : this._pendingResetScope;
    this._levelPreviewedLevel = undefined;
    this._previewFocusedLevel();
  };

  private _showResetConfirm = (scope: StoredDataResetScope): void => {
    this._pendingResetScope = scope;
    this._goToScreen("debug-reset-confirm");
  };

  private _confirmReset = (): void => {
    if (!this._pendingResetScope) {
      this._goBack();
      return;
    }

    this._commands.resetStoredData?.(this._pendingResetScope);
    this._pendingResetScope = null;
    this._goBack();
  };

  private _cancelReset = (): void => {
    this._pendingResetScope = null;
    this._goBack();
  };

  private _adjustControllerType = (direction: -1 | 1): void => {
    const currentIndex = controllerTypes.indexOf(userOptions.controllerType);
    const nextIndex =
      (currentIndex + direction + controllerTypes.length) %
      controllerTypes.length;

    userOptions.setOption("controllerType", controllerTypes[nextIndex]);
  };

  private _adjustFilterMode = (direction: -1 | 1): void => {
    const currentIndex = filterModes.indexOf(userOptions.videoFilterMode);
    const nextIndex =
      (currentIndex + direction + filterModes.length) % filterModes.length;

    userOptions.setOption("videoFilterMode", filterModes[nextIndex]);
  };

  /**
   * Cycles the debug logging threshold from the debug menu.
   *
   * @param direction - `1` selects the next level; `-1` selects the previous one.
   */
  private _adjustLogLevel = (direction: -1 | 1): void => {
    userOptions.setOption(
      "logLevel",
      getNextLogLevel(userOptions.logLevel, direction)
    );
  };

  private _setFilterSetting = (
    key: keyof typeof userOptions.filterSettings,
    value: number
  ): void => {
    const filterSettings = {
      ...this._getEditableFilterSettings(),
      [key]: normalizeFilterIntensity(value),
    };

    userOptions.setOption("filterSettings", filterSettings);
    userOptions.setOption("videoFilterMode", "custom");
  };

  private _getEditableFilterSettings = (): typeof userOptions.filterSettings => {
    if (userOptions.videoFilterMode === "custom") {
      return userOptions.filterSettings;
    }

    return filterPresets[userOptions.videoFilterMode] ?? filterPresets.off;
  };

  private _setDebugLives = (lives: number): void => {
    const value = Math.max(1, Math.min(99, Math.round(lives)));

    userOptions.setOption("debugLives", value);
    this._commands.setDebugLives?.(value);
  };

  private _setDebugContinues = (continues: number): void => {
    const value = Math.max(0, Math.min(99, Math.round(continues)));

    userOptions.setOption("debugContinues", value);
    this._commands.setDebugContinues?.(value);
  };

  private _resetFilters = (): void => {
    userOptions.setOption("filterSettings", { ...filterPresets.off });
    userOptions.setOption("videoFilterMode", defaultFilterMode);
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
    this._setUiZoom(userOptions.uiZoom + direction * zoomStepPercent);
  };

  resetUiZoom = (): void => {
    this._setUiZoom(zoomDefaultPercent);
  };

  private _setUiZoom = (value: number): void => {
    userOptions.setOption(
      "uiZoom",
      Math.max(zoomMinPercent, Math.min(zoomMaxPercent, value))
    );
  };

  private _adjustGameZoom = (direction: -1 | 1): void => {
    this._setGameZoom(userOptions.gameZoom + direction * zoomStepPercent);
  };

  private _setGameZoom = (value: number): void => {
    userOptions.setOption(
      "gameZoom",
      Math.max(zoomMinPercent, Math.min(zoomMaxPercent, value))
    );
  };

  private _toggleKeepScreenAwake = (): void => {
    userOptions.setOption("keepScreenAwake", !userOptions.keepScreenAwake);
    this._commands.syncScreenWakeLock?.();
  };

  private _getZoomSliderSteps = (): number => {
    return (zoomMaxPercent - zoomMinPercent) / zoomStepPercent;
  };

  private _getZoomValueFromStep = (step: number): number => {
    return zoomMinPercent + step * zoomStepPercent;
  };

  private _previewFocusedLevel = (): void => {
    if (this._screen !== "level") {
      return;
    }

    const level = this._getFocusedLevel();

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
    const viewport = this._getItemsViewport();
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
