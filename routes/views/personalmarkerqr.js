var _ = require('underscore'),
    keystone = require('keystone'),
    PersonalMarker = keystone.list('PersonalMarker'),
    i18 = require('i18next');

exports = module.exports = function(req, res) {

    var locals = res.locals,
        view = new keystone.View(req, res);

    view.on('init', function(next){
        PersonalMarker.model.findOne({user:req.params.userid}).exec(function(err, personalMarker) {
            if(personalMarker && personalMarker.location && personalMarker.location.geo && personalMarker.location.geo.length == 2) {
                locals.marker = personalMarker;
            } else {
                locals.marker = '';
            }
            next();
        });

    });

    view.render('personalmarkerqr');
}