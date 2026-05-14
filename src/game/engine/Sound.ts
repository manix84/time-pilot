/* Converted from engine/Sound.js (AMD) to ESM TypeScript. */
import userOptions from "../user-options";

interface SoundOptions {
  loop?: boolean;
  autoplay?: boolean;
  instantDestroy?: boolean;
}

interface TimePilotAudioElement extends HTMLAudioElement {
  canPlay?: boolean;
}

type AudioContextConstructor = typeof AudioContext;

type SpatialAudioNodeSet = {
  context: AudioContext;
  mode: "3d" | "stereo";
  panner: PannerNode | StereoPannerNode;
  source: MediaElementAudioSourceNode;
};

class Sound {
  private static _instances = new Set<Sound>();
  private static _isMuted = false;
  private static _pausedInstances = new Set<Sound>();
  private readonly _instantDestroy: boolean;
  private _isPlaying = false;
  private _playMode?: "loop" | "play";
  private _pan = 0;
  private _position = { x: 0, y: 0 };
  private _spatialAudio?: SpatialAudioNodeSet;
  private _theSound: TimePilotAudioElement;
  private _markCanPlay = (): void => {
    this._theSound.canPlay = true;

    if (this._playMode) {
      this.applyVolume();
      this.playElement();
    }
  };
  private _markEnded = (): void => {
    this._isPlaying = false;
    this._playMode = undefined;
    Sound._pausedInstances.delete(this);

    if (this._instantDestroy) {
      this.destroy();
    }
  };

  static setMuted = (isMuted: boolean): void => {
    Sound._isMuted = isMuted;
  };

  static pauseAll = (): void => {
    Sound._pausedInstances.clear();

    Sound._instances.forEach((sound) => {
      if (!sound.isActive()) {
        return;
      }

      sound.pause();
      Sound._pausedInstances.add(sound);
    });
  };

  static resumePaused = (): void => {
    const pausedInstances = [...Sound._pausedInstances];

    Sound._pausedInstances.clear();
    pausedInstances.forEach((sound) => sound.resume());
  };

  static stopAll = (): void => {
    Sound._pausedInstances.clear();
    Sound._instances.forEach((sound) => sound.stop());
  };

  static destroyAll = (): void => {
    [...Sound._instances].forEach((sound) => sound.destroy());
    Sound._pausedInstances.clear();
  };

  constructor(urls: string | string[], userOptions: SoundOptions = {}) {
    const options = {
      loop: false,
      autoplay: false,
      instantDestroy: false,
      ...userOptions,
    };
    const soundUrls = typeof urls === "string" ? [urls] : urls;

    if (typeof urls === "undefined") {
      throw new Error("You must set an audio url.");
    }

    this._theSound = new Audio() as TimePilotAudioElement;
    this._instantDestroy = options.instantDestroy;

    for (const url of soundUrls) {
      window.console.log("Adding source:", url);
      const source = document.createElement("source");
      source.src = url;

      this._theSound.appendChild(source);
    }

    this._theSound.load();
    this._theSound.loop = options.loop && !options.instantDestroy;
    this._theSound.preload = "auto";
    this._theSound.autoplay = !!options.autoplay;
    this._theSound.controls = false;

    this._theSound.addEventListener("canplay", this._markCanPlay, false);
    this._theSound.addEventListener("ended", this._markEnded, false);
    Sound._instances.add(this);
  }

  play = (): void => {
    this._theSound.loop = false;
    this._playMode = "play";
    if (this._theSound.canPlay) {
      this.applyVolume();
      this.playElement();
    }
  };

  loop = (): void => {
    this._theSound.loop = true;
    this._playMode = "loop";
    if (this._theSound.canPlay) {
      this.applyVolume();
      this.playElement();
    }
  };

  setPan = (pan: number): void => {
    this._pan = Math.max(-1, Math.min(1, pan));

    if (this._spatialAudio?.mode === "stereo") {
      (this._spatialAudio.panner as StereoPannerNode).pan.value = this._pan;
    }
  };

  setSpatialPosition = (
    relativeX: number,
    relativeY: number,
    halfWidth: number,
    halfHeight: number
  ): void => {
    const safeHalfWidth = Math.max(1, halfWidth);
    const safeHalfHeight = Math.max(1, halfHeight);

    this._position = {
      x: Math.max(-1, Math.min(1, relativeX / safeHalfWidth)),
      y: Math.max(-1, Math.min(1, relativeY / safeHalfHeight)),
    };
    this.setPan(this._position.x);

    if (this._spatialAudio?.mode === "3d") {
      const panner = this._spatialAudio.panner as PannerNode;

      panner.positionX.value = this._position.x;
      panner.positionY.value = -this._position.y;
      panner.positionZ.value = 0;
    }
  };

  pause = (): void => {
    this._theSound.pause();
    this._isPlaying = false;
  };

  resume = (): void => {
    if (this._theSound.canPlay) {
      this.applyVolume();
      this.playElement();
    }
  };

  stop = (): void => {
    this._theSound.pause();
    this._isPlaying = false;
    this._playMode = undefined;
    if (this._theSound.currentTime > 0) {
      this._theSound.currentTime = 0;
    }
  };

  destroy = (): void => {
    this.stop();
    this.destroySpatialAudio();
    this._theSound.removeEventListener("canplay", this._markCanPlay, false);
    this._theSound.removeEventListener("ended", this._markEnded, false);
    Sound._instances.delete(this);
    Sound._pausedInstances.delete(this);
  };

  private isActive = (): boolean => {
    return this._isPlaying && !this._theSound.ended;
  };

  private applyVolume = (): void => {
    this._theSound.volume =
      Sound._isMuted
        ? 0
        : (userOptions.masterVolume / 10) * (userOptions.effectsVolume / 10);
  };

  private playElement = (): void => {
    this.ensureSpatialAudio();
    const playPromise = this._theSound.play();

    this._isPlaying = true;

    if (playPromise) {
      void playPromise.catch(() => {
        this._isPlaying = false;
        Sound._pausedInstances.delete(this);
      });
    }
  };

  private ensureSpatialAudio = (): void => {
    if (this._spatialAudio) {
      return;
    }

    const AudioContextClass = (
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: AudioContextConstructor })
        .webkitAudioContext
    );

    if (!AudioContextClass) {
      return;
    }

    try {
      const context = new AudioContextClass();
      const source = context.createMediaElementSource(this._theSound);

      if ("PannerNode" in window) {
        const panner = new PannerNode(context, {
          distanceModel: "inverse",
          panningModel: "HRTF",
          positionX: this._position.x,
          positionY: -this._position.y,
          positionZ: 0,
          refDistance: 1,
        });

        source.connect(panner).connect(context.destination);
        this._spatialAudio = { context, mode: "3d", panner, source };
        return;
      }

      if ("StereoPannerNode" in window) {
        const panner = new StereoPannerNode(context, { pan: this._pan });

        source.connect(panner).connect(context.destination);
        this._spatialAudio = { context, mode: "stereo", panner, source };
      }
    } catch {
      this._spatialAudio = undefined;
    }
  };

  private destroySpatialAudio = (): void => {
    if (!this._spatialAudio) {
      return;
    }

    const { context, panner, source } = this._spatialAudio;

    try {
      source.disconnect();
      panner.disconnect();
    } catch {
      // Spatial audio cleanup is best-effort; destroy should always unregister.
    }

    void context.close().catch(() => {});
    this._spatialAudio = undefined;
  };
}

export default Sound;
