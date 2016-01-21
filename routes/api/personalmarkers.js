var _ = require('underscore'),
    keystone = require('keystone');
var PersonalMarker = keystone.list('PersonalMarker'),
    User = keystone.list('User'),
    i18n = require('i18next');

/*
 * Gets all personal markers
 * */
exports.list = function(req, res) {
    PersonalMarker.model.find().where('user').ne(req.user._id).populate('user').exec(function(err, markers) {
        if (err) return res.apiError('1051', i18n.t('1051'));
        return res.apiResponse({
            personalmarkers: markers
        });
    });
}

/*
 * Get Personal marker by id
 * */
exports.get = function(req, res) {
    PersonalMarker.model.findOne({_id: req.params.id}).populate('user').exec(function(err, marker) {
        if(err) return res.apiError('1000', i18n.t('1000'));
        if(!marker) return res.apiError('1052', i18n.t('1052'));
        
        return res.apiResponse(marker);
    });
}
