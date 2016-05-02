var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require('i18next');
	
var UserChallenge = new keystone.List('UserChallenge', { track: true, nocreate: true, nodelete: false, map: { name:'userchallenge' } });

UserChallenge.add({
    challenge: { label: i18n.t('CHALLENGE'), type: Types.Relationship, required: true, ref:'Challenge', noedit: true },
    user: { label: i18n.t('USER'), type: Types.Relationship, required: true, ref:'User', noedit: true },
    completedWP: { label: i18n.t('userchallenge.COMPLETED_WAYPOINTS'), type: Types.Relationship, ref:'Waypoint', many:true, noedit: true },
    complete: { label: i18n.t('userchallenge.COMPLETE'), type: Types.Boolean, default: false, noedit: true },
    start: { label: i18n.t('START_DATETIME'), type: Types.Datetime, required:true, noedit: true },
    end: { label: i18n.t('END_DATETIME'), type: Types.Datetime, noedit: true },
    extradifficulty: { label: i18n.t('userchallenge.EXTRA_DIFFICULTY'), type: Types.Boolean, required: true, default: false, noedit: true },
    score: { label: i18n.t('SCORE'), type: Types.Number, noedit: true },
	randomOrder: { label: i18n.t('userchallenge.RANDOM_ORDER'), type:Types.Boolean, noedit: true, required: true, default: false},
	cooldownLimited: { label: i18n.t('challenges.COOLDOWN_LIMITED'), type:Types.Boolean, noedit: true, required: true, default: false}
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

/**
 * Registration
 */
UserChallenge.defaultColumns = 'challenge, user, complete, start, end';
UserChallenge.register();
