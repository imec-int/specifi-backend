exports.PERSONAL_MARKER = "personalmarker";
exports.WAYPOINT = "waypoint";


/**
 * Checks if the cooldown time has passed and the user can scan the QR code again
 * @param lastScan Datetime indicating when the last scan took place
 * @param cooldown Time in seconds to the cooldown lasts
 * @returns True if cooldown time has passed, false if not
 */
exports.isCooldownOver = function(lastScan, cooldown) {
    var diff = moment(moment()).diff(lastScan,'seconds');
    var cooldown = parseInt(cooldown,10);
    return diff > cooldown;
};