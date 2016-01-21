var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require('i18next');

var ExperienceTicket = new keystone.List('ExperienceTicket', { track: true, noedit: true, nodelete: true, nocreate: true});

ExperienceTicket.add({
    experience: { label:i18n.t('EXPERIENCE'), type: Types.Relationship, ref:'Experience', required: true},
    user: { label:i18n.t('USER'), type: Types.Relationship, ref:'User', required: true },
    used: { label:i18n.t('experience.USED'), type: Types.Boolean, required: true, default: false },
    usedDate: { label:i18n.t('experience.USED_DATE'), type: Types.Datetime }
});

//****************METHODS****************//
ExperienceTicket.schema.methods.getMediaHavenUrls = function(cb) {
    var ticket = this;
    if(ticket.experience && ticket.user) {
        if(typeof ticket.experience.getMediaHavenUrls =='function') {
            ticket.experience.getMediaHavenUrls(function(experience){
                ticket.experience = experience;
                if(typeof ticket.user.getMediaHavenUrls =='function') {
                    ticket.user.getMediaHavenUrls(function(user){
                        ticket.user = user;
                        return cb(ticket);
                    });
                } else {
                    return cb(ticket);
                }
            });
        } else {
            return cb(ticket);
        }

    } else {
        return cb(ticket);
    }
};


//****************REGISTRATION****************//    

ExperienceTicket.defaultColumns = 'experience, user, user:email, used, usedDate';
ExperienceTicket.register();