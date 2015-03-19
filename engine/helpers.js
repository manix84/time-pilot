define("engine/helpers", function () {
    var helpers = {

        /**
         * Takes an extremely long number and reduces it decimal place to 5.
         * @method
         * @param   {Number} number - The number you wish to be cleaned up.
         * @returns {Float}
         */
        float: function (number) {
            return parseFloat(number.toFixed(5));
        },

        /**
         * Given the current angle and the desired angle, try to get their using the limited step size provided.
         * @method
         * @param   {Number} destinationAngle
         * @param   {Number} currentAngle
         * @param   {Number} stepSize         - Number of degrees that can be moved at a time.
         * @returns {Number}
         */
        rotateTo: function (destinationAngle, currentAngle, stepSize) {
            var direction = Math.atan2(
                    parseFloat(Math.sin((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(15)),
                    parseFloat(Math.cos((destinationAngle - currentAngle) * (Math.PI / 180)).toFixed(15))
                );

            if (direction > 0) {
                currentAngle += stepSize;
            } else if (direction < 0) {
                currentAngle -= stepSize;
            }
            currentAngle += currentAngle >= 360 ? -360 : (currentAngle < 0 ? 360 : 0);

            return currentAngle;
        },

        /**
         * Takes the player's position and heading then returns a random spawning location within that.
         * @method
         * @param     {Object} target
         * @property  {Number} target.heading     - Heading of the target.
         * @property  {Number} target.posX        - X position of the target.
         * @property  {Number} target.posY        - Y position of the target.
         * @returns {Object}
         */
        getSpawnCoords: function (target) {
            var data = {},
                spawnRadius = 450,
                spawnArc = 80,
                heading;

            heading = ((target.heading - (spawnArc / 2)) + Math.floor(Math.random() * spawnArc));

            data.posX = target.posX;
            data.posY = target.posY;

            data.posX += this.float(Math.sin(heading * (Math.PI / 180)) * spawnRadius);
            data.posY -= this.float(Math.cos(heading * (Math.PI / 180)) * spawnRadius);

            return data;
        },

        /**
         *
         * @method
         * @param     {Object} target               - Object containing posX and posY
         * @property  {Number} target.posX          - X position of the target.
         * @property  {Number} target.posY          - Y position of the target.
         * @property  {Number} target.heading       - Heading of the target.
         * @param     {Object} [origin]             - Object containing posX and posY
         * @property  {Number} [origin.posX]        - X position of the origin.
         * @property  {Number} [origin.posY]        - Y position of the origin.
         * @property  {Number} [origin.heading]     - Heading of the origin.
         * @returns {Float} The number of degrees to turn (+/-) to be pointing towards target.
         */
        findHeading: function (target, origin) {
            origin = origin || {
                posX: 0,
                posY: 0
            };
            var heading = Math.atan2(
                (target.posX - origin.posX),
                (target.posY - origin.posY)
            ) * (180 / Math.PI);
            return ((heading > 0) ? (360 - heading) : Math.abs(heading));
        },

        /**
         * Detect if two object impact each other.
         * @method
         * @param     {Object} target               - Object containing posX, posY, and Radius of the target.
         * @property  {Number} target.posX          - X position of the target.
         * @property  {Number} target.posY          - Y position of the target.
         * @property  {Number} target.radius        - Radius of the target.
         * @param     {Object} [origin]             - Object containing posX, posY and Radius of the origin.
         * @property  {Number} [origin.posX]        - X position of the origin.
         * @property  {Number} [origin.posY]        - Y position of the origin.
         * @property  {Number} [origin.radius]      - Radius of the origin.
         * @returns {Boolean}
         */
        detectCollision: function (target, origin) {
            origin = origin || {
                posX: 0,
                posY: 0
            };
            var dx = target.posX - origin.posX,
                dy = target.posY - origin.posY,
                dist = target.radius + origin.radius;

            return (dx * dx + dy * dy <= dist * dist);
        },

        /**
         * Detect if a point is within a specified distance of a radial center.
         * @method
         * @param     {Object} radialCenter         - Object containing posX and posY.
         * @property  {Number} radialCenter.posX    - X position of the radialCenter.
         * @property  {Number} radialCenter.posY    - Y position of the radialCenter.
         * @param     {Object} target               - Object containing posX and posY.
         * @property  {Number} target.posX          - X position of the target.
         * @property  {Number} target.posY          - Y position of the target.
         * @param     {Number} radius               - Distance from the radial center to be considered inside.
         * @returns   {Boolean}
         */
        detectAreaExit: function (radialCenter, target, radius) {
            var dx = radialCenter.posX - target.posX,
                dy = radialCenter.posY - target.posY;

            return (dx * dx + dy * dy >= radius * radius);
        },

        /**
         * Bind to a given list of events
         * @method
         * @param   {String|Array}  eventNames      - Either a space delimited string or an array of events to listen to
         * @param   {Function}      callback        - Function to be run when the event is fired.
         * @param   {DOM Node}      [element=body]  - Element to attach the listener too.
         */
        bind: function (eventNames, callback, element) {
            element = element || document.documentElement;

            if (typeof eventNames === "string") {
                eventNames = eventNames.split(" ");
            }

            for (var i = 0, l = eventNames.length; i < l; ++i) {
                if (typeof element.addEventListener === "function") {
                    element.addEventListener(eventNames[i], callback, false);
                } else if (!!element.attachEvent) {
                    element.attachEvent("on" + eventNames[i], callback);
                }
            }
        },

        unbind: function () {}

    };

    return helpers;
});
