var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require('i18next');

var ActionLog = new keystone.List('ActionLog', { track: true, nocreate: true, noedit: true, nodelete:true, map: { name: 'user'} });

ActionLog.add({
    user: { label: i18n.t('USER'), type: Types.Relationship, ref:'User', required: true, index: true},
    action: { label: i18n.t('actionlog.ACTION'), type: String, required: true },
    actionType: { label: i18n.t('actionlog.ACTION_TYPE'), type: String, required: true, index:true },
    score: { label: i18n.t('SCORE'), type: Types.Number, required: true }
});

//****************REGISTRATION****************//    

ActionLog.defaultColumns = 'user, action, actionType, score, createdAt';
ActionLog.register();
