var highscoreUtils = require("../../lib/util/highscore-utils"),
    i18n = require('i18next');

/*
 * Returns the top x users off all time
 * */
exports.topHighscores = function(req, res) {
    highscoreUtils.topHighscores(req.params.top, function(err, scores) {
        if(err) { return res.apiError(err, i18n.t(err)); }
        return res.apiResponse(scores);
    });
};


/*
* Returns the weekly highscores
* */
exports.weeklyHighscores = function(req, res) {
    highscoreUtils.weeklyHighscores(req.params.top, function(err, scores) {
        if(err) { return res.apiError(err, i18n.t(err)); }
        return res.apiResponse(scores);
    });
};

/*
 * Get highscores around the player
 * */
exports.personalHighscores = function(req, res) {
    highscoreUtils.personalHighscores(req.user, function(err, scores) {
        if(err) { return res.apiError(err, i18n.t(err)); }
        return res.apiResponse(scores);
    });
};
