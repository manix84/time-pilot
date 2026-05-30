import palette from "./palette";
import { drawDebugVectors as drawEngineDebugVectors } from "./engine";
import type { Heading } from "./types";

interface DebugVectorOptions {
  fillTurnArc?: boolean;
  length?: number;
}

/**
 * Draws heading and steering vectors for debug overlays.
 *
 * @param context - Canvas context to draw into.
 * @param posX - Entity x position.
 * @param posY - Entity y position.
 * @param heading - Current entity heading.
 * @param steeringHeading - Desired steering heading.
 * @param options - Optional rendering settings.
 */
export const drawDebugVectors = (
  context: CanvasRenderingContext2D,
  posX: number,
  posY: number,
  heading: Heading,
  steeringHeading: Heading,
  options: DebugVectorOptions = {}
): void => {
  drawEngineDebugVectors(
    context,
    posX,
    posY,
    heading,
    steeringHeading,
    {
      heading: palette.debug.headingVector,
      steering: palette.debug.steeringVector,
      steeringArcFill: palette.debug.steeringArcFill,
    },
    options
  );
};
