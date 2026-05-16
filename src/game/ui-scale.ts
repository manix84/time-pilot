import userOptions from "./user-options";

const viewportReferenceWidth = 800;
const viewportReferenceHeight = 600;
const gameViewportMinScale = 0.75;
const gameViewportMaxScale = 1.35;
const viewportMinScale = 0.72;
const viewportMaxScale = 1.35;

/**
 * Minimum manual zoom percentage exposed to players.
 */
export const zoomMinPercent = 25;

/**
 * Maximum manual zoom percentage exposed to players.
 */
export const zoomMaxPercent = 250;

/**
 * Default manual zoom percentage.
 */
export const zoomDefaultPercent = 100;

/**
 * Step size used by menu zoom controls.
 */
export const zoomStepPercent = 5;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * Clamps a manual zoom value to the supported percentage range.
 *
 * @param value - Raw zoom percentage.
 * @returns Clamped zoom percentage.
 */
export const clampZoomPercent = (value: number): number =>
  clamp(value, zoomMinPercent, zoomMaxPercent);

/**
 * Gets the manual UI zoom multiplier from persisted user options.
 */
export const getManualUiScale = (): number =>
  clampZoomPercent(userOptions.uiZoom) / 100;

/**
 * Gets the manual game zoom multiplier from persisted user options.
 */
export const getManualGameScale = (): number =>
  clampZoomPercent(userOptions.gameZoom) / 100;

/**
 * Calculates responsive gameplay scaling for a viewport.
 *
 * @param width - Viewport width.
 * @param height - Viewport height.
 * @returns Responsive game scale before manual zoom.
 */
export const getViewportGameScale = (width: number, height: number): number => {
  const scale = Math.min(
    width / viewportReferenceWidth,
    height / viewportReferenceHeight
  );

  return clamp(scale, gameViewportMinScale, gameViewportMaxScale);
};

/**
 * Combines responsive gameplay scale with the manual game zoom.
 */
export const getGameScale = (width = viewportReferenceWidth, height = viewportReferenceHeight): number =>
  getViewportGameScale(width, height) * getManualGameScale();

/**
 * Calculates responsive menu/HUD scaling for a viewport.
 *
 * @param width - Viewport width.
 * @param height - Viewport height.
 * @returns Responsive UI scale before manual zoom.
 */
export const getViewportUiScale = (width: number, height: number): number => {
  const scale = Math.min(
    width / viewportReferenceWidth,
    height / viewportReferenceHeight
  );

  return clamp(scale, viewportMinScale, viewportMaxScale);
};

/**
 * Combines responsive UI scale with the manual UI zoom.
 */
export const getUiScale = (width: number, height: number): number =>
  getViewportUiScale(width, height) * getManualUiScale();

/**
 * Formats the current UI zoom for menu display.
 */
export const formatUiZoom = (): string =>
  `${Math.round(getManualUiScale() * 100)}%`;

/**
 * Formats the current gameplay zoom for menu display.
 */
export const formatGameZoom = (): string =>
  `${Math.round(getManualGameScale() * 100)}%`;
