var keystone = require('keystone'),
    moment = require('moment'),
    ActionLog= keystone.list('ActionLog'),
    User = keystone.list('User'),
    async = require('async'),
    highscoreUtils = require('../../lib/util/highscore-utils'),
    i18n = require('i18next');

exports = module.exports = function(req, res) {

    var locals = res.locals,
        view = new keystone.View(req, res);
    locals.section = 'highscores';
    locals.highscores = [];
    locals.links = [
        { href: '/highscores', label: i18n.t("highscores.HIGHSCORES"), key: 'top'},
        { href: '/highscores/weekly', label: i18n.t("highscores.WEEKLY_HIGHSCORES"), key: 'weekly'}];
    
    if(req.user) {
        locals.links.push({ href: '/highscores/personal', label: i18n.t("highscores.MY_HIGHSCORE"), key: 'personal'});
    }
    
    view.on('init', function(next){
        var type = '';
        if(req.params.type) {
            type = req.params.type;
        }
        
        locals.subsection = type;
        
        switch(type) {
            case 'personal':
                if(!req.user) {
                    req.flash('error', i18n.t("error.NOT_SIGNED_IN_HIGHSCORES"));
                    return res.redirect('/highscores');
                }
                locals.dropdownLabel = i18n.t("highscores.MY_HIGHSCORE");
                highscoreUtils.personalHighscores(req.user, function(err, scores){
                    if(err) { 
                        req.flash('error', i18n.t('1103'));
                        return next(); 
                    }
                    if(!scores || scores.length <= 0)
                        locals.highscores = null;
                    else
                        locals.highscores = scores;
                    return next();
                });
                break;
            case 'weekly':
                locals.dropdownLabel = i18n.t("highscores.WEEKLY_HIGHSCORES");
                highscoreUtils.weeklyHighscores(10, function(err, scores) {
                    if(err) {
                        req.flash('error', i18n.t('1102'));
                        return next();
                    }
                    if(!scores || scores.length <= 0)
                        locals.highscores = null;
                    else
                        locals.highscores = scores;
                    return next();
                });
                break;
            default:
                locals.dropdownLabel = i18n.t("highscores.HIGHSCORES");
                locals.subsection = 'top';
                highscoreUtils.topHighscores(10, function(err, scores){
                    if(err) {
                        req.flash('error', i18n.t('1101'));
                        return next();
                    }
                    if(!scores || scores.length <= 0)
                        locals.highscores = null;
                    else
                        locals.highscores = scores;
                    return next();
                });
                break;
        }
    });

    view.render('highscores');
}