var keystone = require('keystone'),
    i18n = require('i18next');

exports = module.exports = function(req, res) {

    var locals = res.locals,
        view = new keystone.View(req, res);
    locals.logo = '/images/playgroundlogo.png';

    view.on('post', { action: 'change-password' }, function(next) {
        
        if(req.body.password !== req.body.password_confirm) {
            req.flash('error', i18n.t("error.PASSWORDS_MISMATCH"));
            return next();
        }
        
        var user = req.user;

        user.password = req.body.password;
        user.resetPasswordKey = null;
        user.resetTries = 0;
        user.save(function(err) {
            if (err) return next(err);
            req.flash('success', i18n.t("changepassword.SUCCESS"));
            res.redirect('/');
        });

    });
    
    view.render('changePassword');
}