import userOptions from "./user-options";
import {
  clampZoomPercent as clampEngineZoomPercent,
  formatZoomPercent,
  getManualViewportScale,
  getViewportScale,
  getZoomScale,
} from "arcade-engine";

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

/**
 * Clamps a manual zoom value to the supported percentage range.
 *
 * @param value - Raw zoom percentage.
 * @returns Clamped zoom percentage.
 */
export const clampZoomPercent = (value: number): number =>
  clampEngineZoomPercent(value, zoomMinPercent, zoomMaxPercent);

/**
 * Gets the manual UI zoom multiplier from persisted user options.
 */
export const getManualUiScale = (): number =>
  getZoomScale(userOptions.uiZoom, zoomMinPercent, zoomMaxPercent);

/**
 * Gets the manual game zoom multiplier from persisted user options.
 */
export const getManualGameScale = (): number =>
  getZoomScale(userOptions.gameZoom, zoomMinPercent, zoomMaxPercent);

/**
 * Calculates responsive gameplay scaling for a viewport.
 *
 * @param width - Viewport width.
 * @param height - Viewport height.
 * @returns Responsive game scale before manual zoom.
 */
export const getViewportGameScale = (width: number, height: number): number => {
  return getViewportScale(width, height, {
    maxScale: gameViewportMaxScale,
    minScale: gameViewportMinScale,
    referenceHeight: viewportReferenceHeight,
    referenceWidth: viewportReferenceWidth,
  });
};

/**
 * Combines responsive gameplay scale with the manual game zoom.
 */
export const getGameScale = (width = viewportReferenceWidth, height = viewportReferenceHeight): number =>
  getManualViewportScale(width, height, {
    manualScale: getManualGameScale(),
    maxScale: gameViewportMaxScale,
    minScale: gameViewportMinScale,
    referenceHeight: viewportReferenceHeight,
    referenceWidth: viewportReferenceWidth,
  });

/**
 * Calculates responsive menu/HUD scaling for a viewport.
 *
 * @param width - Viewport width.
 * @param height - Viewport height.
 * @returns Responsive UI scale before manual zoom.
 */
export const getViewportUiScale = (width: number, height: number): number => {
  return getViewportScale(width, height, {
    maxScale: viewportMaxScale,
    minScale: viewportMinScale,
    referenceHeight: viewportReferenceHeight,
    referenceWidth: viewportReferenceWidth,
  });
};

/**
 * Combines responsive UI scale with the manual UI zoom.
 */
export const getUiScale = (width: number, height: number): number =>
  getManualViewportScale(width, height, {
    manualScale: getManualUiScale(),
    maxScale: viewportMaxScale,
    minScale: viewportMinScale,
    referenceHeight: viewportReferenceHeight,
    referenceWidth: viewportReferenceWidth,
  });

/**
 * Formats the current UI zoom for menu display.
 */
export const formatUiZoom = (): string =>
  formatZoomPercent(userOptions.uiZoom);

/**
 * Formats the current gameplay zoom for menu display.
 */
export const formatGameZoom = (): string =>
  formatZoomPercent(userOptions.gameZoom);
