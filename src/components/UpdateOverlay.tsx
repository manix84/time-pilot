import { useEffect, useRef } from "react";
import { assetPath } from "../game/asset-path";
import { player } from "../game/constants";
import {
  getTimeWarpFrameForDistance,
  getTimeWarpRenderState,
  timeWarpAnimationTicks,
  timeWarpFrameHeight,
  timeWarpFrameWidth,
} from "../game/time-warp";
import styles from "./UpdateOverlay.module.scss";

/**
 * Props for the update overlay animation.
 */
type UpdateOverlayProps = {
  /**
   * Called after the time-warp completion animation has reached its final tick.
   */
  onWarpComplete: () => void;

  /**
   * Current update sequence state.
   *
   * `"updating"` shows the waiting animation while the service worker activates.
   * `"warping"` plays the final transition before the app reloads.
   */
  state: "updating" | "warping";
};

const animationTickRate = 50;
const frameDurationMs = 1000 / animationTickRate;
const playerRenderSize = 64;
const statusTextOffsetY = 96;
const warpRenderScale = 4;
const playerRotationStep = 360 / player.rotationFrameCount;

/**
 * Full-screen canvas overlay shown while a PWA update is being applied.
 *
 * The overlay keeps accessible status text in the DOM while the decorative
 * canvas animation mirrors the game's time-warp language. Once the warp
 * finishes, the parent can reload into the updated app shell.
 */
function UpdateOverlay({ onWarpComplete, state }: UpdateOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusLabel = state === "warping" ? "Complete" : "Updating...";
  const stateRef = useRef(state);
  const onWarpCompleteRef = useRef(onWarpComplete);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onWarpCompleteRef.current = onWarpComplete;
  }, [onWarpComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    const playerSprite = new Image();
    const timeWarpSprite = new Image();
    let animationFrame = 0;
    let sequenceStartedAt = performance.now();
    let hasCompleted = false;

    playerSprite.src = player.sprite.src;
    timeWarpSprite.src = assetPath("sprites/player/timewarp.png");
    void document.fonts?.load("18px theFont");

    /**
     * Keeps the canvas backing store aligned with the current viewport and
     * device pixel ratio.
     */
    const resizeCanvas = (): void => {
      const deviceScale = window.devicePixelRatio || 1;
      canvas.width = Math.ceil(window.innerWidth * deviceScale);
      canvas.height = Math.ceil(window.innerHeight * deviceScale);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    /**
     * Draws the player sprite in one of its normal or silhouette layers.
     *
     * @param mode - Sprite layer to draw.
     * @param heading - Aircraft heading in degrees.
     */
    const drawPlayer = (
      mode: "black" | "normal" | "white",
      heading: number
    ): void => {
      if (!context || !playerSprite.complete) {
        return;
      }

      const frame =
        Math.round(((heading + 270) % 360) / playerRotationStep) %
        player.rotationFrameCount;
      const layer = mode === "white" ? 1 : mode === "black" ? 2 : 0;
      const sourceX = player.spriteFrameAxis === "y" ? 0 : frame * player.frameWidth;
      const sourceY =
        player.spriteFrameAxis === "y"
          ? frame * player.frameHeight
          : layer * player.frameHeight;

      context.drawImage(
        playerSprite,
        sourceX,
        sourceY,
        player.frameWidth,
        player.frameHeight,
        -playerRenderSize / 2,
        -playerRenderSize / 2,
        playerRenderSize,
        playerRenderSize
      );
    };

    /**
     * Draws one time-warp sprite frame at the requested screen-space x position.
     *
     * @param frame - Source frame index within the time-warp sprite sheet.
     * @param posX - Canvas x position relative to the screen center.
     */
    const drawWarpFrame = (frame: number, posX: number): void => {
      if (!context || !timeWarpSprite.complete) {
        return;
      }

      const renderWidth = timeWarpFrameWidth * warpRenderScale;
      const renderHeight = timeWarpFrameHeight * warpRenderScale;

      context.drawImage(
        timeWarpSprite,
        frame * timeWarpFrameWidth,
        0,
        timeWarpFrameWidth,
        timeWarpFrameHeight,
        posX,
        -renderHeight / 2,
        renderWidth,
        renderHeight
      );
    };

    /**
     * Draws the mirrored strip of time-warp frames around the player.
     *
     * @param halfCells - Number of repeated cells to draw on each side.
     * @param layers - Ordered frame layers for the current warp state.
     */
    const drawWarpStrip = (halfCells: number, layers: readonly number[]): void => {
      const renderWidth = timeWarpFrameWidth * warpRenderScale;

      for (let distance = halfCells; distance >= 1; distance -= 1) {
        drawWarpFrame(
          getTimeWarpFrameForDistance(distance, layers),
          -distance * renderWidth
        );
      }

      for (let distance = 1; distance <= halfCells; distance += 1) {
        drawWarpFrame(
          getTimeWarpFrameForDistance(distance, layers),
          (distance - 1) * renderWidth
        );
      }
    };

    /**
     * Draws the visible update status label inside the canvas animation.
     *
     * @param label - Text to draw beneath the player.
     */
    const drawStatusText = (label: string): void => {
      if (!context) {
        return;
      }

      context.save();
      context.font = "18px theFont";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineWidth = 4;
      context.strokeStyle = "#000";
      context.fillStyle = "#FFF";
      context.strokeText(label, 0, statusTextOffsetY);
      context.fillText(label, 0, statusTextOffsetY);
      context.restore();
    };

    /**
     * Renders one animation frame for the active update state.
     *
     * @param now - High-resolution timestamp supplied by requestAnimationFrame.
     */
    const render = (now: number): void => {
      if (!context) {
        return;
      }

      const deviceScale = window.devicePixelRatio || 1;
      context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.fillStyle = "rgba(0, 0, 0, 0.82)";
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);
      context.save();
      context.translate(window.innerWidth / 2, window.innerHeight / 2);

      if (stateRef.current === "warping") {
        const elapsedTicks = Math.floor((now - sequenceStartedAt) / frameDurationMs);
        const renderWidth = timeWarpFrameWidth * warpRenderScale;
        const halfCellCount = Math.ceil(window.innerWidth / 2 / renderWidth);
        const renderState = getTimeWarpRenderState(elapsedTicks, halfCellCount);

        if (elapsedTicks >= timeWarpAnimationTicks && !hasCompleted) {
          hasCompleted = true;
          onWarpCompleteRef.current();
        }

        if (renderState?.warpVisible) {
          drawWarpStrip(renderState.halfCells, renderState.layers);

          if (renderState.centerFrame !== undefined) {
            drawWarpFrame(renderState.centerFrame, -renderWidth / 2);
          }
        }

        if (renderState) {
          drawPlayer(renderState.playerMode, 90);
        }
        drawStatusText("Complete");
      } else {
        sequenceStartedAt = now;
        drawPlayer("normal", (now / 18) % 360);
        drawStatusText("Updating...");
      }

      context.restore();
      animationFrame = requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div
      className={styles.overlay}
      data-time-pilot-update-overlay
      role={"status"}
      aria-live={"polite"}
    >
      <span className={styles.statusText}>{statusLabel}</span>
      <canvas aria-hidden={"true"} ref={canvasRef} />
    </div>
  );
}

export default UpdateOverlay;
