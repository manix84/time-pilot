/* global define */
define("engine/Sound", function () {

    /**
     * Games Engine v0.1 - Sound
     * @author  Rob Taylor [manix84@gmail.com]
     * @param {String|Array}    urls - Sets the audio source urls.
     * @param {Object}          [options] - Options for the current sound.
     * @constructor
     */
    var Sound = function (urls, userOptions) {
        userOptions = userOptions || {};

        var options = {
                loop: false,
                autoplay: false
            },
            i = 0,
            property, source;

        if (typeof urls === 'undefined') {
            throw new Error('You must set an audio url.');
        } else if (typeof urls === 'string') {
            urls = [urls];
        }

        for (property in userOptions) {
            if (options.hasOwnProperty(property) && userOptions.hasOwnProperty(property)) {
                options[property] = userOptions[property];
            }
        }

        this._theSound = new Audio();
        for (; i < urls.length; i++) {
            window.console.log('Adding source:', urls[i]);
            source = document.createElement('source');
            source.src = urls[i];

            this._theSound.appendChild(source);
        }

        this._theSound.load();
        this._theSound.loop = (options.loop && !options.instantDestroy);
        this._theSound.preload = 'auto';
        this._theSound.autoplay = !!options.autoplay;
        this._theSound.controls = false;

        this._theSound.addEventListener('canplay', _canPlayListener, false);
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
            this._theSound.removeEventListener('canplay', _canPlayListener, false);
            delete this._theSound;
        }
    };

    /**
     * Sets the flag to skip the load check for sound file.
     * @method _canPlayListener
     * @private
     */
    var _canPlayListener = function () {
        this.canPlay = true;
    };



    return Sound;

});
