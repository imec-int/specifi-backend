var _ = require('underscore'),
    keystone = require('keystone'),
    CustomTypes = require('../lib/fieldTypes'),
    Types = keystone.Field.Types,
    request = require('request'),
    i18n = require('i18next');

var Experience = new keystone.List('Experience', { track: true});

Experience.add({
    name: { label:i18n.t('NAME'), type: String, required: true, index: true, initial: true }},
    i18n.t('experience.DETAILS'),{
        offeredBy: { label:i18n.t('experience.OFFERED_BY'), type: String },
        description: { label:i18n.t('DESCRIPTION'), type: Types.Textarea },
        location: { label:i18n.t('LOCATION'), type: Types.Location, templateDir: __dirname+"/../templates/fields/location", required: ['geo'], initial: true },
        start: { label:i18n.t('START_DATE'), type: Types.Date, required: true, initial:true},
        end: { label:i18n.t('END_DATE'), type: Types.Date, required:true, initial: true },
        picture: {
            label:i18n.t('IMAGE'),
            name: 'random',
            prefix: 'experience-',
            type: CustomTypes.MediaHavenFile,
            host: process.env.MEDIAHAVEN_HOST,
            dest: process.env.MEDIAHAVEN_PATH,
            allowedTypes: ["image/png", "image/jpeg", "image/gif"],
            username: process.env.MEDIAHAVEN_PUBLIC_USERNAME,
            password: process.env.MEDIAHAVEN_PUBLIC_PW,
            ingestSpaceId: process.env.MEDIAHAVEN_PUBLIC_INGESTSPACE,
            keywords: ['experience', 'playground', process.env.ENVIRONMENT],
            categories: ['experience'],
            allowDuplicates: '1',
            autoPublish: 'true'
        }
    },
    i18n.t("experience.TICKET", {count: 0}),{
        tickets: { label:i18n.t("experience.NUMBER_OF_TICKETS"), type: Types.Number, required: true, default: 1 },
        cost: { label:i18n.t("experience.COST"), type: Types.Number, required: true, default: 5 },
        inStore: { label:i18n.t("experience.OFFER_IN_STORE"), type: Types.Boolean, default: false }
});

//****************METHODS****************//
Experience.schema.methods.getMediaHavenUrls = function(cb) {
    var experience = this;
    if(experience.picture && experience.picture.mediaObjectId !== "") {

        var options = {
            port:443,
            strictSSL:false,
            timeout: 2000
        };

        request.get(process.env.MEDIAHAVEN_HOST+process.env.MEDIAHAVEN_PATH+'/'+experience.picture.mediaObjectId, options, function(err, message, media) {
            var mediaJSON;
            try{
                mediaJSON = JSON.parse(media);
            }
            catch(err) {
                mediaJSON = null;
            }
            if(mediaJSON) {
                if(mediaJSON.previewImagePath ==="" && mediaJSON.videoPath ==="") {
                    experience.picture.url = null;
                    experience.picture.videoPath = null;
                } else {
                    experience.picture.url = mediaJSON.previewImagePath;
                    experience.picture.videoPath = mediaJSON.videoPath;
                }
            } else {
                experience.picture = null;
            }
            return cb(experience);
        }).auth(process.env.MEDIAHAVEN_PUBLIC_USERNAME, process.env.MEDIAHAVEN_PUBLIC_PW);
    } else {
        return cb();
    }
};

//****************RELATIONSHIPS****************//
Experience.relationship({ path: 'ticketsSold', ref: 'ExperienceTicket', refPath: 'experience', label: 'Tickets sold' });

//****************REGISTRATION****************//    

Experience.defaultColumns = 'name, offeredBy, start, end, tickets, cost, inStore';
Experience.register();