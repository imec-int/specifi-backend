var keystone = require('keystone'),
    User = keystone.list('User'),
    i18n = require('i18next');

exports = module.exports = function(req, res) {

    var locals = res.locals,
        view = new keystone.View(req, res);

    if(req.user) {
        return res.redirect('/');
    }
    
    User.model.findOne({email: req.params.email}).exec(function(err, user) {
        //Any error while getting the user
        if(err) {
            req.flash('error', i18n.t("error.RESET_PASSWORD"));
            return res.redirect('/signin');
        }
        
        //There's no user for this email
        if(!user) {
            req.flash('error', i18n.t("error.NO_USER_FOR_EMAIL"));
            return res.redirect('/signin');
        }
        
        if(user) {
            
            //User has reached max retries for resetting password
            if(user.resetTries >=3) {
                req.flash('error', i18n.t("error.RESET_LINK_EXPIRED"));
                return res.redirect('/signin');
            }
            
            //Increase the reset tries
            user.resetTries = user.resetTries++;
            
            if(!user.resetPasswordKey || user.resetPasswordKey === '') {
                user.save(function(err) {
                    //Any error while saving the user
                    if(err) {
                        req.flash('error', i18n.t("error.RESET_PASSWORD"));
                        return res.redirect('/signin');
                    }
                    req.flash('error', i18n.t("error.RESET_LINK_EXPIRED"));
                    return res.redirect('/signin');
                });
            }

            //The reset password key doesn't match the one from the db
            if(user.resetPasswordKey !== req.params.key) {
                user.save(function(err) {
                    //Any error while saving the user
                    if(err) {
                        req.flash('error', i18n.t("error.RESET_PASSWORD"));
                        return res.redirect('/signin');
                    }
                    req.flash('error', i18n.t("error.RESET_LINK_EXPIRED"));
                    return res.redirect('/signin');
                });
            }

            //Log in the user and let him change his password
            keystone.session.signin(user._id, req, res,
                function(user) {
                    req.flash('success', i18n.t("resetpassword.TEMP_LOGIN"));
                    return res.redirect('/changePassword');
                },
                function() {
                    req.flash('error', i18n.t("error.COULD_NOT_LOG_IN"));
                    return res.redirect('/signin');
                }
            );
            
        }
        
    });
}