var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types, 
    moment = require('moment'),
    i18n = require('i18next');

var MeetingHotspot = new keystone.List('MeetingHotspot', {
    track: true, 
    nocreate: true, 
    noedit:true, 
    nodelete: true
});

MeetingHotspot.add({
    template: { label: i18n.t('meetinghotspot.TEMPLATE'), type: Types.Relationship, ref: 'MeetingHotspotTemplate', required: true },
    players: { label:i18n.t('meetinghotspot.PLAYERS'), type: Types.Relationship, ref: 'User', many:true },
    start: { label:i18n.t('START_DATE'), type: Types.Datetime, required: true },
    end: { label:i18n.t('END_DATE'), type: Types.Datetime, required: true }
});

//****************VIRTUALS****************//  

MeetingHotspot.schema.virtual('active').get(function() {
    if(moment().isBefore(this.start)) {
        return false;
    }
    if(moment().isAfter(this.end)) {
        return false
    }
    return true;
});

//****************REGISTRATION****************//    

MeetingHotspot.defaultColumns = 'template, start, end, active';
MeetingHotspot.register();
