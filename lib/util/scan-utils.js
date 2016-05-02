exports.WAYPOINT = "waypoint";


/**
 * Checks if the cooldown time has passed and the user can do the action again
 * @param lastAction Datetime indicating when the last action took place
 * @param cooldown Time in seconds to the cooldown lasts
 * @returns True if cooldown time has passed, false if not
 */
exports.isCooldownOver = function(lastAction, cooldown) {
    var diff = moment(moment()).diff(lastAction,'seconds');
    var cooldown = parseInt(cooldown,10);
    return diff > cooldown;
};
