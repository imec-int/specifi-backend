var _ = require('underscore'),
    keystone = require('keystone'),
    CustomTypes = require('../lib/fieldTypes'),
    Types = keystone.Field.Types,
    request = require('request'),
    async = require('async'),
    i18n = require('i18next');

var Challenge = new keystone.List('Challenge', { track: true,
    autokey: { path: 'slug', from: 'name', unique: true }
});

Challenge.add({
    name: { label:i18n.t('NAME'), type: String, required: true, index: true, initial: true},
    description: { label:i18n.t('DESCRIPTION'), type: Types.Textarea},
    location: { label:i18n.t('LOCATION'), type: Types.Location, templateDir: __dirname+"/../templates/fields/location", required: ['geo'], initial: true, index:true },
    image: {
        label: i18n.t('IMAGE'),
        name: 'random',
        prefix: 'challenge-picture-',
        type: CustomTypes.MediaHavenFile,
        host: process.env.MEDIAHAVEN_HOST,
        dest: process.env.MEDIAHAVEN_PATH,
        allowedTypes: ["image/png", "image/jpeg", "image/gif"],
        username: process.env.MEDIAHAVEN_USERNAME,
        password: process.env.MEDIAHAVEN_PW,
        ingestSpaceId: process.env.MEDIAHAVEN_MEDIA_INGESTSPACE,
        keywords: ['challenge', 'playground', process.env.ENVIRONMENT],
        categories: ['challenges'],
        allowDuplicates: '1',
        autoPublish: 'true'
    }},
    i18n.t('challenges.CHALLENGE_SETTINGS'),{
    tokens: { type: Number, label: i18n.t('challenges.TOKENS_TO_EARN'), required: true, default: 1},
    status: {label: i18n.t('STATUS'), type: Types.Select, numeric: true, required: true, options:[{label: i18n.t('DISABLED'), value: 0}, {label: i18n.t('ACTIVE'), value: 1}],default: 0, emptyOption:false},
    expectedDuration: {label:i18n.t('challenges.EXPECTED_DURATION'), type: Types.Number, required: true, default: 30},
    repeatable: { label: i18n.t('challenges.REPEATABLE') ,type:Types.Boolean, default: true }},
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


//****************METHODS****************//
Challenge.schema.methods.getMediaHavenUrls = function(cb) {
    var challenge = this;
    
    console.log("Getting challenge MediaHaven media");
    
    if(challenge.image && challenge.image.mediaObjectId !== "") {
        var options = {
            port:443,
            strictSSL:false,
            timeout: 2000
        };
        console.log("Call MediaHaven API with: "+ JSON.stringify(process.env.MEDIAHAVEN_HOST+process.env.MEDIAHAVEN_PATH+'/'+challenge.image.mediaObjectId));
        request.get(process.env.MEDIAHAVEN_HOST+process.env.MEDIAHAVEN_PATH+'/'+challenge.image.mediaObjectId, options, function(err, message, media) {
            var mediaJSON;
            console.log("MediaHaven media found: "+ JSON.stringify(media));
            try{
                mediaJSON = JSON.parse(media);
            }
            catch(err) {
                mediaJSON = null;
            }
            if(mediaJSON) {
                if(mediaJSON.previewImagePath ==="" && mediaJSON.videoPath ==="") {
                    challenge.image.url = null;
                    challenge.image.videoPath = null;
                } else {
                    challenge.image.url = mediaJSON.previewImagePath;
                    challenge.image.videoPath = mediaJSON.videoPath;
                }
            } else {
                challenge.image = null;
                challenge.image = null;
            }
            console.log("MediaHaven media parsed!");
            if(challenge.waypoints && challenge.waypoints.length > 0 ){
                async.each(challenge.waypoints, function(wp, callback){
                    if(typeof wp.getMediaHavenUrls =='function') {
                        console.log("Find MediaHaven media for waypoint!");
                        wp.getMediaHavenUrls(function(waypoint) {
                            wp = waypoint;
                            callback();
                        });
                    } else {
                        callback(i18n.t("challenges.WAYPOINTS_NOT_POPULATED"));
                    }
                    
                }, function(err) {
                    console.log("MediaHaven media populated! "+JSON.stringify(err));
                    return cb(challenge);
                });
            } else {
                console.log("No waypoints!");
                return cb(challenge);
            }
        }).auth(process.env.MEDIAHAVEN_USERNAME, process.env.MEDIAHAVEN_PW);
        
    } else {
        console.log("No MediaHaven media!");
        return cb();
    }
};

Challenge.defaultColumns = 'title, description, tokens, expectedDuration, status';
Challenge.register();