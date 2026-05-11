/* Converted from engine/Sound.js (AMD) to ESM TypeScript. */
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
  private _theSound: TimePilotAudioElement;

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
  }

  play(): void {
    this._theSound.loop = false;
    if (this._theSound.canPlay) {
      this._theSound.play();
    }
  }

  loop(): void {
    this._theSound.loop = true;
    if (this._theSound.canPlay) {
      this._theSound.play();
    }
  }

  pause(): void {
    this._theSound.pause();
  }

  stop(): void {
    this._theSound.pause();
    if (this._theSound.currentTime > 0) {
      this._theSound.currentTime = 0;
    }
  }

  destroy(): void {
    this.stop();
    this._theSound.removeEventListener("canplay", canPlayListener, false);
  }
}

export default Sound;
