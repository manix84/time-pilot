/* Converted from engine/Sound.js (AMD) to ESM TypeScript. */
/**
 * Games Engine v0.1 - Sound
 * @author  Rob Taylor [manix84@gmail.com]
 * @param {String|Array}    urls - Sets the audio source urls.
 * @param {Object}          [options] - Options for the current sound.
 * @constructor
 */
interface SoundOptions {
  loop?: boolean;
  autoplay?: boolean;
  instantDestroy?: boolean;
}

interface TimePilotAudioElement extends HTMLAudioElement {
  canPlay?: boolean;
}

var Sound = function (urls: string | string[], userOptions?: SoundOptions) {
  userOptions = userOptions || {};

  var options = {
    loop: false,
    autoplay: false,
    instantDestroy: false,
  };
  var i = 0;
  var property: keyof SoundOptions;
  var source: HTMLSourceElement;

  if (typeof urls === "undefined") {
    throw new Error("You must set an audio url.");
  } else if (typeof urls === "string") {
    urls = [urls];
  }

  for (property in userOptions) {
    if (
      options.hasOwnProperty(property) &&
      userOptions.hasOwnProperty(property)
    ) {
      options[property] = userOptions[property];
    }
  }

  this._theSound = new Audio() as TimePilotAudioElement;
  for (; i < urls.length; i++) {
    window.console.log("Adding source:", urls[i]);
    source = document.createElement("source");
    source.src = urls[i];

    this._theSound.appendChild(source);
  }

  this._theSound.load();
  this._theSound.loop = options.loop && !options.instantDestroy;
  this._theSound.preload = "auto";
  this._theSound.autoplay = !!options.autoplay;
  this._theSound.controls = false;

  this._theSound.addEventListener("canplay", _canPlayListener, false);
} as unknown as {
  new (urls: string | string[], userOptions?: SoundOptions): {
    play: () => void;
    loop: () => void;
    pause: () => void;
    stop: () => void;
    destroy: () => void;
  };
  prototype: Record<string, unknown>;
};

Sound.prototype = {
  /**
   * Play the sound, once
   * @method play
   */
  play: function () {
    this._theSound.loop = false;
    if (this._theSound.canPlay) {
      this._theSound.play();
    }
  },

  /**
   * Play the sound, looped
   * @method loop
   */
  loop: function () {
    this._theSound.loop = true;
    if (this._theSound.canPlay) {
      this._theSound.play();
    }
  },

  /**
   * Pause audio file.
   * @method pause
   */
  pause: function () {
    this._theSound.pause();
  },

  /**
   * Stop and remove the sound file from play and pause.
   * @method stop
   */
  stop: function () {
    this._theSound.pause();
    if (this._theSound.currentTime > 0) {
      this._theSound.currentTime = 0;
    }
  },

  /**
   * Destroy sound file.
   * @method destroy
   */
  destroy: function () {
    this.stop();
    this._theSound.removeEventListener("canplay", _canPlayListener, false);
    delete this._theSound;
  },
};

/**
 * Sets the flag to skip the load check for sound file.
 * @method _canPlayListener
 * @private
 */
var _canPlayListener = function (this: TimePilotAudioElement): void {
  this.canPlay = true;
};

export default Sound;
