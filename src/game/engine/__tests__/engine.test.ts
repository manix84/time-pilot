import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GameArena from "../arena";
import Sound from "../Sound";
import Ticker from "../Ticker";

describe("engine modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a canvas arena, renders text, sprites, and circles", () => {
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: 640 });
    Object.defineProperty(host, "clientHeight", { value: 480 });

    const arena = new GameArena(host);
    const sprite = new Image();

    arena.renderText("Hello", 10, 20, { size: 16, align: "center" });
    arena.renderSprite(sprite, {
      frameWidth: 16,
      frameHeight: 16,
      frameX: 0,
      frameY: 0,
      posX: 4,
      posY: 8,
    });
    arena.renderSprite(sprite, {
      frameWidth: 16,
      frameHeight: 16,
      frameX: 0,
      frameY: 0,
      flipY: true,
      posX: 4,
      posY: 8,
    });
    arena.drawCircle(0, 0, 10, { borderColor: "#fff" });

    expect(host.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
    expect(arena.width).toBe(640);
    expect(arena.height).toBe(480);
  });

  it("registers and preloads every asset", async () => {
    const host = document.createElement("div");
    const arena = new GameArena(host);
    const callback = vi.fn();

    vi.stubGlobal(
      "Image",
      class {
        onerror: (() => void) | null = null;
        onload: (() => void) | null = null;

        set src(_value: string) {
          window.setTimeout(() => this.onload?.(), 0);
        }
      }
    );

    arena.registerAssets(["/one.png", "/two.png"]);
    arena.preloadAssets(callback);

    await new Promise((resolve) => window.setTimeout(resolve, 5));

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith({ loaded: 2, remaining: 0 });
  });

  it("runs scheduled ticker callbacks and stop callbacks", async () => {
    const ticker = new Ticker();
    const scheduled = vi.fn();
    const stopped = vi.fn();

    ticker.addSchedule(scheduled, 1);
    ticker.start();

    await new Promise((resolve) => window.setTimeout(resolve, 5));
    ticker.stop(stopped);
    await new Promise((resolve) => window.setTimeout(resolve, 5));

    expect(scheduled).toHaveBeenCalled();
    expect(stopped).toHaveBeenCalled();
    expect(ticker.clearTicks()).toBe(true);
  });

  it("can throttle scheduled work to a fixed simulation frame rate", async () => {
    const ticker = new Ticker({ fps: 30 });
    const scheduled = vi.fn();

    ticker.addSchedule(scheduled, 1);
    ticker.start();

    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(scheduled).not.toHaveBeenCalled();

    await new Promise((resolve) => window.setTimeout(resolve, 40));
    expect(scheduled).toHaveBeenCalled();

    ticker.stop();
  });

  it("creates playable sounds", () => {
    const sound = new Sound("/sounds/player/bullet.mp3", { autoplay: false });

    sound.pause();
    sound.stop();
    sound.destroy();

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("pauses, resumes, and stops active sounds globally", () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    const play = vi.mocked(HTMLMediaElement.prototype.play);
    const pause = vi.mocked(HTMLMediaElement.prototype.pause);
    const sound = new Sound("/sounds/player/bullet.mp3", { autoplay: false });

    sound.play();
    Sound.pauseAll();
    Sound.resumePaused();
    Sound.stopAll();
    sound.destroy();

    expect(play).toHaveBeenCalledTimes(2);
    expect(pause).toHaveBeenCalledTimes(3);
  });

  it("does not resume one-shot sounds that finished before pausing", () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    const play = vi.mocked(HTMLMediaElement.prototype.play);
    const sound = new Sound("/sounds/ui/game_start.wav", { autoplay: false });

    sound.play();
    play.mockClear();
    HTMLMediaElement.prototype.dispatchEvent.call(
      (sound as unknown as { _theSound: HTMLAudioElement })._theSound,
      new Event("ended")
    );

    Sound.pauseAll();
    Sound.resumePaused();
    sound.destroy();

    expect(play).not.toHaveBeenCalled();
  });

  it("handles browser autoplay rejections without leaking active sound state", async () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    const play = vi.mocked(HTMLMediaElement.prototype.play);

    play.mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"));

    const sound = new Sound("/sounds/ui/game_start.wav", { autoplay: false });

    sound.play();
    await Promise.resolve();
    Sound.pauseAll();
    Sound.resumePaused();
    sound.destroy();

    expect(play).toHaveBeenCalledTimes(1);
  });
});
