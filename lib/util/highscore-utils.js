var _ =require('underscore'),
    keystone = require('keystone'),
    async = require('async'),
    moment = require('moment'),
    ActionLog= keystone.list('ActionLog'),
    User = keystone.list('User');

var excludedTypes = ["ExtraTokens"];
var excludedFields = '-email -email_lowercase -resetPasswordKey -resetTries -password -invitationMailSend -welcomeMailSend -isAdmin';

/*
 * Returns the top x users off all time
 * */
exports.topHighscores = function(top, callback) {
    var limit = 10;
    if(top && parseInt(top) > 0)
        limit = parseInt(top);
    ActionLog.model.aggregate()
        .match({ actionType: { $nin: excludedTypes }, score: {$gt: 0} })
        .group({_id: '$user',totalScore:{$sum:'$score'}})
        .project({user: '$_id',totalScore: 1, _id:0})
        .sort('-totalScore')
        .limit(limit)
        .exec(function(err, scores){
            if(err) { return callback('1101'); }
            User.model.populate(scores, {path: 'user', select:excludedFields}, function(err) {
                if(err) { return callback('1000'); }
                var position = 1;
                async.each(scores, function(score, cb) {
                    score.position = position;
                    position++;
                    if(!score.user)
                        cb();
                    else {
                        score.user.getMediaHavenUrls(function(userChallenge) {
                            cb();
                        });
                    }
                }, function(err) {
                    return callback(null, scores);
                });
            });
        });
};


/*
 * Returns the weekly highscores
 * */
exports.weeklyHighscores = function(top, callback) {
    var limit = 10;
    if(top && parseInt(top) > 0)
        limit = parseInt(top);

    //Need to cast moment objects to JS dates since Aggregate doesn't cast arguments
    ActionLog.model.aggregate()
        .match({ actionType: { $nin:excludedTypes }, score: {$gt: 0}, createdAt:{$gte: moment().startOf('week').toDate(), $lt: moment().endOf('week').toDate()}})
        .group({_id: '$user',totalScore:{$sum:'$score'}})
        .project({user: '$_id',totalScore: 1, _id:0})
        .sort('-totalScore')
        .limit(limit)
        .exec(function(err, scores){
            if(err) { return callback('1102'); }
            User.model.populate(scores, {path: 'user', select:excludedFields}, function(err) {
                var position = 1;
                async.each(scores, function(score, cb) {
                    score.position = position;
                    position++;
                    if(!score.user)
                        cb();
                    else {
                        score.user.getMediaHavenUrls(function(userChallenge) {
                            cb();
                        });
                    }
                }, function(err) {
                    return callback(null, scores);
                });
            });
        });
};

/*
 * Get highscores around the player
 * */
exports.personalHighscores = function(user, callback) {
    var limit = 10;

    ActionLog.model.aggregate()
        .match({ actionType: { $nin: excludedTypes}, score: {$gt: 0}})
        .group({_id: '$user',totalScore:{$sum:'$score'}})
        .project({user: '$_id',totalScore: 1, _id:0})
        .sort('-totalScore')

        .exec(function(err, scores){

            if(err) { return callback('1103'); }

            if(!scores || scores.length === 0) { return callback(null, [{position:1, totalScore: 0, user:user}]); }

            var position = 1;
            _.each(scores, function(score) {
                score.position = position;
                position++;
            });

            //Find player
            var player = _.find(scores, function(score) {
                return score.user.toString() === user.id;
            });
            var index = _.indexOf(scores, player);

            //If player not found, put him at the end
            if(index === undefined || index === -1) {
                scores.push({totalScore: 0, position: scores.length+1, user: user});
                index = scores.length-1;
            }
            var start = index - (limit/2),
                end = index + (limit/2);

            //Check if end index is beyond the length of the list
            if(end > scores.length-1) {
                start -=end - (scores.length-1);
                end = scores.length - 1;
            }

            //Check if start index is beyond the start of the list
            if(start < 0) {
                end+=Math.abs(start);
                if(end  > scores.length-1)
                    end = (scores.length-1);
                start = 0;
            }

            //Get the players before and behind player in the rankings
            scores= scores.slice(start,end+1);

            User.model.populate(scores, {path: 'user', select:excludedFields}, function(err) {
                if(err) { return callback('1000'); }
                async.each(scores, function(score, cb) {
                    if(!score.user)
                        cb();
                    else {
                        score.user.getMediaHavenUrls(function(userChallenge) {
                            cb();
                        });
                    }
                }, function(err) {
                    return callback(null, scores);
                });
            });
        });
};