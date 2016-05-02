var keystone = require('keystone'),
    i18n = require('i18next')
	url = require('url');

exports = module.exports = function(req, res) {

    var locals = res.locals,
        view = new keystone.View(req, res);

    locals.logo = '/images/logo.jpg';
    
    view.on('post', { action: 'signin' }, function(next) {

        if (!req.body.email || !req.body.password) {
            req.flash('error', i18n.t("error.ENTER_EMAIL_AND_PASSWORD"));
            return next();
        }

        var onSuccess = function() {
            if(req.user.canAccessKeystone) {
               return res.redirect('/keystone');
            }
			return res.redirect('/');
        }

        var onFail = function() {
            req.flash('error', i18n.t("error.INCORRECT_PASSWORD"));
            return next();
        }


        keystone.list('User').model.findOne({ email_lowercase: req.body.email.toLowerCase() }, function(err, user) {
            if (err || !user ) {
                req.flash('error', i18n.t("error.NO_USER_FOR_EMAIL"));
                return next();
            }
            return keystone.session.signin({ email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail);
        });

    });

    view.render('signin');
}
