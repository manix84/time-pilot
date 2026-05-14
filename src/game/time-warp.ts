export const timeWarpFrameCount = 4;
export const timeWarpFrameHeight = 16;
export const timeWarpFrameWidth = 16;
export const timeWarpRenderScale = 2;

const introFlashTicks = 18;
const expandFrameTicks = 16;
const centerHoldTicks = 10;
const vanishHoldTicks = 0;
const contractTicks = 38;

export type TimeWarpPlayerMode = "normal" | "white" | "black" | "hidden";

export type TimeWarpRenderState = {
  centerFrame?: number;
  halfCells: number;
  layers: readonly number[];
  playerMode: TimeWarpPlayerMode;
  warpVisible: boolean;
};

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
      playerMode: "normal",
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
      playerMode: "normal",
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
      playerMode: "normal",
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
      playerMode: "hidden",
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
    playerMode: "hidden",
    warpVisible,
  };
};
