import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { assetPath } from "../game/asset-path";
import constants from "../game/constants";
import palette from "../game/palette";
import {
  getTimeWarpFrameForDistance,
  getTimeWarpRenderState,
  timeWarpAnimationTicks,
  timeWarpDelayMs,
  timeWarpFrameHeight,
  timeWarpFrameWidth,
  timeWarpRenderScale,
  type TimeWarpPlayerMode,
} from "../game/time-warp";
import "./storybook.css";

type TimeWarpSceneProps = {
  frameDurationMs?: number;
  playSound?: boolean;
  showPlayer?: boolean;
  warpScale?: number;
};

const timeWarpTileOverlap = 1;

const flashDurationMs = 0;
const endBlinkDurationMs = 90;
const holdDurationMs = 900;

const loadImage = (src: string): HTMLImageElement => {
  const image = new Image();
  image.src = src;
  return image;
};

const drawStarfield = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: number
): void => {
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);

  context.fillStyle = palette.text.white;
  for (let index = 0; index < 72; index += 1) {
    const x = (index * 83 + offset * (1 + (index % 5))) % width;
    const y = (index * 47 + (index % 3) * 19) % height;
    const size = index % 7 === 0 ? 2 : 1;
    context.globalAlpha = 0.35 + (index % 4) * 0.12;
    context.fillRect(x, y, size, size);
  }
  context.globalAlpha = 1;
};

const drawPlayer = (
  context: CanvasRenderingContext2D,
  playerSprite: HTMLImageElement,
  centerX: number,
  centerY: number,
  elapsedMs: number,
  mode: TimeWarpPlayerMode = "normal"
): void => {
  const frame =
    Math.floor(elapsedMs / 90) % constants.player.rotationFrameCount;
  const layer = mode === "white" ? 1 : mode === "black" ? 2 : 0;
  const sourceX =
    constants.player.spriteFrameAxis === "x"
      ? frame * constants.player.frameWidth
      : 0;
  const sourceY =
    constants.player.spriteFrameAxis === "y"
      ? frame * constants.player.frameHeight
      : layer * constants.player.frameHeight;

  context.drawImage(
    playerSprite,
    sourceX,
    sourceY,
    constants.player.frameWidth,
    constants.player.frameHeight,
    centerX - constants.player.width / 2,
    centerY - constants.player.height / 2,
    constants.player.width,
    constants.player.height
  );
};

const drawWarpFrame = (
  context: CanvasRenderingContext2D,
  warpSprite: HTMLImageElement,
  frame: number,
  x: number,
  y: number,
  scale: number = timeWarpRenderScale
): void => {
  const renderWidth = timeWarpFrameWidth * scale;
  const renderHeight = timeWarpFrameHeight * scale;
  const sourceX = frame * timeWarpFrameWidth;

  context.drawImage(
    warpSprite,
    sourceX,
    0,
    timeWarpFrameWidth,
    timeWarpFrameHeight,
    x,
    y - renderHeight / 2,
    renderWidth + timeWarpTileOverlap,
    renderHeight
  );
};

const drawWarpStrip = (
  context: CanvasRenderingContext2D,
  warpSprite: HTMLImageElement,
  centerX: number,
  centerY: number,
  halfCells: number,
  layers: readonly number[],
  scale: number
): void => {
  const renderWidth = timeWarpFrameWidth * scale;

  for (let distance = halfCells; distance >= 1; distance -= 1) {
    const frame = getTimeWarpFrameForDistance(distance, layers);
    drawWarpFrame(
      context,
      warpSprite,
      frame,
      centerX - distance * renderWidth,
      centerY,
      scale
    );
  }

  for (let distance = 1; distance <= halfCells; distance += 1) {
    const frame = getTimeWarpFrameForDistance(distance, layers);
    drawWarpFrame(
      context,
      warpSprite,
      frame,
      centerX + (distance - 1) * renderWidth,
      centerY,
      scale
    );
  }
};

const TimeWarpScene = ({
  frameDurationMs = 20,
  playSound = false,
  showPlayer = true,
  warpScale = 2,
}: TimeWarpSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const playerSprite = loadImage(constants.player.sprite.src);
    const warpSprite = loadImage(assetPath("sprites/player/timewarp.png"));
    const timeWarpSound = new Audio(assetPath("sounds/player/timewarp.wav"));
    const sequenceDurationMs =
      timeWarpDelayMs +
      flashDurationMs +
      timeWarpAnimationTicks * frameDurationMs +
      endBlinkDurationMs +
      holdDurationMs;
    let animationFrame = 0;
    let lastSoundCycle = -1;
    const startedAt = performance.now();

    const render = (): void => {
      const elapsedMs = performance.now() - startedAt;
      const cycle = Math.floor(elapsedMs / sequenceDurationMs);
      const sequenceMs = elapsedMs % sequenceDurationMs;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (playSound && cycle !== lastSoundCycle) {
        lastSoundCycle = cycle;
        timeWarpSound.currentTime = 0;
        void timeWarpSound.play().catch(() => {});
      }

      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawStarfield(context, canvas.width, canvas.height, elapsedMs / 24);

      if (sequenceMs < timeWarpDelayMs) {
        if (showPlayer && playerSprite.complete) {
          drawPlayer(context, playerSprite, centerX, centerY, elapsedMs);
        }
      } else if (sequenceMs < timeWarpDelayMs + flashDurationMs) {
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      } else if (
        sequenceMs <
        timeWarpDelayMs + flashDurationMs + timeWarpAnimationTicks * frameDurationMs
      ) {
        const ticks = Math.floor(
          (sequenceMs - timeWarpDelayMs - flashDurationMs) / frameDurationMs
        );
        const halfCells = Math.ceil(
          canvas.width / 2 / (timeWarpFrameWidth * warpScale)
        );
        const renderState = getTimeWarpRenderState(ticks, halfCells);

        if (warpSprite.complete && renderState?.warpVisible) {
          drawWarpStrip(
            context,
            warpSprite,
            centerX,
            centerY,
            renderState.halfCells,
            renderState.layers,
            warpScale
          );

          if (renderState.centerFrame !== undefined) {
            drawWarpFrame(
              context,
              warpSprite,
              renderState.centerFrame,
              centerX - (timeWarpFrameWidth * warpScale) / 2,
              centerY,
              warpScale
            );
          }
        }

        if (
          showPlayer &&
          playerSprite.complete &&
          renderState
        ) {
          drawPlayer(
            context,
            playerSprite,
            centerX,
            centerY,
            elapsedMs,
            renderState?.playerMode ?? "normal"
          );
        }
      } else if (
        sequenceMs <
        timeWarpDelayMs +
        flashDurationMs +
          timeWarpAnimationTicks * frameDurationMs +
          endBlinkDurationMs
      ) {
        context.fillStyle = "#050505";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      timeWarpSound.pause();
      timeWarpSound.currentTime = 0;
    };
  }, [frameDurationMs, playSound, showPlayer, warpScale]);

  return (
    <canvas
      className={"storybook-canvas storybook-pixel-canvas"}
      height={360}
      ref={canvasRef}
      width={640}
    />
  );
};

const meta = {
  title: "Game/Time Warp",
  component: TimeWarpScene,
  args: {
    frameDurationMs: 20,
    playSound: false,
    showPlayer: true,
    warpScale: 2,
  },
  argTypes: {
    frameDurationMs: {
      control: { min: 15, max: 50, step: 5, type: "range" },
    },
    warpScale: {
      control: { min: 1, max: 5, step: 1, type: "range" },
    },
  },
  parameters: {
    controls: {
      disable: false,
    },
    options: {
      selectedPanel: "storybook/controls/panel",
      showPanel: true,
    },
  },
} satisfies Meta<typeof TimeWarpScene>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnimatedSequence: Story = {
  args: {
    showPlayer: true,
    warpScale: 1
  }
};

export const WarpOnly: Story = {
  args: {
    showPlayer: false,
    warpScale: 1,
  },
};
