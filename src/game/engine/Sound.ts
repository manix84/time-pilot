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

const canPlayListener = function (this: TimePilotAudioElement): void {
  this.canPlay = true;
};

class Sound {
  private static _instances = new Set<Sound>();
  private static _isMuted = false;
  private static _pausedInstances = new Set<Sound>();
  private _isPlaying = false;
  private _theSound: TimePilotAudioElement;
  private _markEnded = (): void => {
    this._isPlaying = false;
    Sound._pausedInstances.delete(this);
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

    this._theSound.addEventListener("canplay", canPlayListener, false);
    this._theSound.addEventListener("ended", this._markEnded, false);
    Sound._instances.add(this);
  }

  play = (): void => {
    this._theSound.loop = false;
    if (this._theSound.canPlay) {
      this.applyVolume();
      this.playElement();
    }
  };

  loop = (): void => {
    this._theSound.loop = true;
    if (this._theSound.canPlay) {
      this.applyVolume();
      this.playElement();
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
    if (this._theSound.currentTime > 0) {
      this._theSound.currentTime = 0;
    }
  };

  destroy = (): void => {
    this.stop();
    this._theSound.removeEventListener("canplay", canPlayListener, false);
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
    const playPromise = this._theSound.play();

    this._isPlaying = true;

    if (playPromise) {
      void playPromise.catch(() => {
        this._isPlaying = false;
        Sound._pausedInstances.delete(this);
      });
    }
  };
}

export default Sound;
