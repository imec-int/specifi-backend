var _ =require('underscore'),
    pjson = require('../../package.json'),
    keystone = require('keystone'),
    GameSetting = keystone.list('GameSetting'),
    async = require('async'),
    i18n = require('i18next');
  
var Challenge = keystone.list('Challenge'),
    UserChallenge = keystone.list('UserChallenge');

/*
* Ping returns a JSON object if the server is up and running
* */
exports.ping = function(req, res) {
    return res.apiResponse({
        "connection": "1",
        "version": pjson.version,
        "time": new Date(),
        "minAppVersion": process.env.MIN_APP_VERSION || '1.4.5'
    });
};


/*
 * Returns all game settings
 * */
exports.settings = function(req, res) {
    GameSetting.model.find().exec(function(err, settings) {
        if(err) { return res.apiError('1040', i18n.t('1040')); }
        res.apiResponse({settings: settings});
    });
};


/*
 * Get all Challenges nearby the given location within a given radius (in meters)
 * */
exports.getNearby = function(req, res) {
    var maxDistance = (req.params.distance) ? keystone.utils.number(req.params.distance) : 1000;
    var location = [];
    _.each(req.params.location.split(','), function(coordinate){
        location.push(keystone.utils.number(coordinate));
    });
    if(location === [] || location.length < 2) return res.apiError('1026', i18n.t('1026'));

	Challenge.model.find({status: 1, "location.geo": {$near: { $geometry:{ type: "Point", coordinates: location }, $maxDistance: maxDistance}}}).populate('waypoints').exec(function(err, challenges) {
		if(err) return res.apiError('1000', i18n.t('1000'));
		if(!challenges) return res.apiResponse({challenges: []});
		UserChallenge.model.find({user: req.user._id, complete: true}).exec(function(err, userChallenges){
			if(err) return res.apiError('1000', i18n.t('1000'));
			challenges = _.reject(challenges, function(challenge){
				var playedBefore = _.find(userChallenges, function(userChallenge){
					if(userChallenge.challenge.toString() === challenge._id.toString()) {
						return true;
					}
					return false;
				});
				if(playedBefore && !challenge.repeatable) {
					return true;
				} else {
					return false;
				}
			});
			
			return res.apiResponse({challenges: challenges});
		});
	});
};

/*
 * Links to the privacy and terms and conditions document
 */
exports.privacy = function(req, res) {
	return res.redirect("https://www.iminds.be/nl/digitaal-onderzoek/proeftuinonderzoek/algemene-voorwaarden");
}


