var _ = require('underscore'),
    keystone = require('keystone'),
    CustomTypes = require('../lib/fieldTypes'),
    Types = keystone.Field.Types,
    request = require('request'),
    i18n = require("i18next");

var UserGeneratedContent = new keystone.List('UserGeneratedContent', { track: true, label:i18n.t("ugc.UGC"), plural:i18n.t("ugc.UGC", {count: 0}), noedit: true, nocreate: true, nodelete: true, map: { name:'ugc' } });

UserGeneratedContent.add({
    user: { label: i18n.t("USER"), type: Types.Relationship, required: true, ref:'User' },
    challenge: { label: i18n.t("CHALLENGE"), type: Types.Relationship, required: true, ref:'Challenge' },
    waypoint: { label: i18n.t("WAYPOINT"), type: Types.Relationship, required: true, ref:'Waypoint' },
    userchallenge: { label: i18n.t("USERCHALLENGE"), type: Types.Relationship, required: true, ref:'UserChallenge' },
    content: {
        label: i18n.t("ugc.CONTENT"),
        name: 'random',
        prefix: 'waypoint-ugc-',
        type: CustomTypes.MediaHavenFile,
        host: process.env.MEDIAHAVEN_HOST,
        dest: process.env.MEDIAHAVEN_PATH,
        allowedTypes: ["video/mp4", "video/mov", "video/3gpp", "video/quicktime", "video/mpeg","image/png", "image/jpeg", "image/gif"],
        username: process.env.MEDIAHAVEN_PUBLIC_USERNAME,
        password: process.env.MEDIAHAVEN_PUBLIC_PW,
        ingestSpaceId: process.env.MEDIAHAVEN_PUBLIC_INGESTSPACE,
        keywords: ['waypoint', 'playground', 'ugc', process.env.ENVIRONMENT],
        categories: ['ugc'],
        allowDuplicates: '1',
        autoPublish: 'true',
        required: true
    },
    contentText: { label: i18n.t("ugc.CONTENT_TEXT"), type: String }
});

/**
 * Virtuals
 */
UserGeneratedContent.schema.virtual('ugc').get(
    function(next) {
        if(this && this.user && this.user.username) {
            return i18n.t("ugc.CREATED_BY", {username:this.user.username});
        } else {
            return "   ";
        }
    }
);

//****************METHODS****************//
UserGeneratedContent.schema.methods.getMediaHavenUrls = function(cb) {
    var ugc = this;
    if(ugc.content && ugc.content.mediaObjectId !== "") {

        var options = {
            port:443,
            strictSSL:false,
            timeout: 2000
        };

        request.get(process.env.MEDIAHAVEN_HOST+process.env.MEDIAHAVEN_PATH+'/'+ugc.content.mediaObjectId, options, function(err, message, media) {
            var mediaJSON;
            try{
                mediaJSON = JSON.parse(media);
            }
            catch(err) {
                mediaJSON = null;
            }
            if(mediaJSON) {
                if(mediaJSON.previewImagePath ==="" && mediaJSON.videoPath ==="") {
                    ugc.content.url = null;
                    ugc.content.videoPath = null;
                } else {
                    ugc.content.url = mediaJSON.previewImagePath;
                    ugc.content.videoPath = mediaJSON.videoPath;
                }
            } else {
                ugc.content = null;
            }
            return cb(ugc);
        }).auth(process.env.MEDIAHAVEN_PUBLIC_USERNAME, process.env.MEDIAHAVEN_PUBLIC_PW);
    } else {
        return cb();
    }
};



UserGeneratedContent.defaultColumns = 'user, challenge, content, contentText';
UserGeneratedContent.register();
