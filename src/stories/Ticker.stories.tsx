import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Ticker from "../game/engine/Ticker";
import palette from "../game/palette";
import "./storybook.css";

function GeneralTickerDemo() {
  const [counts, setCounts] = useState({
    everyFrame: 0,
    everyFiveFrames: 0,
    everyThirtyFrames: 0,
  });

  useEffect(() => {
    const ticker = new Ticker({ fps: 30 });

    ticker.addSchedule((frame) => {
      setCounts((current) => ({ ...current, everyFrame: frame }));
    }, 1);
    ticker.addSchedule((frame) => {
      setCounts((current) => ({ ...current, everyFiveFrames: frame }));
    }, 5);
    ticker.addSchedule((frame) => {
      setCounts((current) => ({ ...current, everyThirtyFrames: frame }));
    }, 30);
    ticker.start();

    return () => {
      ticker.stop();
      ticker.clearSchedule();
    };
  }, []);

  return (
    <article className={"storybook-card"}>
      <h2>General Ticker</h2>
      <p>Scheduled callbacks fire at different frame intervals.</p>
      <div className={"ticker-readout"}>
        <div>
          <strong>{counts.everyFrame}</strong>
          Every frame
        </div>
        <div>
          <strong>{counts.everyFiveFrames}</strong>
          Every 5 frames
        </div>
        <div>
          <strong>{counts.everyThirtyFrames}</strong>
          Every 30 frames
        </div>
      </div>
    </article>
  );
}

function RenderTickerDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return undefined;
    }

    const ticker = new Ticker();
    ticker.addSchedule((nextFrame) => {
      const progress = (nextFrame % 180) / 180;
      const x = 36 + progress * (canvas.width - 72);
      const y = canvas.height / 2 + Math.sin(progress * Math.PI * 4) * 42;

      context.fillStyle = "#06101d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "rgba(199, 213, 235, 0.28)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(32, canvas.height / 2);
      context.lineTo(canvas.width - 32, canvas.height / 2);
      context.stroke();

      context.fillStyle = palette.overlay.activeWashStrong;
      context.beginPath();
      context.arc(x, y, 24, 0, 2 * Math.PI);
      context.fill();

      context.fillStyle = palette.overlay.activeFill;
      context.beginPath();
      context.arc(x, y, 10, 0, 2 * Math.PI);
      context.fill();

      setFrame(nextFrame);
    }, 1);
    ticker.start();

    return () => {
      ticker.stop();
      ticker.clearSchedule();
    };
  }, []);

  return (
    <article className={"storybook-card"}>
      <h2>Render Ticker</h2>
      <canvas
        className={"storybook-canvas"}
        height={220}
        ref={canvasRef}
        width={560}
      />
      <p>Render frame: {frame}</p>
    </article>
  );
}

function TickerStories() {
  return (
    <main className={"storybook-surface"}>
      <section className={"storybook-section"}>
        <p className={"storybook-eyebrow"}>Engine</p>
        <h1 className={"storybook-title"}>Ticker Demos</h1>
        <div className={"storybook-demo-grid"}>
          <GeneralTickerDemo />
          <RenderTickerDemo />
        </div>
      </section>
    </main>
  );
}

const meta = {
  title: "Engine/Ticker",
  component: TickerStories,
} satisfies Meta<typeof TickerStories>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Demos: Story = {};
