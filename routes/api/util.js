var _ =require('underscore'),
    pjson = require('../../package.json'),
    keystone = require('keystone'),
    GameSetting = keystone.list('GameSetting'),
    async = require('async'),
    request = require('request'),
    i18n = require('i18next');
  
var Challenge = keystone.list('Challenge'),
    PersonalMarker = keystone.list('PersonalMarker'),
    MeetingHotspotTemplate = keystone.list('MeetingHotspotTemplate'),
    MeetingHotspot = keystone.list('MeetingHotspot'),
    UserChallenge = keystone.list('UserChallenge');

/*
* Ping returns a JSON object if the server is up and running
* */
exports.ping = function(req, res) {
    return res.apiResponse({
        "connection": "1",
        "version": pjson.version,
        "time": new Date(),
        "minAppVersion": process.env.MIN_APP_VERSION || '1.0.0'
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
 * Get all Challenges, PersonalMarkers and MeetingHotspots nearby the given location within a given radius (in meters)
 * */
exports.getNearby = function(req, res) {
    var maxDistance = (req.params.distance) ? keystone.utils.number(req.params.distance) : 1000;
    var location = [];
    _.each(req.params.location.split(','), function(coordinate){
        location.push(keystone.utils.number(coordinate));
    });
    if(location === [] || location.length < 2) return res.apiError('1026', i18n.t('1026'));

    async.parallel({
            challenges: function(callback){
                Challenge.model.find({status: 1, "location.geo": {$near: { $geometry:{ type: "Point", coordinates: location }, $maxDistance: maxDistance}}}).populate('waypoints').exec(function(err, challenges) {
                    if(err) callback(err);
                    if(!challenges) { callback([]); }
                    UserChallenge.model.find({user: req.user._id, complete: true}).exec(function(err, userChallenges){
                        if(err) { callback(err); }
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
                            callback(null, challenges);
                        });
                    });
                });
            },
            meetinghotspots: function(callback){
                MeetingHotspotTemplate.model.find({"location.geo": {$near: { $geometry:{ type: "Point", coordinates: location }, $maxDistance: maxDistance}}}).exec(function(err,templates) {
                    templates = _.pluck(templates, '_id');
                    MeetingHotspot.model.find({ end:{ $gte: Date.now() }, template:{$in: templates} }).populate('template').exec(function(err, hotspots) {
                        if(err) return callback(err);
                        callback(null, hotspots);
                    });
                });
            },
            personalmarkers: function(callback){
                PersonalMarker.model.find({user:{$ne:req.user._id}, "location.geo": {$near: { $geometry:{ type: "Point", coordinates: location }, $maxDistance: maxDistance}}}).populate('user').exec(function(err, markers) {
                    if(err) callback(err);
                    callback(null, markers);
                });
            }
        },
        function(err, results) {
            if(err) return res.apiError('1000', i18n.t('1000'));
            return res.apiResponse(results);
        });
}

/*
 * Gets a mediahaven url based on a media object id
 * */
exports.getMediahavenUrl = function(req, res) {
    var objectId = req.params.objectId;
    
    if(!objectId || objectId === "") {
        return res.apiError("1201", i18n.t('1201'));
    }
    
    var options = {
        port:443,
        strictSSL:false,
        timeout: 2000
    };
    var url = process.env.MEDIAHAVEN_HOST+process.env.MEDIAHAVEN_PATH+'/'+objectId;
    console.log("Call MediaHaven API: " + url);
    request.get(url, options, function(err, message, media) {
        var mediaJSON;
        console.log("MediaHaven API response: " + JSON.stringify(media));
        console.log("MediaHaven API error: " + JSON.stringify(err));
        try{
            mediaJSON = JSON.parse(media);
        }
        catch(err) {
            mediaJSON = null;
        }
        console.log("MediaHaven media JSON: " + JSON.stringify(mediaJSON));
        if(mediaJSON) {
            return res.apiResponse({
                image: mediaJSON.previewImagePath,
                video: mediaJSON.videoPath
            });
        } else {
            return res.apiResponse(null);
        }
    }).auth(process.env.MEDIAHAVEN_USERNAME, process.env.MEDIAHAVEN_PW);
};
