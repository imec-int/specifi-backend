var _ = require('underscore'),
    keystone = require('keystone');
var Scan = keystone.list('Scan'),
    PersonalMarker = keystone.list('PersonalMarker'),
    Waypoint = keystone.list('Waypoint'),
    User = keystone.list('User'),
    i18n = require('i18next'),
    async = require('async'),
    scanUtils = require('../../lib/util/scan-utils'),
    logUtils = require('../../lib/util/log-utils');

/*
 * Scan a PersonalMarker
 * */
exports.scanPersonalMarker = function(req, res) {
    
    //Find a PersonalMarker with the id
    PersonalMarker.model.findOne({user: req.params.id}).populate('user').exec(function(err, result) {
        if(err || !result) return res.apiError('1111', i18n.t('1111'));
        
        if(result.user.id === req.user.id) return res.apiError('1117', i18n.t('1117'));
        
        //Find if this QR was already scanned before
        Scan.model.findOne({scanned: req.params.id, scanner: req.user._id, type: scanUtils.PERSONAL_MARKER}).sort('-createdAt').exec(function(err, scan) {
            if(err) return res.apiError('1112', i18n.t('1112'));
            if(scan && !scan.isCooldownOver) return res.apiError('1113', i18n.t('1113'));
            
            //Create a new scan
            var newScan = new Scan.model({type: scanUtils.PERSONAL_MARKER, scanned: req.params.id, scanner: req.user, score: parseInt(keystone.get('scanPoints'))});
            newScan.save(function(err){
                if(err) return res.apiError('1114', i18n.t('1114'));
                
                //Add actual object to scanned
                newScan.scanned = result;
                
                //Users to add points to
                var users = [
                    {id: req.user._id, points: parseInt(keystone.get('scanPoints'))}, 
                    {id: result.user._id, points: parseInt(keystone.get('scanPoints'))}
                ];

                //Add score
                addScores(users, function(err){
                    if(err) return res.apiError('1115', i18n.t('1115'));
                    logUtils.logPoints([
                            {user: req.user._id, action: newScan.id, actionType:logUtils.RANDOM_PERSONAL_MARKER_SCAN, score: parseInt(keystone.get('scanPoints'))},
                            {user: result.user, action: newScan.id, actionType:logUtils.SCANNED_PERSONAL_MARKER, score: parseInt(keystone.get('scanPoints'))}],
                        function(err){
                            Scan.model.findById(newScan._id).populate('scanner').exec(function(err, populatedScan) {
                                if(err) return res.apiError('1115', i18n.t('1115'));
                                return res.apiResponse(populatedScan);
                            });
                    });
                    
                });
                
            });
        });
        
    });
}


/*
* Scan a Waypoint
* */
exports.scanWaypoint = function(req, res) {
    
    //Find a Waypoint with the id
    Waypoint.model.findOne({ qr:req.params.id }).exec(function(err, result) {
        if(err || !result) return res.apiError('1116', i18n.t('1116'));

        //Find if this QR was already scanned before
        Scan.model.findOne({scanned: result.id, type: scanUtils.WAYPOINT, scanner: req.user._id}).sort('-createdAt').exec(function(err, scan) {
            if(err) return res.apiError('1112', i18n.t('1112'));
            if(scan && !scan.isCooldownOver) return res.apiError('1113', i18n.t('1113'));

            //Create a new scan
            var newScan = new Scan.model({type: scanUtils.WAYPOINT, scanned: result.id, scanner: req.user, score: parseInt(keystone.get('scanPoints'))});
            newScan.save(function(err){
                if(err) return res.apiError('1114', i18n.t('1114'));

                //Add actual object to scanned
                newScan.scanned = result;
                newScan.scanner = req.user;

                //Users to add points to
                var users = [{id: req.user._id, points: parseInt(keystone.get('scanPoints'))}];

                //Add score
                addScores(users, function(err){
                    if(err) return res.apiError('1115', i18n.t('1115'));
                    logUtils.logPoints(
                        [{user: req.user._id, action: newScan.id, actionType:logUtils.RANDOM_WAYPOINT_SCAN, score: parseInt(keystone.get('scanPoints'))}],
                        function(err){
                            Scan.model.findById(newScan._id).populate('scanner').exec(function(err, populatedScan) {
                                if(err) return res.apiError('1115', i18n.t('1115'));
                                return res.apiResponse(populatedScan);
                            });
                    });
                });

            });
        });
        
    });
}


//***********************UTILS***********************//

/**
 * Add scores to an array of Users
 * @param users An array of users
 * @param points Number of points to add
 * @param callback Function that will handle the result or errors
 */
function addScores(users, callback) {
    async.each(users, function(obj, cb) {
        User.model.findById(obj.id).exec(function(err, user){
            if(err || !user) { cb(err); }
            user.score+=obj.points;
            user.save(function(err, user){
                cb(err);
            });
        });
    },callback);
}