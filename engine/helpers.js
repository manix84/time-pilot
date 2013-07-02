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
         * WORK IN PROGRESS!!!
         * TODO: Finalise this!
         * @method
         * @param   {Player Instance} player        [description]
         * @param   {Canvas Instance} canvas        [description]
         * @param   {Game Rules Object} gameRules   [description]
         * @returns {Object}
         */
        getSpawnCoords: function (player, canvas, gameRules) {
            var data = {},
                heading, radius;

            heading = ((player.heading - (gameRules.spawnArc / 2)) + Math.floor(Math.random() * gameRules.spawnArc));
            radius = Math.abs(
                    (canvas.height / 2) + (canvas.width / 2)
                ) + (gameRules.spawnRadius / 2);

            data.posX = player.posX + (canvas.width / 2);
            data.posY = player.posY + (canvas.height / 2);

            data.posX += this.float(Math.sin(heading * (Math.PI / 180)) * radius);
            data.posY -= this.float(Math.cos(heading * (Math.PI / 180)) * radius);

            return data;
        },

        /**
         *
         * @method
         * @param   {Object} targetA - Object containing posX and posY
         * @param   {Object} targetB - Object containing posX and posY
         * @returns {Float} The number of degrees to turn (+/-) to be pointing towards targetA.
         */
        findHeading: function (targetA, targetB) {
            var heading = Math.atan2(
                (targetA.posX - targetB.posX),
                (targetA.posY - targetB.posY)
            ) * (180 / Math.PI);
            return ((heading > 0) ? (360 - heading) : Math.abs(heading));
        },

        /**
         * Detect if two object impact each other.
         * @method
         * @param   {Object} targetA - Object containing posX, posY, and Radius.
         * @param   {Object} targetB - Object containing posX, posY, and Radius.
         * @returns {Boolean}
         */
        detectCollision: function (targetA, targetB) {
            var dx = targetA.posX - targetB.posX,
                dy = targetA.posY - targetB.posY,
                dist = targetA.radius + targetB.radius;

            return (dx * dx + dy * dy <= dist * dist);
        },

        /**
         * Detect if a point is within a specified distance of a radial center.
         * @method
         * @param   {Object} radialCenter Object containing posX and posY.
         * @param   {Object} target       Object containing posX and posY.
         * @param   {Number} radius       Distance from the radial center to be considered inside.
         * @returns {Boolean}
         */
        detectAreaExit: function (radialCenter, target, radius) {
            var dx = radialCenter.posX - target.posX,
                dy = radialCenter.posY - target.posY;

            return (dx * dx + dy * dy >= radius * radius);
        }

    };

    return helpers;
});
