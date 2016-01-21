var keystone = require('keystone'),
    i18n = require('i18next'),
    Challenge = keystone.list('Challenge');

exports = module.exports = function(req, res) {

    var locals = res.locals,
        view = new keystone.View(req, res);

    locals.url = process.env.BASE+"/fb/challenge/completed/"+req.params.id;
    locals.siteUrl = process.env.BASE;
    
    view.on('init', function(next){
        Challenge.model.findById(req.params.id).exec(function(err, challenge){
            challenge.getMediaHavenUrls(function (challenge) {
                locals.challenge = challenge;
                next();
            });
        });
        
    });

    view.render("fbchallengecompleted");
}
