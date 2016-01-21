var _ = require('underscore'),
    keystone = require('keystone'),
    moment = require('moment'),
    MeetingHotspot = keystone.list('MeetingHotspot'),
    MeetingHotspotTemplate = keystone.list('MeetingHotspotTemplate'),
    MeetingHotspotScan = keystone.list('MeetingHotspotScan'),
    geolib = require('geolib'),
    async = require('async'),
    User = keystone.list('User');
var logUtils = require('../../lib/util/log-utils'),
    i18n = require('i18next');

/*
 * Gets all Meeting Hotspots
 * */
exports.list = function(req, res) {
    MeetingHotspot.model.find({start: {$lt: Date.now() }, end:{ $gte: Date.now() }}).populate('template').exec(function(err, hotspots) {
        if (err) return res.apiError('1061', i18n.t('1061'));
        return res.apiResponse({
            meetinghotspots: hotspots
        });
    });
}

/*
 * Get Meeting Hotspot  by id
 * */
exports.get = function(req, res) {
    MeetingHotspot.model.findOne({_id: req.params.id}).populate('template').exec(function(err, hotspot) {
        if(err) { return res.apiError('1000', i18n.t('1000')); }
        if(!hotspot) { return res.apiError('1062', i18n.t('1062')); }
        var result = { meetinghotspot: hotspot,
            playersScanned: 0,
            tokens: 0,
            bonusTokens: 0
        };
        MeetingHotspotScan.model.find({meetingHotspot: hotspot._id, "players":{"$in":[req.user.id]}}).exec(function(err, scans){
            if(err) { return res.apiError('1000', i18n.t('1000')); }
            _.each(scans, function(scan) {
                if(scan.bonus) {
                    result.bonusTokens+=scan.score;
                } else if(scan.superBonus) {
                    result.bonusTokens+=scan.score;
                } else {
                    result.playersScanned+=1;
                    result.tokens+=scan.score;
                }
            });
            return res.apiResponse(result);
        });
        
    });
}


/*
 * Get all active Meeting Hotspots nearby the given location within a given radius (in meters)
 * */
exports.getNearby = function(req, res) {
    var maxDistance = (req.params.distance) ? keystone.utils.number(req.params.distance) : 1000;
    var location = [];
    _.each(req.params.location.split(','), function(coordinate){
        location.push(keystone.utils.number(coordinate));
    });
    if(location === [] || location.length < 2) return res.apiError('1026', i18n.t('1026'));
    MeetingHotspotTemplate.model.find({"location.geo": {$near: { $geometry:{ type: "Point", coordinates: location }, $maxDistance: maxDistance}}}).exec(function(err,templates) {
        templates = _.pluck(templates, '_id');
        MeetingHotspot.model.find({ end:{ $gte: Date.now() }, template:{$in: templates} }).populate('template').exec(function(err, hotspots) {
            if(err) return res.apiError('1000', i18n.t('1000'));
            return res.apiResponse({
                meetinghotspots: hotspots
            });
        });
    });
    
}

/*
* User starts participating in a Meeting hotspot
* */
exports.start = function(req, res) {
    MeetingHotspot.model.findOne({_id: req.params.id}).populate('template').exec(function(err, hotspot){
        if(err) { return res.apiError('1000', i18n.t('1000')); }
        if(!hotspot || !hotspot.active) { return res.apiError('1063', i18n.t('1063')); }
        if(!hotspot.template) { return res.apiError('1062', i18n.t('1062')); }
        var checkIfPresent = _.find(hotspot.players, function(player){
            if(req.user.id === player.toString()) {
                return true;
            }
            return false;
        });
        if(checkIfPresent !== undefined) { return res.apiError('1065',i18n.t('1065')); }
        
        if(!hotspot.players) {
            hotspot.players = [];
        }
        hotspot.players.push(req.user._id);
        hotspot.save(function(err, hotspot) {
            if(err) { return res.apiError('1000', i18n.t('1000')); }
            return res.apiResponse({success: true});
        });
    });
}


/*
 * User stops participating in a Meeting hotspot
 * */
exports.stop = function(req, res) {
    MeetingHotspot.model.findOne({_id: req.params.id}).populate('template').exec(function(err, hotspot){
        if(err) { return res.apiError('1000', i18n.t('1000')); }
        if(!hotspot || !hotspot.active) { return res.apiError('1063', i18n.t('1063')); }
        
        var checkIfPresent = _.find(hotspot.players, function(player){
            if(req.user.id === player.toString()) {
                return true;
            }
            return false;
        });
        if(checkIfPresent === undefined) { return res.apiError('1069',i18n.t('1069')); }

        hotspot.players = _.reject(hotspot.players, function(player){ 
            if(player.toString() === req.user.id) { 
                return true; 
            } 
            return false; 
        });
        
        hotspot.save(function(err, hotspot) {
            if(err) { return res.apiError('1000', i18n.t('1000')); }
            return res.apiResponse({success: true});
        });
    });
}

/*
 * User scans another user, both get points if the both play the Meeting Hotspot
 * */
exports.scan = function(req, res) {
    MeetingHotspot.model.findOne({_id: req.body.id}).populate('template').exec(function(err, hotspot) {
        if(err) { return res.apiError('1000', i18n.t('1000')); }
        if(!hotspot || !hotspot.active) { return res.apiError('1063', i18n.t('1063')); }
        if(!hotspot.template) { return res.apiError('1062', i18n.t('1062')); }
        
        if(!req.body.qr) { return res.apiError('1067', i18n.t('1067')); }
        var qr = req.body.qr;
        var type = req.body.type;
        
        if(qr == req.user.id) { return res.apiError('1076', i18n.t('1076')); }
        
        var coordinates = req.body.location.split(',');
        if(!coordinates || coordinates.length < 2) { return res.apiError('1066', i18n.t('1066')); }
        var playerLocation = {latitude: coordinates[1], longitude: coordinates[0]};
        var hotspotLocation = {latitude:hotspot.template.location.geo[1],longitude:hotspot.template.location.geo[0]};
        var maxDistance = (keystone.get('meetingHotspotMaxRange'))?parseInt(keystone.get('meetingHotspotMaxRange')):100;
        var playerIsInRange = geolib.isPointInCircle(
            playerLocation,
            hotspotLocation,
            maxDistance
        );

        if(!playerIsInRange) { return res.apiError('1064',i18n.t('1064')); }

        var checkIfPresent = _.find(hotspot.players, function(player){
            if(req.user.id === player.toString()) {
                return true;
            }
            return false;
        });
        if(checkIfPresent === undefined) { return res.apiError('1069',i18n.t('1069')); }
        
        if(qr === hotspot.template.id) {
            //Bonus points track
            if(type !== 'bn' && type !== 'sb'){
                return res.apiError('1074', i18n.t('1074'));
            }
            
            //Check if player hasn't already received bonus points
            if(type === 'bn') {
                if(hotspot.template.bonus && hotspot.template.bonusPoints) {
                    MeetingHotspotScan.model.findOne({"$and":[{"meetingHotspot":hotspot._id},{"bonus": true},{"players":{"$all":[req.user.id]}},{"players": {"$size": 1}}]}).exec(function(err,scan){
                        if(err) { return res.apiError('1000', i18n.t('1000')); }
                        if(scan) { return res.apiError('1073', i18n.t('1073')); }
                        //Create scan
                        var data = {
                            meetingHotspot: hotspot._id,
                            players: [req.user.id],
                            bonus: true,
                            superBonus: false,
                            score: hotspot.template.bonusPoints
                        };

                        addBonusPoints(req, data, function(value) {
                            if(value === '1000' || value === '1074') { return res.apiError(value, i18n.t(value)); }
                            return res.apiResponse({ user:value});
                        });
                    });
                } else {
                    return res.apiError('1077', i18n.t('1077'));
                }
                
            } else {
                //Super bonus track
                if(hotspot.template.superBonus && hotspot.template.superBonusPoints) {
                    MeetingHotspotScan.model.findOne({"$and":[{"meetingHotspot":hotspot._id},{"superBonus": true},{"players":{"$all":[req.user.id]}},{"players": {"$size": 1}}]}).exec(function(err,scan){
                        if(err) { return res.apiError('1000', i18n.t('1000')); }
                        if(scan) { return res.apiError('1075', i18n.t('1075')); }
                        //Create scan
                        var data = {
                            meetingHotspot: hotspot._id,
                            players: [req.user.id],
                            bonus: false,
                            superBonus: true,
                            score: hotspot.template.superBonusPoints
                        };

                        addBonusPoints(req, data, function(value) {
                            if(value === '1000' || value === '1074') { return res.apiError(value, i18n.t(value)); }
                            return res.apiResponse({ user:value});
                        });
                    });
                } else {
                    return res.apiError('1077', i18n.t('1077'));
                }
            }
        } else {
            //Scan player track
            
           //check if scanned player is playing the meeting hotspot too
            var checkIfPlayerPresent = _.find(hotspot.players, function(player){
                if(req.body.qr === player.toString()) {
                    return true;
                }
                return false;
            });
            if(checkIfPlayerPresent === undefined) { return res.apiError('1070',i18n.t('1070')); }
            
            //Check if players have already scanned each other at this hotspot
            MeetingHotspotScan.model.findOne({"$and":[{"meetingHotspot":hotspot._id},{"players":{"$all":[req.user.id,req.body.qr]}},{"players": {"$size": 2}}]}).exec(function(err, scan){
                if(err) { return res.apiError('1000', i18n.t('1000')); }
                if(scan) { return res.apiError('1072', i18n.t('1072')); }

                //Create scan
                var data = { 
                    meetingHotspot: hotspot._id,
                    players: [req.user.id,req.body.qr],
                    score: parseInt(keystone.get('meetingHotspotScanPoints'))
                };
                var scan = new MeetingHotspotScan.model(data);
                
                scan.save(function(err, scan) {
                    if(err) { return res.apiError('1000', i18n.t('1000')); }
                    //Add scores to both players
                    addScores(req.user.id, req.body.qr, parseInt(keystone.get('meetingHotspotScanPoints')), function(err) {
                        if(err) { res.apiError('1071', i18n.t('1071')); }
                        //Get player with updated score
                        User.model.findById(req.user._id).exec(function(err, user){
                            if(err) { return res.apiError('1000', i18n.t('1000')); }
                            //Log scores
                            logUtils.logPoints([{user: req.user._id, action: scan.id, actionType:logUtils.MEETING_HOTSPOT_SCAN, score: parseInt(keystone.get('meetingHotspotScanPoints'))},
                                {user: req.body.qr, action: scan.id, actionType:'MeetingHotspotScan', score: parseInt(keystone.get('meetingHotspotScanPoints'))}], function(err){
                                return res.apiResponse({user: user});
                            });
                        });
                    });
                });
                
            });
        }
        
    });
}



//***********************UTILS***********************//

/*
 * Adds scores to Meeting hotspot scanner and scanned player
 * */
function addScores(scanner, scanned, points, cb) {
    async.each([scanner, scanned], function(player, callback) {
        if(!player) callback();

        User.model.findById(player).exec(function(err, user){
            if(err || !user) { callback(); }
            user.score+=points;
            user.save(function(err){
                callback(err);
            });
        });
    },cb);
}

/*
* Add bonus points
* */
function addBonusPoints(req, data, cb){
    var scan = new MeetingHotspotScan.model(data);

    scan.save(function(err, scan) {
        if(err) { return cb('1000'); }
        req.user.score+=data.score;
        req.user.save(function(err, user) {
            if(err) { return cb('1074'); }
            logUtils.logPoints([{user: req.user._id, action: scan.id, actionType:logUtils.MEETING_HOTSPOT_SCAN, score: scan.score}], function(err){
                return cb(user);
            });
        });
    });
}