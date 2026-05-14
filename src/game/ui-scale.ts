import userOptions from "./user-options";

const viewportReferenceWidth = 800;
const viewportReferenceHeight = 600;
const gameViewportMinScale = 0.75;
const gameViewportMaxScale = 1.35;
const viewportMinScale = 0.72;
const viewportMaxScale = 1.35;
export const zoomMinPercent = 25;
export const zoomMaxPercent = 250;
export const zoomDefaultPercent = 100;
export const zoomStepPercent = 5;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const clampZoomPercent = (value: number): number =>
  clamp(value, zoomMinPercent, zoomMaxPercent);

export const getManualUiScale = (): number =>
  clampZoomPercent(userOptions.uiZoom) / 100;

export const getManualGameScale = (): number =>
  clampZoomPercent(userOptions.gameZoom) / 100;

export const getViewportGameScale = (width: number, height: number): number => {
  const scale = Math.min(
    width / viewportReferenceWidth,
    height / viewportReferenceHeight
  );

  return clamp(scale, gameViewportMinScale, gameViewportMaxScale);
};

export const getGameScale = (width = viewportReferenceWidth, height = viewportReferenceHeight): number =>
  getViewportGameScale(width, height) * getManualGameScale();

export const getViewportUiScale = (width: number, height: number): number => {
  const scale = Math.min(
    width / viewportReferenceWidth,
    height / viewportReferenceHeight
  );

  return clamp(scale, viewportMinScale, viewportMaxScale);
};

export const getUiScale = (width: number, height: number): number =>
  getViewportUiScale(width, height) * getManualUiScale();

export const formatUiZoom = (): string =>
  `${Math.round(getManualUiScale() * 100)}%`;

export const formatGameZoom = (): string =>
  `${Math.round(getManualGameScale() * 100)}%`;
