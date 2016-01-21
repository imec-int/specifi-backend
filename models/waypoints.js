var _ = require('underscore'),
    keystone = require('keystone'),
    CustomTypes = require('../lib/fieldTypes'),
    Types = keystone.Field.Types,
    request = require('request'),
    async = require('async'),
    availabilityUtils = require('../lib/util/availability-utils'),
    Challenge = keystone.list('Challenge'),
    i18n = require("i18next");

var Waypoint = new keystone.List('Waypoint', {
    autokey: { path: 'slug', from: 'name', unique: true },
    track: true
});

var waypointTypes = [{label:i18n.t("waypoints.MYSTERY_PERSON"), value:'mpw'},{label:i18n.t("waypoints.MARKER"), value:'mkw'},{label:i18n.t("ugc.UGC"), value:'ugc'}];
var proximityValues = [{label: i18n.t("waypoints.BEACON_FAR"), value: 'far'}, {label: i18n.t("waypoints.BEACON_NEAR"), value: 'near'}, {label: i18n.t("waypoints.BEACON_IMMEDIATE"), value: 'immediate'}];
var ugcTypes = [{label:'Picture', value:'picture'},{label:'Video', value:'video'},{label:'Text', value:'text'}];

Waypoint.add({
    name: {label:i18n.t("NAME"), type: String, required: true, index: true, initial: true}},
    i18n.t("LOCATION"),
    {location: { label:i18n.t("LOCATION"), type: Types.Location, templateDir: __dirname+"/../templates/fields/location", required: ['geo'], initial: true},
    locationHidden: {label:i18n.t("waypoints.LOCATION_HIDDEN"), type:Types.Boolean, default: true}},
    i18n.t("waypoints.TYPE"),
    {type: {label:i18n.t("waypoints.TYPE"), type: Types.Select, options:waypointTypes, initial: true,required: true, default:'mkw'}},
    {heading:i18n.t("waypoints.UGC_REQUIREMENTS"), dependsOn:{type:'ugc'}},
    {
        ugcType: {label: i18n.t("waypoints.TYPE_OF_CONTENT_REQUIRED"), type: Types.Select, options: ugcTypes, dependsOn:{type:'ugc'}},
        ugcDescription: {label: i18n.t("waypoints.UGC_DESCRIPTION"), type: Types.Textarea, dependsOn:{type:'ugc'}, note: i18n.t("waypoints.UGC_DESCRIPTION_NOTE") }
    },
    {heading:i18n.t("waypoints.CONDITIONS")},
    {conditionsOn: {label: i18n.t("waypoints.ADD_CONDITIONS"), type: Types.Boolean, default: false}},
    {
        conditions: {
            days: { label: i18n.t("waypoints.DAYS_OF_THE_WEEK"),
                type:String,
                note:i18n.t("waypoints.DAYS_OF_THE_WEEK_NOTE"),
                dependsOn:{conditionsOn:true},
                collapse: true, 
                default: null},
            start: { label: i18n.t("START_DATE"), type: Types.Date, dependsOn:{conditionsOn:true}, collapse: true, default: null },
            end: { label: i18n.t("END_DATE"), type: Types.Date, dependsOn:{conditionsOn:true}, collapse: true, default: null }
        }
    },
    i18n.t("waypoints.CONTENT"),{
    content: {
        text: { label: i18n.t("DESCRIPTION"), type: Types.Textarea },
        image: {
            label: i18n.t("waypoints.CONTENT_IMAGE"),
            name: 'random',
            prefix: 'waypoint-picture-',
            type: CustomTypes.MediaHavenFile,
            host: process.env.MEDIAHAVEN_HOST,
            dest: process.env.MEDIAHAVEN_PATH,
            allowedTypes: ["image/png", "image/jpeg", "image/gif"],
            username: process.env.MEDIAHAVEN_USERNAME,
            password: process.env.MEDIAHAVEN_PW,
            ingestSpaceId: process.env.MEDIAHAVEN_MEDIA_INGESTSPACE,
            keywords: ['waypoint', 'playground', process.env.ENVIRONMENT],
            categories: ['waypoints'],
            allowDuplicates: '1',
            autoPublish: 'true'
        },
        audio: {
            label: i18n.t("waypoints.CONTENT_AUDIO"),
            name: 'random',
            prefix: 'waypoint-audio-',
            type: CustomTypes.MediaHavenFile,
            host: process.env.MEDIAHAVEN_HOST,
            dest: process.env.MEDIAHAVEN_PATH,
            allowedTypes: ["audio/mpeg3", "audio/wav", "audio/mp3"],
            username: process.env.MEDIAHAVEN_USERNAME,
            password: process.env.MEDIAHAVEN_PW,
            ingestSpaceId: process.env.MEDIAHAVEN_MEDIA_INGESTSPACE,
            keywords: ['waypoint', 'playground', process.env.ENVIRONMENT],
            categories: ['waypoints'],
            allowDuplicates: '1',
            autoPublish: 'true'
        },
        video: {
            label: i18n.t("waypoints.CONTENT_VIDEO"),
            name: 'random',
            prefix: 'waypoint-video-',
            type: CustomTypes.MediaHavenFile,
            host: process.env.MEDIAHAVEN_HOST,
            dest: process.env.MEDIAHAVEN_PATH,
            allowedTypes: ["video/mp4"],
            username: process.env.MEDIAHAVEN_USERNAME,
            password: process.env.MEDIAHAVEN_PW,
            ingestSpaceId: process.env.MEDIAHAVEN_MEDIA_INGESTSPACE,
            keywords: ['waypoint', 'playground', process.env.ENVIRONMENT],
            categories: ['waypoints'],
            allowDuplicates: '1',
            autoPublish: 'true'
        }
    }},
    i18n.t("waypoints.HINT"),
    {
        hintText: { type: Types.Textarea, label:i18n.t("waypoints.HINT_TEXT")},
        hintImage: {
            label:i18n.t("waypoints.HINT_IMAGE"),
            name: 'random',
            prefix: 'waypoint-hint-image-',
            type: CustomTypes.MediaHavenFile,
            host: process.env.MEDIAHAVEN_HOST,
            dest: process.env.MEDIAHAVEN_PATH,
            allowedTypes: ["image/png", "image/jpeg", "image/gif"],
            username: process.env.MEDIAHAVEN_USERNAME,
            password: process.env.MEDIAHAVEN_PW,
            ingestSpaceId: process.env.MEDIAHAVEN_MEDIA_INGESTSPACE,
            keywords: ['waypoint', 'playground', 'hints', process.env.ENVIRONMENT],
            categories: ['waypoints'],
            allowDuplicates: '1',
            autoPublish: 'true'
        }
    },
    i18n.t("waypoints.BEACONS"), 
    {
        beaconEnabled: { label:i18n.t("waypoints.BEACON_ENABLED"), type: Types.Boolean, default: false, note: i18n.t("waypoints.BEACON_ADVICE") },
        beaconUUID: { label:i18n.t("waypoints.BEACON_UUID"), type: String, dependsOn:{beaconEnabled:true} },
        beaconMajor: { label:i18n.t("waypoints.BEACON_MAJOR"), type: String, dependsOn:{beaconEnabled:true} },
        beaconMinor: { label:i18n.t("waypoints.BEACON_MINOR"), type: String, dependsOn:{beaconEnabled:true} },
        beaconProximity: { label: i18n.t("waypoints.BEACON_PROXIMITY"), type: Types.Select, dependsOn:{beaconEnabled:true}, options:proximityValues, default: 'near', note: i18n.t('waypoints.BEACON_PROXIMITY_ADVICE') }
    }, 
    { 
        qr: { type: Types.Key, hidden:true, noedit: true  } 
    },
    i18n.t("waypoints.VALIDITY"),
    {
        valid: { label: i18n.t("waypoints.VALID_WAYPOINT"), type: Types.Boolean, default: false, noedit:true }
    }
);

//****************VIRTUALS****************//

//Check if waypoint is available
Waypoint.schema.virtual('available').get(function() {
    if(this.conditionsOn) {
        return availabilityUtils.check(this.conditions.days, this.conditions.start, this.conditions.end);
    } else {
        return true;
    }
});


//****************HOOKS****************//

Waypoint.schema.pre('save', function(next) {
    if(!this.qr) {
        this.qr = keystone.utils.randomString([12,18]);
    }
    if(this.type === 'ugc' && (!this.ugcType || !this.ugcDescription)) {
        this.valid = false;
    } else {
        this.valid = true;
        if(this.type !== 'ugc') {
            this.ugcType = undefined;
            this.ugcDescription = undefined;
        }
    }
    next();
});

Waypoint.schema.pre('validate', function(next) {
    if(this.isModified('beaconEnabled')) {
        if(!this.beaconUUID || this.beaconUUID === '') return next(new Error(i18n.t("error.BEACON_UUID_MISSING")));
        if(this.beaconMajor && (!this.beaconUUID || this.beaconUUID === '')) return next(new Error(i18n.t("error.BEACON_UUID_MAJOR")));
        if(this.beaconMinor && (!this.beaconUUID || this.beaconUUID === '')) return next(new Error(i18n.t("error.BEACON_UUID_MINOR")));
        if(this.beaconMinor && (!this.beaconMajor || this.beaconMajor === '')) return next(new Error(i18n.t("error.BEACON_MAJOR_MINOR")));
    }
    next();
});

Waypoint.schema.pre('validate', function(next) {
    if(!this.isNew) {
        if(this.type === 'ugc' && (!this.ugcType || !this.ugcDescription)) {
            return next(new Error(i18n.t("error.UGC_TYPE_DESC_REQUIRED")));
        }
    }
    next();
});

//Stop deletion of Waypoints linked to Challenges
Waypoint.schema.pre('remove', function(next) {
    Challenge.model.findOne().where('waypoints').in([this._id]).exec(function(err, challenges){
        if(err || challenges) { return next(new Error(i18n.t("error.DELETE_LINKED_WAYPOINT"))); }
        return next();
        
    });
}, true);


//****************METHODS****************//


Waypoint.schema.methods.getMediaHavenUrls = function(cb) {
    var waypoint = this;
    console.log("Get media for waypoint: "+ JSON.stringify(waypoint.name));
    var content = [];
    console.log("Get image for waypoint: "+ JSON.stringify(waypoint.content.image));
    if(waypoint.content.image && waypoint.content.image.mediaObjectId !== "" && waypoint.content.image.mediaObjectId !== undefined)
        content.push(waypoint.content.image.mediaObjectId); 
    else
        waypoint.content.image = null;
    console.log("Get audio for waypoint: "+ JSON.stringify(waypoint.content.audio));
    if(waypoint.content.audio && waypoint.content.audio.mediaObjectId !== "" && waypoint.content.audio.mediaObjectId !== undefined)
        content.push(waypoint.content.audio.mediaObjectId);
    else
        waypoint.content.audio = null;
    console.log("Get video for waypoint: "+ JSON.stringify(waypoint.content.video));
    if(waypoint.content.video && waypoint.content.video.mediaObjectId !== "" && waypoint.content.video.mediaObjectId !== undefined)
        content.push(waypoint.content.video.mediaObjectId);
    else
        waypoint.content.video = null;
    console.log("Get hint image for waypoint: "+ JSON.stringify(waypoint.hintImage));
    if(waypoint.hintImage && waypoint.hintImage.mediaObjectId !== "" && waypoint.hintImage.mediaObjectId !== undefined)
        content.push(waypoint.hintImage.mediaObjectId);
    else
        waypoint.hintImage = null;

    
    
    if(content.length > 0) {
        console.log("Waypoint media found!");
        console.log("Waypoint media to retrieve: "+ JSON.stringify(content));
        var options = {
            port:443,
            strictSSL:false,
            timeout: 2000
        };

        async.each(content, function(mediaObjectId, callback) {
                request.get(process.env.MEDIAHAVEN_HOST+process.env.MEDIAHAVEN_PATH+'/'+mediaObjectId, options, function(err, message, media) {
                    var mediaJSON;
                    try{
                        mediaJSON = JSON.parse(media);
                    }
                    catch(err) {
                        mediaJSON = null;
                    }
                    if(waypoint.content.image && waypoint.content.image.mediaObjectId === mediaJSON.mediaObjectId) {
                        waypoint.content.image.url = mediaJSON.previewImagePath;
                        waypoint.content.image.videoPath = mediaJSON.videoPath;
                        return callback();
                    }
                    if(waypoint.content.audio && waypoint.content.audio.mediaObjectId === mediaJSON.mediaObjectId) {
                        waypoint.content.audio.url = mediaJSON.previewImagePath;
                        waypoint.content.audio.videoPath = mediaJSON.videoPath;
                        return callback();
                    }
                    if(waypoint.content.video && waypoint.content.video.mediaObjectId === mediaJSON.mediaObjectId) {
                        waypoint.content.video.url = mediaJSON.previewImagePath;
                        waypoint.content.video.videoPath = mediaJSON.videoPath;
                        return callback();
                    }
                    if(waypoint.hintImage && waypoint.hintImage.mediaObjectId === mediaJSON.mediaObjectId) {
                        waypoint.hintImage.url = mediaJSON.previewImagePath;
                        waypoint.hintImage.videoPath = mediaJSON.videoPath;
                        return callback();
                    }
                    return callback();
                }).auth(process.env.MEDIAHAVEN_USERNAME, process.env.MEDIAHAVEN_PW);
            }, 
            function(err) {
                return cb(waypoint);
        });
        
    } else {
        console.log("No waypoint media!");
        return cb();
    }
};


//****************RELATIONSHIPS****************//
Waypoint.relationship({ path: 'challenges', ref: 'Challenge', refPath: 'waypoints', label: 'Used in' });

//****************REGISTER****************//
Waypoint.schema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        delete ret.list;
        delete ret._;
        delete ret.typeOptionsMap;
        delete ret.typeOptions;
        delete ret.typeLabel;
        delete ret.typeData;
        delete ret.ugcTypeOptionsMap;
        delete ret.ugcTypeOptions;
        delete ret.ugcTypeLabel;
        delete ret.ugcTypeData;
        delete ret.createdByRefList;
        delete ret.updatedByRefList;
        return ret;
    }
});
Waypoint.defaultColumns = 'name, type, valid';
Waypoint.register();