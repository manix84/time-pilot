/**
 * Fixed simulation tick rate used by gameplay systems.
 */
export const gameTickRate = 50;

export const gameSpeedOptions = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2] as const;
export const defaultGameSpeed = 1;

export const renderFpsOptions = [30, 40, 50, 60, 75, 90, 120, 144, "max"] as const;
export type RenderFps = (typeof renderFpsOptions)[number];
export const defaultRenderFps: RenderFps = "max";

/**
 * Default render cadence. `"max"` lets the browser/display decide the upper
 * bound through requestAnimationFrame.
 */
export const renderFps = defaultRenderFps;

export const normalizeGameSpeed = (value: unknown): number =>
  typeof value === "number" &&
  gameSpeedOptions.includes(value as (typeof gameSpeedOptions)[number])
    ? value
    : defaultGameSpeed;

export const normalizeRenderFps = (value: unknown): RenderFps =>
  (typeof value === "number" || value === "max") &&
  renderFpsOptions.includes(value as RenderFps)
    ? (value as RenderFps)
    : defaultRenderFps;
