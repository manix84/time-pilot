import { useCallback, useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sound as SoundEngine } from "@time-pilot/arcade-engine";
import { assetPath } from "../game/asset-path";
import palette from "../game/palette";
import "./storybook.scss";

type AudioMode = "global" | "spatial";

type AudioSceneProps = {
  loop?: boolean;
  mode?: AudioMode;
  movingSource?: boolean;
  selectedSound?: string;
  sourceX?: number;
  sourceY?: number;
  triggerCount?: number;
};

type AudioSample = {
  label: string;
  path: string;
};

const audioSamples = [
  { label: "Player bullet", path: "sounds/player/bullet.ogg" },
  { label: "Player explosion", path: "sounds/player/explosion.ogg" },
  { label: "Player extra life", path: "sounds/player/extra_life.ogg" },
  { label: "Time warp", path: "sounds/player/timewarp.ogg" },
  { label: "Enemy bullet", path: "sounds/enemies/basic/bullet.ogg" },
  { label: "Enemy explosion", path: "sounds/enemies/basic/explosion.ogg" },
  { label: "Rocket explosion", path: "sounds/enemies/basic/rocket_explode.ogg" },
  { label: "Rocket launch", path: "sounds/enemies/basic/rocket_launch.ogg" },
  { label: "Rocket flying", path: "sounds/enemies/basic/rocket_fly.ogg" },
  { label: "Enemy wave start", path: "sounds/enemies/basic/wave_start.ogg" },
  { label: "Special bomb", path: "sounds/enemies/special/bomb.ogg" },
  { label: "Special explosion", path: "sounds/enemies/special/explosion.ogg" },
  { label: "Boss level 1", path: "sounds/enemies/boss/boss1.ogg" },
  { label: "Boss level 2", path: "sounds/enemies/boss/boss2.ogg" },
  { label: "Boss level 3", path: "sounds/enemies/boss/boss3.ogg" },
  { label: "Boss level 4", path: "sounds/enemies/boss/boss4.ogg" },
  { label: "Boss explosion", path: "sounds/enemies/boss/explosion.ogg" },
  { label: "Coin drop", path: "sounds/ui/coindrop.ogg" },
  { label: "Game start", path: "music/game_start.ogg" },
  { label: "High score", path: "sounds/ui/highscore.ogg" },
  { label: "Next level", path: "sounds/ui/next_level.ogg" },
  { label: "Pickup", path: "sounds/pickup.ogg" },
] satisfies AudioSample[];

const audioSampleLabels = audioSamples.map((sample) => sample.label);

const getAudioSample = (label?: string): AudioSample =>
  audioSamples.find((sample) => sample.label === label) ?? audioSamples[0];

const drawAudioScene = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: AudioMode,
  x: number,
  y: number,
  movingSource: boolean,
  elapsedMs: number
): void => {
  const centerX = width / 2;
  const centerY = height / 2;
  const sourceX = movingSource
    ? Math.sin(elapsedMs / 900) * width * 0.36
    : x;
  const sourceY = movingSource
    ? Math.cos(elapsedMs / 1200) * height * 0.28
    : y;
  const renderX = centerX + sourceX;
  const renderY = centerY + sourceY;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#06101d";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(126, 219, 211, 0.18)";
  context.lineWidth = 1;
  for (let lineX = 80; lineX < width; lineX += 80) {
    context.beginPath();
    context.moveTo(lineX, 0);
    context.lineTo(lineX, height);
    context.stroke();
  }
  for (let lineY = 80; lineY < height; lineY += 80) {
    context.beginPath();
    context.moveTo(0, lineY);
    context.lineTo(width, lineY);
    context.stroke();
  }

  context.strokeStyle = palette.menu.mutedText;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX, centerY);
  context.lineTo(renderX, renderY);
  context.stroke();

  context.fillStyle = palette.debug.headingVector;
  context.beginPath();
  context.arc(centerX, centerY, 16, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#000";
  context.font = "13px theFont, Trebuchet MS, Segoe UI, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("YOU", centerX, centerY + 1);

  context.fillStyle = mode === "spatial" ? palette.debug.steeringVector : "#ffd400";
  context.beginPath();
  context.arc(renderX, renderY, mode === "spatial" ? 18 : 13, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = palette.text.white;
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = palette.text.white;
  context.font = "15px theFont, Trebuchet MS, Segoe UI, sans-serif";
  context.fillText(mode === "spatial" ? "SOURCE" : "GLOBAL", renderX, renderY + 34);

  context.fillStyle = palette.menu.mutedText;
  context.font = "14px theFont, Trebuchet MS, Segoe UI, sans-serif";
  context.textAlign = "left";
  context.fillText("Listener", 24, 30);
  context.fillText("Sound source", 24, 54);
  context.fillStyle = palette.debug.headingVector;
  context.fillRect(130, 20, 22, 12);
  context.fillStyle = mode === "spatial" ? palette.debug.steeringVector : "#ffd400";
  context.fillRect(130, 44, 22, 12);
};

const AudioScene = ({
  loop = false,
  mode = "spatial",
  movingSource = false,
  selectedSound = audioSamples[0].label,
  sourceX = 240,
  sourceY = 0,
  triggerCount = 0,
}: AudioSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeSoundRef = useRef<SoundEngine | null>(null);
  const activeModeRef = useRef<AudioMode>(mode);
  const activeLoopRef = useRef(loop);
  const lastTriggerRef = useRef(triggerCount);
  const latestPositionRef = useRef({ x: sourceX, y: sourceY });

  const stopSound = useCallback((): void => {
    activeSoundRef.current?.destroy();
    activeSoundRef.current = null;
  }, []);

  const playSound = useCallback((): void => {
    const sample = getAudioSample(selectedSound);

    stopSound();

    const sound = new SoundEngine(assetPath(sample.path), {
      instantDestroy: !loop,
      loop,
    });

    activeSoundRef.current = sound;
    activeModeRef.current = mode;
    activeLoopRef.current = loop;

    if (mode === "spatial") {
      sound.setSpatialPosition(
        latestPositionRef.current.x,
        latestPositionRef.current.y,
        360,
        220
      );
    }

    if (loop) {
      sound.loop();
    } else {
      sound.play();
    }
  }, [loop, mode, selectedSound, stopSound]);

  useEffect(() => {
    if (triggerCount === lastTriggerRef.current) {
      return;
    }

    lastTriggerRef.current = triggerCount;
    if (triggerCount > 0) {
      playSound();
    }
  }, [playSound, triggerCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    let animationFrame = 0;
    const startedAt = performance.now();

    const render = (): void => {
      const elapsedMs = performance.now() - startedAt;
      const position = {
        x: movingSource ? Math.sin(elapsedMs / 900) * canvas.width * 0.36 : sourceX,
        y: movingSource ? Math.cos(elapsedMs / 1200) * canvas.height * 0.28 : sourceY,
      };

      latestPositionRef.current = position;
      if (activeSoundRef.current && activeModeRef.current === "spatial") {
        activeSoundRef.current.setSpatialPosition(
          position.x,
          position.y,
          canvas.width / 2,
          canvas.height / 2
        );
      }

      drawAudioScene(
        context,
        canvas.width,
        canvas.height,
        mode,
        sourceX,
        sourceY,
        movingSource,
        elapsedMs
      );

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [mode, movingSource, sourceX, sourceY]);

  useEffect(() => stopSound, [stopSound]);

  useEffect(() => {
    if (!activeSoundRef.current || !activeLoopRef.current) {
      return;
    }

    playSound();
  }, [loop, mode, playSound, selectedSound]);

  return (
    <div className={"storybook-surface"}>
      <section className={"storybook-section"}>
        <p className={"storybook-eyebrow"}>{"Audio"}</p>
        <h1 className={"storybook-title"}>{"Spatial and Global Sound"}</h1>
        <div className={"storybook-controls"}>
          <button type={"button"} onClick={playSound}>
            {"Play selected sound"}
          </button>
          <button type={"button"} onClick={stopSound}>
            {"Stop sound"}
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className={"storybook-canvas storybook-pixel-canvas"}
          height={440}
          width={720}
        />
        <div className={"storybook-demo-grid"}>
          <article className={"storybook-card"}>
            <h2>{"Controls panel trigger"}</h2>
            <p>
              {
                "Pick a sound, choose global or spatial playback, then increment Trigger Count in the Controls panel. The canvas buttons are kept here because some browsers require a direct click before audio can start."
              }
            </p>
          </article>
          <article className={"storybook-card"}>
            <h2>{"Spatial preview"}</h2>
            <p>
              {
                "Spatial mode pans from the listener at the center. Enable Moving Source to hear a looping sample travel around the play field."
              }
            </p>
          </article>
        </div>
      </section>
    </div>
  );
};

const meta = {
  title: "Game/Audio",
  component: AudioScene,
  args: {
    loop: false,
    mode: "spatial",
    movingSource: false,
    selectedSound: "Enemy bullet",
    sourceX: 240,
    sourceY: 0,
    triggerCount: 0,
  },
  argTypes: {
    mode: {
      control: "inline-radio",
      options: ["global", "spatial"],
    },
    selectedSound: {
      control: "select",
      options: audioSampleLabels,
    },
    sourceX: {
      control: { min: -360, max: 360, step: 20, type: "range" },
      if: { arg: "mode", eq: "spatial" },
    },
    sourceY: {
      control: { min: -220, max: 220, step: 20, type: "range" },
      if: { arg: "mode", eq: "spatial" },
    },
    triggerCount: {
      control: { min: 0, max: 100, step: 1, type: "number" },
    },
  },
  parameters: {
    controls: {
      disable: false,
    },
    docs: {
      description: {
        component:
          "Audition global and spatial sound effects through the shared game sound engine.",
      },
    },
    options: {
      selectedPanel: "storybook/controls/panel",
      showPanel: true,
    },
  },
} satisfies Meta<typeof AudioScene>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SpatialSound: Story = {
  args: {
    loop: true,
    movingSource: true,
    selectedSound: "Rocket flying",
  },
};

export const GlobalSound: Story = {
  args: {
    loop: false,
    mode: "global",
    selectedSound: "Game start",
  },
};
