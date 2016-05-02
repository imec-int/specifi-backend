var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require("i18next");

var GameSetting = new keystone.List('GameSetting', { track: true, nocreate: true, nodelete:true });

GameSetting.add({
    name: { label:i18n.t("NAME"), type: String, required: true, index: true, initial: true, noedit: true },
    value: { label:i18n.t("VALUE"), type: String, required: true, initial: true },
	description: { label: i18n.t("DESCRIPTION"), type:Types.Textarea, noedit:true}
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

//****************REGISTRATION****************//    
    
GameSetting.defaultColumns = 'name, value, description';
GameSetting.register();
