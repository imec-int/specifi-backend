var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require('i18next');

var Challenge = new keystone.List('Challenge', { track: true,
    autokey: { path: 'slug', from: 'name', unique: true }
});

Challenge.add({
		name: { label:i18n.t('NAME'), type: String, required: true, index: true, initial: true},
		description: { label:i18n.t('DESCRIPTION'), type: Types.Textarea},
		location: { label:i18n.t('LOCATION'), type: Types.Location, templateDir: __dirname+"/../templates/fields/location", required:  ['geo'], initial: true },
		image: {
			label: i18n.t('IMAGE'),
			type: Types.CloudinaryImage,
			publicId: 'slug',
			folder: 'challenges',
			autoCleanup: true
		}},
		i18n.t('challenges.CHALLENGE_SETTINGS'),{
		tokens: { type: Number, label: i18n.t('challenges.TOKENS_TO_EARN'), required: true, default: 1},
		status: {label: i18n.t('STATUS'), type: Types.Select, numeric: true, required: true, options:[{label: i18n.t('DISABLED'), value: 0}, {label: i18n.t('ACTIVE'), value: 1}],default: 0, emptyOption:false},
		expectedDuration: {label:i18n.t('challenges.EXPECTED_DURATION'), type: Types.Number, required: true, default: 30},
		repeatable: { label: i18n.t('challenges.REPEATABLE'),note: i18n.t('challenges.REPEATABLE_NOTE') ,type:Types.Boolean, default: true },
		randomOrderAllowed: { label: i18n.t('challenges.RANDOM_ORDER'),type: Types.Boolean, default: false, note: i18n.t('challenges.RANDOM_ORDER_NOTE')},	
		cooldownLimited: { label: i18n.t('challenges.COOLDOWN_LIMITED'), type: Types.Boolean, default: false, note: i18n.t('challenges.COOLDOWN_LIMITED_NOTE')}},
		i18n.t('challenges.CREATOR'),
		{
			createdByOrganisation: {label:i18n.t('challenges.CREATED_BY_ORG'), type: String },
			credits: {label:i18n.t('challenges.CREDITS'), type: String }}
		,i18n.t('WAYPOINT', {count: 0}), {
			waypoint1: { label:i18n.t('challenges.WAYPOINT', {number:'1'}), type: Types.Relationship, ref: 'Waypoint', many: false, filters: {valid: 'true'} },
			waypoint2: { label:i18n.t('challenges.WAYPOINT', {number:'2'}), type: Types.Relationship, ref: 'Waypoint', many: false, filters: {valid: 'true'} },
			waypoint3: { label:i18n.t('challenges.WAYPOINT', {number:'3'}), type: Types.Relationship, ref: 'Waypoint', many: false, filters: {valid: 'true'} },
			waypoint4: { label:i18n.t('challenges.WAYPOINT', {number:'4'}), type: Types.Relationship, ref: 'Waypoint', many: false, filters: {valid: 'true'} },
			waypoint5: { label:i18n.t('challenges.WAYPOINT', {number:'5'}), type: Types.Relationship, ref: 'Waypoint', many: false, filters: {valid: 'true'} },
			waypoints: { label:i18n.t('WAYPOINTS', {count: 0}), type: Types.Relationship, ref: 'Waypoint', many: true, noedit:true, hidden:true }},
		i18n.t('challenges.EXTRA_DIFFICULTY_SETTINGS'),
		{
			extradifficulty: {label: i18n.t('challenges.ADD_BONUS'), type: Types.Boolean, default: false},
			timelimit: { label: i18n.t('challenges.TIME_LIMIT'), type: Types.Number, dependsOn:{extradifficulty:true} },
			extratokens: { type: Types.Number, label: i18n.t('challenges.EXTRA_TOKENS_TO_EARN'), dependsOn:{extradifficulty:true}}
		},
		i18n.t('challenges.QR_CODES'),
		{qr: { label:i18n.t('challenges.QR_CODES'), type: String, noedit: true, required: true, templateDir: __dirname+"/../templates/fields/downloadqr", default: "1" }
});

//****************HOOKS****************//

/*
* Add waypoints to waypoint array and check if there is at least one when making it active
* */
Challenge.schema.pre('save', function(next){
    var self = this;
    keystone.list('UserChallenge').model.findOne({challenge: self._id, end:null}).exec(function(err, userChallenge) {
        if(userChallenge) {
            if(self.isModified('extratokens') 
                || self.isModified('timelimit') 
                || self.isModified('extradifficulty') 
                || self.isModified('waypoint1') 
                || self.isModified('waypoint2') 
                || self.isModified('waypoint3') 
                || self.isModified('waypoint4') 
                || self.isModified('waypoint5') 
                || self.isModified('tokens')) {
                return next(new Error(i18n.t('error.CANT_EDIT_CHALLENGE')));
            }
            
        }
        
        if(self.extradifficulty === true) {
            if(!self.timelimit || !self.extratokens || self.timelimit === "" || self.extratokens === "") {
                return next(new Error(i18n.t('error.EXTRA_DIFFICULTY_REQUIRED_FIELDS')));
            }
        }

        self.waypoints = [];
        if(self.waypoint1) {
            self.waypoints.push(self.waypoint1);
        }
        if(self.waypoint2) {
            self.waypoints.push(self.waypoint2);
        }
        if(self.waypoint3) {
            self.waypoints.push(self.waypoint3);
        }
        if(self.waypoint4) {
            self.waypoints.push(self.waypoint4);
        }
        if(self.waypoint5) {
            self.waypoints.push(self.waypoint5);
        }

        if(self.waypoints && self.waypoints.length > 5) {
            return next(new Error(i18n.t('error.MAX_WAYPOINTS')));
        }

        if(self.status === 1 && (!self.waypoints || self.waypoints.length < 1)) {
            return next(new Error(i18n.t('error.MIN_WAYPOINTS')));
        }
        next();
    });
    
});

/*
* Check waypoint1 for uniqueness
* */
Challenge.schema.path('waypoint1').validate(function (value) {
    if(this.waypoint1 && (this.waypoint1.equals(this.waypoint2) || this.waypoint1.equals(this.waypoint3) || this.waypoint1.equals(this.waypoint4) || this.waypoint1.equals(this.waypoint5))) {
        return false;
    } else {
        return true;
    }
}, i18n.t('error.UNIQUE_WAYPOINT'));

/*
 * Check waypoint2 for uniqueness
 * */
Challenge.schema.path('waypoint2').validate(function (value) {
    if(this.waypoint2 && (this.waypoint2.equals(this.waypoint1) || this.waypoint2.equals(this.waypoint3) || this.waypoint2.equals(this.waypoint4) || this.waypoint2.equals(this.waypoint5))) {
        return false;
    } else {
        return true;
    }
}, i18n.t('error.UNIQUE_WAYPOINT'));

/*
 * Check waypoint3 for uniqueness
 * */
Challenge.schema.path('waypoint3').validate(function (value) {
    if(this.waypoint3 && (this.waypoint3.equals(this.waypoint1) || this.waypoint3.equals(this.waypoint2) || this.waypoint3.equals(this.waypoint4) || this.waypoint3.equals(this.waypoint5))) {
        return false;
    } else {
        return true;
    }
}, i18n.t('error.UNIQUE_WAYPOINT'));

/*
 * Check waypoint4 for uniqueness
 * */
Challenge.schema.path('waypoint4').validate(function (value) {
    if(this.waypoint4 && (this.waypoint4.equals(this.waypoint1) || this.waypoint4.equals(this.waypoint2) || this.waypoint4.equals(this.waypoint3) || this.waypoint4.equals(this.waypoint5))) {
        return false;
    } else {
        return true;
    }
}, i18n.t('error.UNIQUE_WAYPOINT'));

/*
 * Check waypoint5 for uniqueness
 * */
Challenge.schema.path('waypoint5').validate(function (value) {
    if(this.waypoint5 && (this.waypoint5.equals(this.waypoint1) || this.waypoint5.equals(this.waypoint2) || this.waypoint5.equals(this.waypoint3) || this.waypoint5.equals(this.waypoint4))) {
        return false;
    } else {
        return true;
    }
}, i18n.t('error.UNIQUE_WAYPOINT'));

/*
* Stop deletion of challenge if already active
* */
Challenge.schema.pre('remove', function(next) {
    if(this.status === 1) { return next(new Error(i18n.t('error.DELETE_ACTIVE_CHALLENGE'))); }
    keystone.list('UserChallenge').model.findOne({challenge: this._id}).exec(function(err, userChallenge) {
        if(userChallenge) { return next(new Error(i18n.t('error.DELETE_PLAYING_CHALLENGE'))); }
        next();
    });
});


Challenge.defaultColumns = 'title, tokens, expectedDuration, status';
Challenge.register();
