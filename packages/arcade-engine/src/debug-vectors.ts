import type { Heading } from "./types";

export interface DebugVectorOptions {
  fillTurnArc?: boolean;
  length?: number;
}

export interface DebugVectorColors {
  heading: string;
  steering: string;
  steeringArcFill: string;
}

const degreesToRadians = (degrees: number): number => degrees * (Math.PI / 180);

const normalizeHeading = (heading: Heading): Heading =>
  ((heading % 360) + 360) % 360;

const getHeadingDelta = (from: Heading, to: Heading): number => {
  return ((normalizeHeading(to) - normalizeHeading(from) + 540) % 360) - 180;
};

const getVectorEnd = (
  posX: number,
  posY: number,
  heading: Heading,
  length: number
): { x: number; y: number } => {
  const radians = degreesToRadians(heading);

  return {
    x: posX + Math.sin(radians) * length,
    y: posY - Math.cos(radians) * length,
  };
};

const getCanvasArcAngle = (heading: Heading): number => {
  return degreesToRadians(normalizeHeading(heading) - 90);
};

const drawVectorLine = (
  context: CanvasRenderingContext2D,
  posX: number,
  posY: number,
  heading: Heading,
  length: number,
  color: string
): void => {
  const end = getVectorEnd(posX, posY, heading, length);

  context.beginPath();
  context.moveTo(posX, posY);
  context.lineTo(end.x, end.y);
  context.strokeStyle = color;
  context.stroke();
};

/**
 * Draws heading and steering vectors for debug overlays.
 */
export const drawDebugVectors = (
  context: CanvasRenderingContext2D,
  posX: number,
  posY: number,
  heading: Heading,
  steeringHeading: Heading,
  colors: DebugVectorColors,
  options: DebugVectorOptions = {}
): void => {
  const length = options.length ?? 34;

  context.save();
  context.lineWidth = 2;

  drawVectorLine(context, posX, posY, heading, length, colors.heading);
  drawVectorLine(context, posX, posY, steeringHeading, length, colors.steering);

  const delta = getHeadingDelta(heading, steeringHeading);

  if (options.fillTurnArc && delta !== 0) {
    context.beginPath();
    context.moveTo(posX, posY);
    context.arc(
      posX,
      posY,
      length,
      getCanvasArcAngle(heading),
      getCanvasArcAngle(steeringHeading),
      delta < 0
    );
    context.closePath();
    context.fillStyle = colors.steeringArcFill;
    context.fill();
  }

  context.restore();
};
