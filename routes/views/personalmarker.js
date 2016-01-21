var keystone = require('keystone'),
    PersonalMarker = keystone.list('PersonalMarker'),
    i18n = require('i18next');
    
exports = module.exports = function(req, res) {

    var locals = res.locals,
        view = new keystone.View(req, res);
    
    //Locals
    locals.section = 'mymarker';
    locals.userId = req.user._id;
    
    locals.titleExplanation = i18n.t("personalmarker.TITLE_EXPLANATION");
    locals.locationExplanation = i18n.t("personalmarker.LOCATION_EXPLANATION");
    locals.printExplanation = i18n.t("personalmarker.PRINT_EXPLANATION");
    
    view.on('post', { action: 'edit' }, function(next) {
        if(!req.user)  {
            return (new Error(i18n.t('error.LOG_IN_TO_EDIT_MARKER')))
        }
        
        PersonalMarker.model.findOne({user: req.user._id}, function(err, personalMarker) {
            
            if(err) return next(err);
            
            var data = req.body;
            if(req.body) {
                data['location.geo'] = [req.body['location.geo_lng'], req.body['location.geo_lat']];
            }

            if(!personalMarker) {
                data.user = req.user;
                
                personalMarker = new PersonalMarker.model(data);
                personalMarker.getUpdateHandler(req).process(data, {
                    flashErrors: false,
                    ignoreNoedit: true
                },function(err) {
                    if(err) {
                        req.flash('error', i18n.t('1050'));
                        return next(err);
                    }
                    req.flash('success', i18n.t('personalmarker.SAVE_SUCCESS'));
                    return next();
                });
            } else {
                //save the marker
                personalMarker.getUpdateHandler(req).process(data, {
                    flashErrors: false,
                    ignoreNoedit: true
                }, function(err) {

                    if (err) {
                        req.flash('error', i18n.t('1050'));
                        return next();
                    }

                    req.flash('success', i18n.t('personalmarker.SAVE_SUCCESS'));
                    return next();

                });
            }

            
        });
    });

    //Get PersonalMarker
    view.on('render', function(next){
        PersonalMarker.model.findOne({user: req.user._id}).exec(function(err, marker) {
            locals.item = marker;
            next(err);
        });
    });

    view.render('personalmarker');
}