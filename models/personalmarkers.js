var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require('i18next');

var PersonalMarker = new keystone.List('PersonalMarker', { track: true, nocreate: true, nodelete:true, noedit: true });

PersonalMarker.add({
    name: { label:i18n.t('personalmarker.TITLE'), type: String, required: true, index: true, initial: true },
    location: { label:i18n.t('LOCATION') , type: Types.Location, templateDir: __dirname+"/../templates/fields/location", required: ['geo'], initial: true},
    user: { label:i18n.t('USER'), type: Types.Relationship, required: true, ref:'User' }
});


//****************REGISTRATION****************//    

PersonalMarker.defaultColumns = 'name, user';
PersonalMarker.register();
