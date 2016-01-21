var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require('i18next');

var MeetingHotspotScan = new keystone.List('MeetingHotspotScan', { track: true, nocreate: true, nodelete:true, noedit:true, map: { name:'meetingHotspot' } });

MeetingHotspotScan.add({
    meetingHotspot: { label: i18n.t("MEETING_HOTSPOT"), type: Types.Relationship, required: true, ref:'MeetingHotspot'},
    players: { label: i18n.t("PLAYER", {count:0}), type: Types.Relationship, required: true, ref:'User', many:true },
    bonus: { label: i18n.t("meetinghotspot.BONUS"), type: Types.Boolean, default: false, required: true },
    superBonus: { label: i18n.t("meetinghotspot.SUPERBONUS"), type: Types.Boolean, default:false, required: true },
    score: { label: i18n.t("SCORE"), type: Types.Number, required: true }
});

//****************REGISTRATION****************//

MeetingHotspotScan.defaultColumns = 'meetingHotspot, players, score, bonus, superBonus';
MeetingHotspotScan.register();
