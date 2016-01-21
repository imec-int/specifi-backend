var keystone = require('keystone'),
    Types = keystone.Field.Types,
    scanUtils = require('../lib/util/scan-utils'),
    i18n = require('i18next');

var Scan = new keystone.List('Scan', { track: true, nocreate: true, nodelete:true, noedit:true, map: { name:'type' } });

Scan.add({
    type: { label: i18n.t('scan.TYPE'), type: String, required: true },
    scanned: { label: i18n.t('scan.SCANNED'), type: String, required: true},
    scanner: { label: i18n.t('scan.SCANNER'), type: Types.Relationship, required: true, ref:'User' },
    score: { label: i18n.t('scan.SCORE'), type:Types.Number, required: true }
});

//****************VIRTUALS****************//  
Scan.schema.virtual('isCooldownOver').get(function() {
    return scanUtils.isCooldownOver(this.createdAt, parseInt(keystone.get('scanCooldown'),10));
});

//****************REGISTRATION****************//
Scan.defaultColumns = 'type, scanned, scanner, score';
Scan.register();