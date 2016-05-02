var keystone = require('keystone'),
    async = require('async'),
	_ = require('underscore');
var Waypoint = keystone.list('Waypoint');
var UserGeneratedContent = keystone.list('UserGeneratedContent'),
    UserGeneratedContentRating = keystone.list('UserGeneratedContentRating'),
    User = keystone.list('User');
var i18n = require('i18next'),
    logUtils = require('../../lib/util/log-utils');

/*
 * Gets last uploaded 
 * */
exports.getLastUGCForWP = function(req, res) {
    UserGeneratedContent.model.find({waypoint: req.params.wpid, challenge: req.params.challengeid, user: {'$ne': req.user._id }}).populate('user challenge userchallenge waypoint').sort({createdAt: 'desc'}).exec(function(err, ugcList) {
        if(err) return res.apiError('1000', i18n.t('1000'));
        if(!ugcList) return res.apiResponse({ ugc: null });
        
        var result = _.first(ugcList);
		if(result === undefined) { return res.apiResponse({ ugc: null }); }
		return res.apiResponse({
			ugc: result
		});
    });
}

/*
 * Rates the UGC
 * */
exports.rateUGCWP = function(req, res) {
    UserGeneratedContentRating.model.findOne({content: req.body.id, rater: req.user._id}).exec(function(err, previousRating) {
        if(err) { return res.apiError('1000', i18n.t('1000')); }
        if(previousRating) { return res.apiError('1046', i18n.t('1046')); }
        UserGeneratedContent.model.findOne({_id: req.body.id}).populate('user').exec(function(err, ugc) {
            if(err) { return res.apiError('1000', i18n.t('1000')); }
            if(!ugc) { return res.apiError('1041', i18n.t('1041')); }
            if(ugc.user.id === req.user.id) { return res.apiError('1045', i18n.t('1045')) }
            var score = parseInt(keystone.get('ratingPointsCreator'));
            if(!typeof score == 'number') { return res.apiError('1041', i18n.t('1041')); }

            var data = {
                content: ugc,
                contentCreator: ugc.user,
                rater: req.user._id,
                score: score
            };

            var rating = new UserGeneratedContentRating.model(data);

            rating.save(function(err, rating) {
                if(err) { return res.apiError('1044', i18n.t('1044')); }
                User.model.findOne({'_id':rating.contentCreator}).exec(function(err,user){
                    if(err || !user) { return res.apiError('1044',i18n.t('1044')); }
                    user.score +=parseInt(keystone.get('ratingPointsCreator'));
                    user.save(function(err) {
                        logUtils.logPoints([{user: user._id, action: rating.id, actionType:logUtils.USER_GENERATED_CONTENT_RATING, score: parseInt(keystone.get('ratingPointsCreator'))}],
                            function(err){
                                if(err) { return res.apiError('1000',i18n.t('1000')); }
                                return res.apiResponse({success: true});
                            });
                    });
                });
            });
        });
    });
    
}

