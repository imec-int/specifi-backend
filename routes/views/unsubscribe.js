var keystone = require('keystone'),
    User = keystone.list('User'),
    i18n = require('i18next');

exports = module.exports = function(req, res) {
    
    if(req.user) {
        if(req.user.email !== req.params.email) {
            keystone.session.signout(req, res, function(err) {
                req.flash('error', i18n.t("unsubscribe.WRONG_ACCOUNT_ERROR"));
                return res.redirect('/signin');
            });
        }
    }

    var locals = res.locals,
        view = new keystone.View(req, res);
    locals.logo = '/images/playgroundlogo.png';


    view.on('post', { action: 'unsubscribe' }, function(next) {

        User.model.findOne().where({'_id': req.user.id, 'email': req.body.email}).exec(function(err, user) {
            if (err) return next(err);
            if (!user) {
                req.flash('error', i18n.t("error.INCORRECT_EMAIL_ERROR"));
                return next();
            }
            user.unsubscribe = true;
            user.save(function(err) {
                if (err) {
                    req.flash('error', i18n.t("unsubscribe.UNSUBSCRIBE_ERROR"));
                    return next();
                }
                req.flash('success', i18n.t("unsubscribe.UNSUBSCRIBE_SUCCESS", {appName:i18n.t("APP_NAME")}));
                res.redirect('/');
            });
        });

    });

    view.render('unsubscribe');
}