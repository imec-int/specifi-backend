var _ = require('underscore'),
    keystone = require('keystone'),
    Types = keystone.Field.Types,
    i18n = require('i18next');

var UserGeneratedContentRating = new keystone.List('UserGeneratedContentRating', { track: true, nocreate: true, nodelete:true, noedit:true});

UserGeneratedContentRating.add({
    content: { label: i18n.t("ugc.CONTENT"), type: Types.Relationship, required: true, ref:'UserGeneratedContent'},
    contentCreator: { label: i18n.t("ugc.CONTENT_CREATOR"), type: Types.Relationship, required: true, ref:'User' },
    rater: { label: i18n.t("ugc.RATER"), type: Types.Relationship, required: true, ref:'User' },
    score: { label: i18n.t("SCORE"), type:Types.Number, required: true }
});

//****************REGISTRATION****************//

UserGeneratedContentRating.defaultColumns = 'content, contentCreator, rater';
UserGeneratedContentRating.register();
