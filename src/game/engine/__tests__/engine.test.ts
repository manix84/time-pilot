import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GameArena from "../arena";
import Sound from "../Sound";
import Ticker from "../Ticker";

const soundOptionsChangedEvent = "test:soundOptionsChanged";
let volumeSettings = {
  effects: 8,
  master: 10,
  music: 8,
};

const dispatchSoundOptionsChanged = (): void => {
  window.dispatchEvent(new CustomEvent(soundOptionsChangedEvent));
};

describe("engine modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    volumeSettings = {
      effects: 8,
      master: 10,
      music: 8,
    };
    Sound.configure({
      getVolume: (channel) => {
        const channelVolume =
          channel === "music" ? volumeSettings.music : volumeSettings.effects;

        return (volumeSettings.master / 10) * (channelVolume / 10);
      },
      volumeChangeEventName: soundOptionsChangedEvent,
      volumeChangeEventTarget: window,
    });
  });

  afterEach(() => {
    Sound.destroyAll();
    Sound.configure();
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

  it("runs fixed-step schedules at a stable simulation rate across render frames", () => {
    const animationFrames: FrameRequestCallback[] = [];
    const requestAnimationFrameSpy = vi.mocked(window.requestAnimationFrame);
    requestAnimationFrameSpy.mockImplementation((callback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    const ticker = new Ticker({ fixedStepFps: 50 });
    const scheduled = vi.fn();

    ticker.addSchedule(scheduled, 1);
    ticker.start();

    animationFrames.shift()?.(0);
    animationFrames.shift()?.(16);
    expect(scheduled).not.toHaveBeenCalled();

    animationFrames.shift()?.(40);
    expect(scheduled).toHaveBeenCalledTimes(2);
    expect(scheduled).toHaveBeenNthCalledWith(1, 1);
    expect(scheduled).toHaveBeenNthCalledWith(2, 2);

    animationFrames.shift()?.(56);
    expect(scheduled).toHaveBeenCalledTimes(2);

    animationFrames.shift()?.(60);
    expect(scheduled).toHaveBeenCalledTimes(3);
    expect(scheduled).toHaveBeenLastCalledWith(3);

    ticker.stop();
  });

  it("creates playable sounds", () => {
    const sound = new Sound("/sounds/player/bullet.ogg", { autoplay: false });

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
    const sound = new Sound("/sounds/player/bullet.ogg", { autoplay: false });

    sound.play();
    Sound.pauseAll();
    Sound.resumePaused();
    Sound.stopAll();
    sound.destroy();

    expect(play).toHaveBeenCalledTimes(2);
    expect(pause).toHaveBeenCalledTimes(3);
  });

  it("uses the music volume for music-channel sounds", () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    volumeSettings = {
      effects: 9,
      master: 5,
      music: 4,
    };
    dispatchSoundOptionsChanged();
    const sound = new Sound("/music/main_menu.ogg", {
      autoplay: false,
      channel: "music",
    });
    const element = (sound as unknown as { _theSound: HTMLAudioElement })
      ._theSound;

    sound.loop();

    expect(element.volume).toBeCloseTo(0.2);

    volumeSettings.music = 2;
    dispatchSoundOptionsChanged();

    expect(element.volume).toBeCloseTo(0.1);

    sound.destroy();
  });

  it("does not resume one-shot sounds that finished before pausing", () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    const play = vi.mocked(HTMLMediaElement.prototype.play);
    const sound = new Sound("/music/game_start.ogg", { autoplay: false });

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

  it("calls an ended callback when a one-shot sound finishes", () => {
    const onEnded = vi.fn();
    const sound = new Sound("/music/game_start.ogg", {
      autoplay: false,
      onEnded,
    });

    HTMLMediaElement.prototype.dispatchEvent.call(
      (sound as unknown as { _theSound: HTMLAudioElement })._theSound,
      new Event("ended")
    );

    expect(onEnded).toHaveBeenCalledTimes(1);

    sound.destroy();
  });

  it("destroys fade-out sounds when a global stop cancels the fade", () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    volumeSettings = {
      effects: 8,
      master: 10,
      music: 5,
    };
    dispatchSoundOptionsChanged();
    const sound = new Sound("/music/main_menu.ogg", {
      autoplay: false,
      channel: "music",
      loop: true,
    });
    const element = (sound as unknown as { _theSound: HTMLAudioElement })
      ._theSound;

    sound.loop();
    expect(element.volume).toBeCloseTo(0.5);

    sound.fadeOutAndDestroy(700);
    Sound.stopAll();
    volumeSettings.music = 2;
    dispatchSoundOptionsChanged();

    expect(element.volume).toBeCloseTo(0.5);
  });

  it("handles browser autoplay rejections without leaking active sound state", async () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    const play = vi.mocked(HTMLMediaElement.prototype.play);

    play.mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"));

    const sound = new Sound("/music/game_start.ogg", { autoplay: false });

    sound.play();
    await Promise.resolve();
    Sound.pauseAll();
    Sound.resumePaused();
    sound.destroy();

    expect(play).toHaveBeenCalledTimes(1);
  });

  it("notifies configured consumers when sound playback is blocked", async () => {
    Object.defineProperty(HTMLMediaElement.prototype, "canPlay", {
      configurable: true,
      value: true,
    });
    const onPlaybackBlocked = vi.fn();
    const play = vi.mocked(HTMLMediaElement.prototype.play);

    Sound.configure({
      onPlaybackBlocked,
    });
    play.mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"));

    const sound = new Sound("/music/game_start.ogg", {
      autoplay: false,
      channel: "music",
    });

    sound.play();
    await Promise.resolve();
    sound.destroy();

    expect(onPlaybackBlocked).toHaveBeenCalledTimes(1);
    expect(onPlaybackBlocked).toHaveBeenCalledWith({
      channel: "music",
      sources: ["/music/game_start.ogg"],
    });
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

    const sound = new Sound("/sounds/player/bullet.ogg", { autoplay: false });

    sound.setSpatialPosition(10, 0, 100, 100);
    sound.play();
    sound.destroy();

    expect(sourceDisconnect).toHaveBeenCalled();
    expect(pannerDisconnect).toHaveBeenCalled();
    expect(contextClose).toHaveBeenCalled();
  });
});
