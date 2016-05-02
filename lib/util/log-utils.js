var _ = require('underscore'),
    keystone = require('keystone'),
    async = require('async'),
    ActionLog = keystone.list('ActionLog');

exports.EXTRA_TOKENS = 'ExtraTokens';
exports.USERCHALLENGE = 'UserChallenge';
exports.USER_GENERATED_CONTENT_RATING = 'UserGeneratedContentRating';

exports.logPoints = function(actions, cb) {
    if(!actions || actions.length < 1) { return cb(); }
    
    async.each(actions, function(actionData, callback){
        var actionlog = new ActionLog.model(actionData);
        actionlog.save(function(err){
            callback(err);
        });
    }, cb);
};
