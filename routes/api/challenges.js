var _ = require('underscore'),
    keystone = require('keystone');
var Challenge = keystone.list('Challenge'),
    UserChallenge = keystone.list('UserChallenge'),
    async = require('async'),
    i18n = require('i18next');

/*
 * Get all active challenges
 * */
exports.list = function(req, res) {
    Challenge.model.find({status: 1}).populate('waypoints').exec(function(err, challenges) {
        if (err) return res.apiError('1000', i18n.t('1000'));
        if(!challenges) { return res.apiResponse({challenges: []}); }
        
        UserChallenge.model.find({user: req.user._id, complete: true}).exec(function(err, userChallenges){
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
            async.each(challenges, function(challenge, cb) {
                challenge.getMediaHavenUrls(function(challenge) {
                    cb();
                });
            }, function(err) {
                return res.apiResponse({
                    challenges: challenges
                });
            });
        });
    });
}

/*
 * Get Challenge by id
 * */
exports.get = function(req, res) {
    console.log("Find Challenge!");
    Challenge.model.findOne({_id: req.params.id, status: 1}).populate('waypoints').exec(function(err, challenge) {
        console.log("Challenge found!");
        if(err) return res.apiError('1000', i18n.t('1000'));
        if(!challenge) return res.apiError('1021', i18n.t('1021'));
        console.log("Get Challenge media!");
        challenge.getMediaHavenUrls(function(challenge){
            console.log("Challenge media retrieved!");
            return res.apiResponse({
                challenge: challenge
            });
        });
    });
}


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
        if (err) return res.apiError('1000', i18n.t('1000'));

        UserChallenge.model.find({user: req.user._id, complete: true}).exec(function (err, userChallenges) {
            challenges = _.reject(challenges, function (challenge) {
                var playedBefore = _.find(userChallenges, function (userChallenge) {
                    if (userChallenge.challenge.toString() === challenge._id.toString()) {
                        return true;
                    }
                    return false;
                });
                if (playedBefore && !challenge.repeatable) {
                    return true;
                } else {
                    return false;
                }
            });
            async.each(challenges, function (challenge, cb) {
                challenge.getMediaHavenUrls(function (challenge) {
                    cb();
                });
            }, function (err) {
                return res.apiResponse({
                    challenges: challenges
                });
            });
        });
        
    });
}
