var keystone = require('keystone'),
    User = keystone.list('User'),
    i18n = require('i18next');

exports = module.exports = function(req, res) {

    if(req.user) {
        return res.redirect('/');
    }

    var locals = res.locals,
        view = new keystone.View(req, res);
    locals.logo = '/images/logo.jpg';


    view.on('post', { action: 'forgot-password' }, function(next) {

        User.model.findOne().where({'email': req.body.email}).exec(function(err, user) {
            if (err) return next(err);
            if (!user) {
                req.flash('error', i18n.t("error.NO_USER_FOR_EMAIL"));
                return next();
            }
            user.resetPasswordEmail(function(result) {
				req.flash('success', i18n.t("forgotpassword.PASSWORD_RESET_EMAIL_SUCCESS"));
				res.redirect('/signin');
			}, function(err) {
                if (err) {
                    req.flash('error', i18n.t("error.ERROR_SENDING_RESET_PASSWORD_EMAIL"));
                }
				return next();
            });
        });

    });

    view.render('forgotPassword');
}
