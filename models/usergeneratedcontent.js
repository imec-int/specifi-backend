var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require("i18next");

var UserGeneratedContent = new keystone.List('UserGeneratedContent', { track: true, label:i18n.t("ugc.UGC"), plural:i18n.t("ugc.UGC", {count: 0}), noedit: true, nocreate: true, nodelete: true, map: { name:'ugc' } });

UserGeneratedContent.add({
    user: { label: i18n.t("USER"), type: Types.Relationship, required: true, ref:'User' },
    challenge: { label: i18n.t("CHALLENGE"), type: Types.Relationship, required: true, ref:'Challenge' },
    waypoint: { label: i18n.t("WAYPOINT"), type: Types.Relationship, required: true, ref:'Waypoint' },
    userchallenge: { label: i18n.t("USERCHALLENGE"), type: Types.Relationship, required: true, ref:'UserChallenge' },
    contentImage: {
		label: i18n.t("ugc.CONTENT_IMAGE"),
		type: Types.CloudinaryImage,
		publicId: 'slug',
		folder: 'ugc',
		autoCleanup: true
    },
	contentVideo: {
		label: i18n.t("ugc.CONTENT_VIDEO"),
		type: Types.CloudinaryVideo,
		publicId: 'slug',
		folder: 'ugc',
		autoCleanup: true
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


UserGeneratedContent.defaultColumns = 'user, challenge, content, contentText';
UserGeneratedContent.register();
