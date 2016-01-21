var keystone = require('keystone'),
    i18n = require('i18next');

exports = module.exports = function(req, res) {
    
    var locals = res.locals,
        view = new keystone.View(req, res);
    
    view.on('init', function(next){
        var q = keystone.list('Challenge').model.findById(req.params.id).populate('waypoints').exec(function(err, challenge) {
            if(challenge) {
                locals.challenge = challenge;
            } else {
                locals.challenge = null;
            }
            next();
        });

    });

    view.render('challengeqrcodes');
}