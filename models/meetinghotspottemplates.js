var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    async = require('async'),
    moment = require('moment'),
    MeetingHotspot = keystone.list('MeetingHotspot'),
    i18n = require('i18next');

var MeetingHotspotTemplate = new keystone.List('MeetingHotspotTemplate', {
    autokey: { path: 'slug', from: 'name', unique: true },
    track: true 
});

MeetingHotspotTemplate.add({
    name: { label: i18n.t('NAME'), type: String, required: true, index: true, initial: true },
    message: { label: i18n.t('MESSAGE'), type: Types.Textarea },
    location: { label: i18n.t('LOCATION'), type: Types.Location, templateDir: __dirname+"/../templates/fields/location", required: ['geo'], initial: true },
    duration: { label: i18n.t('meetinghotspot.DURATION'), type: Types.Number, required: true, initial: true, default: 10 },
    status: { label: i18n.t('STATUS'), type: Types.Select, options:[{label: i18n.t('DISABLED'), value: 0}, {label: i18n.t('ACTIVE'), value: 1}], default:0},
    fixed: { label: i18n.t('meetinghotspot.RUN_AT_FIXED_DATE'), type: Types.Boolean, default: false },
    start: { label: i18n.t('START_DATETIME'), type: Types.Datetime, dependsOn: {fixed:1} }},
    i18n.t('meetinghotspot.BONUS_QR_CODE'),
    {bonus: { label: i18n.t('meetinghotspot.ADD_BONUS_QR_CODE'), type: Types.Boolean, default: false}},
    {
        bonusPoints: { label: i18n.t('meetinghotspot.BONUS_POINTS'), type: Types.Number, dependsOn:{bonus:true}},
        bonusQr: { label:i18n.t('meetinghotspot.BONUS_QR_CODE'), type: String, noedit: true, templateDir: __dirname+"/../templates/fields/qr", default: "bn", dependsOn:{bonus:true}}},
    i18n.t('meetinghotspot.SUPERBONUS_QR_CODE'),
    {superBonus: { label: i18n.t('meetinghotspot.ADD_SUPERBONUS_QR_CODE'), type: Types.Boolean, default: false}},
    {
        superBonusPoints: { label: i18n.t('meetinghotspot.SUPERBONUS_POINTS'), type: Types.Number, dependsOn:{superBonus:true}},
        superBonusQr: { label:i18n.t('meetinghotspot.SUPERBONUS_QR_CODE'), type: String, noedit: true, templateDir: __dirname+"/../templates/fields/qr", default: "sb", dependsOn:{superBonus:true}}
});


//****************VALIDATION****************//  
MeetingHotspotTemplate.schema.path('fixed').validate(function (value) {
    if(value && !this.start) {
        return false;
    } else {
        return true;
    }
}, i18n.t("error.START_DATE_REQUIRED"));


//****************METHODS****************//  

MeetingHotspotTemplate.schema.pre('save', function(next){
    var self = this;
    MeetingHotspot.model.findOne({template:self._id, start:{ $gte: Date.now() }}).exec(function(err, hotspot){
        if(hotspot) {
            if(self.fixed) {
                if(self.status === "1") {
                    //The hotspot is fixed, active and there's already an instance in the DB
                    hotspot.start = self.start;
                    hotspot.end = moment(self.start).add('m',self.duration);
                    hotspot.save(function(err){
                        return next(err);
                    });
                } else {
                    //The hotspot is fixed, not active and there's already an instance in the DB
                    hotspot.remove(function(err) {
                        return next(err);
                    });
                }
                
            } else {
                //The hotspot is not fixed and there's already an instance in the DB
                hotspot.remove(function(err) {
                    return next(err);
                });
            }
        } else {
            if(self.fixed && self.status === "1") {
                //The hotspot is fixed and there's no instance in the DB
                var data = {
                    template: self._id,
                    start: self.start,
                    end: moment(self.start).add('m',self.duration)
                };
                var hotspot = new MeetingHotspot.model(data);
                hotspot.save(function(err) {
                    return next(err);
                });
            } else {
                //The hotspot is not fixed and there's no instance in the DB
                return next();
            }
        }
    });
});


MeetingHotspotTemplate.schema.pre('remove', function(next) {
    var self = this;
    var MeetingHotspot = keystone.list('MeetingHotspot');
    MeetingHotspot.model.remove({template: self._id, start:{ $gte: Date.now() }}, function(err){
        next(err);
    });
});


//****************REGISTRATION****************//    

MeetingHotspotTemplate.defaultColumns = 'name, location, duration, status';
MeetingHotspotTemplate.register();
