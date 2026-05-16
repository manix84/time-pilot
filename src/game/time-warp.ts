/**
 * Number of frames in the time-warp sprite strip.
 */
export const timeWarpFrameCount = 4;

/**
 * Source frame height for the time-warp sprite.
 */
export const timeWarpFrameHeight = 16;

/**
 * Source frame width for the time-warp sprite.
 */
export const timeWarpFrameWidth = 16;

/**
 * Default render multiplier used by gameplay time-warp effects.
 */
export const timeWarpRenderScale = 2;

/**
 * Delay before the visible time-warp effect begins.
 */
export const timeWarpDelayMs = 3500;

const introFlashTicks = 18;
const expandFrameTicks = 16;
const centerHoldTicks = 10;
const vanishHoldTicks = 0;
const contractTicks = 38;

/**
 * Player sprite layer used during a time-warp frame.
 */
export type TimeWarpPlayerMode = "normal" | "white" | "black";

/**
 * Render instructions for one time-warp animation tick.
 */
export type TimeWarpRenderState = {
  /**
   * Optional frame drawn at the center of the warp.
   */
  centerFrame?: number;
  /**
   * Number of repeated cells to draw on either side of center.
   */
  halfCells: number;
  /**
   * Distance thresholds that map cells to sprite frames.
   */
  layers: readonly number[];
  /**
   * Player sprite layer for this tick.
   */
  playerMode: TimeWarpPlayerMode;
  /**
   * Whether warp graphics should be visible on this tick.
   */
  warpVisible: boolean;
};

/**
 * Total number of simulation ticks in the visible time-warp animation.
 */
export const timeWarpAnimationTicks =
  introFlashTicks +
  expandFrameTicks * 3 +
  centerHoldTicks +
  vanishHoldTicks +
  contractTicks;

const clampProgress = (elapsedTicks: number, durationTicks: number): number =>
  Math.min(1, Math.max(0, elapsedTicks / durationTicks));

const scaledCells = (cellCount: number, progress: number): number =>
  Math.max(1, Math.ceil(cellCount * clampProgress(progress, 1)));

const createThreeLayerStrip = (halfCells: number): readonly number[] => [
  halfCells,
  Math.ceil((halfCells * 2) / 3),
  Math.ceil(halfCells / 3),
];

/**
 * Selects a time-warp sprite frame for a cell's distance from center.
 *
 * @param distanceFromCenter - One-based cell distance from the center.
 * @param layers - Distance thresholds for each frame layer.
 * @returns Source frame index.
 */
export const getTimeWarpFrameForDistance = (
  distanceFromCenter: number,
  layers: readonly number[]
): number => {
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    if (distanceFromCenter <= layers[index]) {
      return index;
    }
  }

  return 0;
};

/**
 * Gets the render state for a time-warp animation tick.
 *
 * @param elapsedTicks - Number of ticks since the visible effect started.
 * @param halfCellCount - Number of cells needed to fill half the viewport.
 * @returns Render instructions, or undefined when the animation is inactive.
 */
export const getTimeWarpRenderState = (
  elapsedTicks: number,
  halfCellCount: number
): TimeWarpRenderState | undefined => {
  if (elapsedTicks < 0 || elapsedTicks >= timeWarpAnimationTicks) {
    return undefined;
  }

  const warpVisible = elapsedTicks % 4 >= 2;

  if (elapsedTicks < introFlashTicks) {
    return {
      centerFrame: 3,
      halfCells: 0,
      layers: [],
      playerMode: warpVisible ? "normal" : "white",
      warpVisible,
    };
  }

  let stageTicks = elapsedTicks - introFlashTicks;

  if (stageTicks < expandFrameTicks) {
    const halfCells = scaledCells(halfCellCount, stageTicks / expandFrameTicks);

    return {
      halfCells,
      layers: [halfCells],
      playerMode: warpVisible ? "normal" : "white",
      warpVisible,
    };
  }

  stageTicks -= expandFrameTicks;

  if (stageTicks < expandFrameTicks) {
    const innerCells = Math.ceil(
      (halfCellCount / 2) * clampProgress(stageTicks, expandFrameTicks)
    );

    return {
      halfCells: halfCellCount,
      layers: [halfCellCount, Math.max(1, innerCells)],
      playerMode: warpVisible ? "normal" : "white",
      warpVisible,
    };
  }

  stageTicks -= expandFrameTicks;

  if (stageTicks < expandFrameTicks) {
    const frameTwoCells = Math.ceil((halfCellCount * 2) / 3);
    const frameThreeCells = Math.ceil(
      (halfCellCount / 3) * clampProgress(stageTicks, expandFrameTicks)
    );

    return {
      halfCells: halfCellCount,
      layers: [halfCellCount, frameTwoCells, Math.max(1, frameThreeCells)],
      playerMode: warpVisible ? "normal" : "white",
      warpVisible,
    };
  }

  stageTicks -= expandFrameTicks;

  if (stageTicks < centerHoldTicks) {
    return {
      centerFrame: 3,
      halfCells: halfCellCount,
      layers: createThreeLayerStrip(halfCellCount),
      playerMode: "black",
      warpVisible,
    };
  }

  stageTicks -= centerHoldTicks;

  if (stageTicks < vanishHoldTicks) {
    return {
      centerFrame: 3,
      halfCells: halfCellCount,
      layers: createThreeLayerStrip(halfCellCount),
      playerMode: "black",
      warpVisible,
    };
  }

  stageTicks -= vanishHoldTicks;

  const halfCells = Math.ceil(
    halfCellCount * (1 - clampProgress(stageTicks, contractTicks))
  );

  if (halfCells <= 0) {
    return undefined;
  }

  return {
    halfCells,
    layers: createThreeLayerStrip(halfCells),
    playerMode: "black",
    warpVisible,
  };
};
