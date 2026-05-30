export interface ViewportDimensions {
  height: number;
  width: number;
}

export interface ViewportRadiusOptions {
  minRadius?: number;
  padding?: number;
}

export interface ViewportAreaScaleOptions {
  minScale?: number;
  referenceHeight?: number;
  referenceWidth?: number;
}

const defaultReferenceWidth = 800;
const defaultReferenceHeight = 600;

/**
 * Calculates the radius needed to cover the current viewport from its center.
 */
export const getViewportRadius = (viewport: ViewportDimensions): number => {
  return Math.hypot(viewport.width, viewport.height) / 2;
};

/**
 * Calculates a radius around the viewport, with optional padding and floor.
 */
export const getViewportPaddedRadius = (
  viewport: ViewportDimensions,
  options: ViewportRadiusOptions = {}
): number => {
  return Math.max(
    options.minRadius ?? 0,
    getViewportRadius(viewport) + (options.padding ?? 0)
  );
};

/**
 * Scales budgets based on viewport area relative to a reference viewport.
 */
export const getViewportAreaScale = (
  viewport: ViewportDimensions,
  options: ViewportAreaScaleOptions = {}
): number => {
  const referenceWidth = options.referenceWidth ?? defaultReferenceWidth;
  const referenceHeight = options.referenceHeight ?? defaultReferenceHeight;
  const minScale = options.minScale ?? 1;

  return Math.max(
    minScale,
    (viewport.width * viewport.height) / (referenceWidth * referenceHeight)
  );
};

/**
 * Applies viewport-area scaling to an entity or effect budget.
 */
export const getScaledViewportLimit = (
  baseLimit: number,
  viewport: ViewportDimensions,
  options: ViewportAreaScaleOptions = {}
): number => {
  return Math.ceil(baseLimit * getViewportAreaScale(viewport, options));
};
