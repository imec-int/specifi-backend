var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
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
			type: Types.CloudinaryImage,
			publicId: 'slug',
			folder: 'waypoints/images',
			autoCleanup: true
        },
        audio: {
            label: i18n.t("waypoints.CONTENT_AUDIO"),
			type: Types.CloudinaryVideo,
			publicId: 'slug',
			folder: 'waypoints/audio',
			autoCleanup: true
        },
        video: {
            label: i18n.t("waypoints.CONTENT_VIDEO"),
			type: Types.CloudinaryVideo,
			publicId: 'slug',
			folder: 'waypoints/videos',
			autoCleanup: true
        }
    }},
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
