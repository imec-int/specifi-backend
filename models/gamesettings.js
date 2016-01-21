var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require("i18next");

var GameSetting = new keystone.List('GameSetting', { track: true, nocreate: true, nodelete:true });

GameSetting.add({
    name: { label:i18n.t("NAME"), type: String, required: true, index: true, initial: true, noedit: true },
    value: { label:i18n.t("VALUE"), type: String, required: true, initial: true }
});


//****************HOOKS****************//

/*
 * Update settings on keystone
 * */
GameSetting.schema.pre('save', function(next){
    if(this.isModified('value')){
        keystone.set(this.name, this.value);
    }
    next();
});

GameSetting.schema.post('save', function(next){
    if(this.name ==='randomHotspotTime') {
        if(keystone.agenda) {
            //Schedule random hotspots
            keystone.agenda.cancel({name:'spawnRandomMeetingHotspot'}, function(err, removed) {
                var job = keystone.agenda.create('spawnRandomMeetingHotspot');
                job.schedule(keystone.get('randomHotspotTime'));
                job.repeatAt('tomorrow at ' + keystone.get('randomHotspotTime'));
                job.save(function(err){
                    console.log('Random hotspot job saved');
                });
            });
        }
    }
});

//****************REGISTRATION****************//    
    
GameSetting.defaultColumns = 'name, value';
GameSetting.register();
