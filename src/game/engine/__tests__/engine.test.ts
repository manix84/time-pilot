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
    expect(host.querySelector("canvas")?.tabIndex).toBe(0);
    expect(arena.width).toBe(640);
    expect(arena.height).toBe(480);
  });

  it("renders spaced text with expanded spacing and stroke alignment", () => {
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: 640 });
    Object.defineProperty(host, "clientHeight", { value: 480 });

    const arena = new GameArena(host);
    const context = arena.getContext() as CanvasRenderingContext2D;
    const fillText = vi.spyOn(context, "fillText");
    const strokeText = vi.spyOn(context, "strokeText");
    const measureText = vi.fn(
      (text) =>
        ({
          width: text === " " ? 4 : 10,
        }) as TextMetrics
    );
    context.measureText = measureText;

    arena.renderText("A B", 100, 20, {
      align: "center",
      stroke: "#123",
      strokeWidth: 2,
    });

    expect(measureText).toHaveBeenCalledWith("A");
    expect(measureText).toHaveBeenCalledWith(" ");
    expect(measureText).toHaveBeenCalledWith("B");
    expect(fillText).toHaveBeenCalledWith("A", 86, 20);
    expect(fillText).toHaveBeenCalledWith("B", 104, 20);
    expect(strokeText).toHaveBeenCalledWith("A", 86, 20);
    expect(strokeText).toHaveBeenCalledWith("B", 104, 20);
    expect(fillText).not.toHaveBeenCalledWith(" ", expect.any(Number), 20);
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

  it("toggles browser fullscreen using current document state", () => {
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: 640 });
    Object.defineProperty(host, "clientHeight", { value: 480 });

    let fullscreenElement: Element | null = null;
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: vi.fn(() => {
        fullscreenElement = null;
        document.dispatchEvent(new Event("fullscreenchange"));
      }),
    });

    const arena = new GameArena(host);
    Object.defineProperty(host, "requestFullscreen", {
      configurable: true,
      value: vi.fn(() => {
        fullscreenElement = host;
        document.dispatchEvent(new Event("fullscreenchange"));
      }),
    });

    arena.toggleFullScreen();

    expect(host.requestFullscreen).toHaveBeenCalled();
    expect(arena.isFullScreen()).toBe(true);

    fullscreenElement = null;
    document.dispatchEvent(new Event("fullscreenchange"));

    expect(arena.isFullScreen()).toBe(false);

    arena.toggleFullScreen();
    expect(host.requestFullscreen).toHaveBeenCalledTimes(2);

    arena.toggleFullScreen();
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(arena.isFullScreen()).toBe(false);
  });

  it("allows fullscreen toggling when installed display falls back to standalone", () => {
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: 640 });
    Object.defineProperty(host, "clientHeight", { value: 480 });
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true,
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      }))
    );

    const arena = new GameArena(host);
    Object.defineProperty(host, "requestFullscreen", {
      configurable: true,
      value: vi.fn(),
    });

    expect(arena.isFullScreenLocked()).toBe(false);
    expect(arena.canToggleFullScreen()).toBe(true);
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

  it("disconnects and closes spatial audio resources on destroy", () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    const sourceDisconnect = vi.fn();
    const pannerDisconnect = vi.fn();
    const contextClose = vi.fn(() => Promise.resolve());
    const source = {
      connect: vi.fn(),
      disconnect: sourceDisconnect,
    };
    const panner = {
      connect: vi.fn(() => ({})),
      disconnect: pannerDisconnect,
      positionX: { value: 0 },
      positionY: { value: 0 },
      positionZ: { value: 0 },
    };
    const createMediaElementSource = vi.fn(
      (_mediaElement: HTMLMediaElement) =>
        source as unknown as MediaElementAudioSourceNode
    );

    source.connect.mockReturnValue(panner);

    class MockAudioContext {
      destination = {} as AudioDestinationNode;
      close = contextClose;
      createMediaElementSource = createMediaElementSource;
    }

    class MockPannerNode {
      connect = panner.connect;
      disconnect = panner.disconnect;
      positionX = panner.positionX;
      positionY = panner.positionY;
      positionZ = panner.positionZ;
    }

    vi.stubGlobal("AudioContext", MockAudioContext);
    vi.stubGlobal("PannerNode", MockPannerNode);

    const sound = new Sound("/sounds/player/bullet.mp3", { autoplay: false });

    sound.setSpatialPosition(10, 0, 100, 100);
    sound.play();
    sound.destroy();

    expect(sourceDisconnect).toHaveBeenCalled();
    expect(pannerDisconnect).toHaveBeenCalled();
    expect(contextClose).toHaveBeenCalled();
  });
});
