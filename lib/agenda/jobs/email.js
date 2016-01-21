var keystone = require('keystone'),
    User = keystone.list('User'),
    async = require('async');

module.exports = function(agenda) {
    
    /*
    * Welcome email
    * */
    agenda.define('welcome email', function(job, done) {
        User.model.findOne({_id: job.attrs.data.userId}).exec(function(err, user) {
            if(err) return done(err);
            user.welcomeEmail(function(err){
                if(err) done(err);
                user.welcomeMailSend = true;
                user.save(function(){
                    done();
                });
            });
        });
    });

}