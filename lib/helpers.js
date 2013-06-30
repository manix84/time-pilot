define("lib/helpers", function () {
    var helpers = {

        /**
         * Takes an extremely long number and reduces it decimal place to 5.
         * @method
         * @param   {Number} number - The number you wish to be cleaned up.
         * @returns {Float}
         */
        float: function (number) {
            return parseFloat(number.toFixed(5));
        }
    };

    return helpers;
});
