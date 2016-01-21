var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require('i18next');

var UserChallenge = new keystone.List('UserChallenge', { track: true, noedit: true, nocreate: true, nodelete: false, map: { name:'userchallenge' } });

UserChallenge.add({
    challenge: { label: i18n.t('CHALLENGE'), type: Types.Relationship, required: true, ref:'Challenge' },
    user: { label: i18n.t('USER'), type: Types.Relationship, required: true, ref:'User' },
    completedWP: { label: i18n.t('userchallenge.COMPLETED_WAYPOINTS'), type: Types.Relationship, ref:'Waypoint', many:true },
    hintsUsed: { label: i18n.t('userchallenge.HINTS_USED'), type: Types.Relationship, ref:'Waypoint', many:true },
    complete: { label: i18n.t('userchallenge.COMPLETE'), type: Types.Boolean, default: false },
    start: { label: i18n.t('START_DATETIME'), type: Types.Datetime, required:true },
    end: { label: i18n.t('END_DATETIME'), type: Types.Datetime },
    extradifficulty: { label: i18n.t('userchallenge.EXTRA_DIFFICULTY'), type: Types.Boolean, required: true, default: false },
    score: { label: i18n.t('SCORE'), type: Types.Number }
});


/**
 * Virtuals
 */
UserChallenge.schema.virtual('userchallenge').get(
    function(next) {
        if(this && this.challenge && this.user && this.challenge.name && this.user.username) {
            return i18n.t('userchallenge.PLAYED_BY',{challenge:this.challenge.name, username: this.user.username});
        } else {
            return "   ";
        }
    }
);


//****************METHODS****************//
UserChallenge.schema.methods.getMediaHavenUrls = function(cb) {
    var userChallenge = this;
    if(userChallenge.challenge && userChallenge.user) {
        if(typeof userChallenge.challenge.getMediaHavenUrls =='function') {
            userChallenge.challenge.getMediaHavenUrls(function(challenge){
                userChallenge.challenge = challenge;
                if(typeof userChallenge.user.getMediaHavenUrls =='function') {
                    userChallenge.user.getMediaHavenUrls(function(user){
                        userChallenge.user = user;
                        return cb(userChallenge);
                    });
                } else {
                    return cb(userChallenge);
                }
            });
        } else {
            return cb(userChallenge);
        }
        
    } else {
        return cb(userChallenge);
    }
};


/**
 * Registration
 */
UserChallenge.defaultColumns = 'challenge, user, complete, start, end';
UserChallenge.register();
