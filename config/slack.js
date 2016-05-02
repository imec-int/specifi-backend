module.exports = {
    options : {
		endpoint   : 'https://hooks.slack.com/services/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',
        channel    : '#specifi-development',
        username   : 'davidvermeir',
        icon_emoji : ':kumpir:',
        icon_url   : 'https://slack.com/img/icons/app-57.png' // if icon_emoji not specified
    },
    staging : {
        text : '<%= config.pkg.name %> v<%= config.pkg.version %> deployed to <%= config.env.HOST %>' // {{message}} can be replaced with --message='some text' option from command line
    },
    live : {
        text : '<%= config.pkg.name %> v<%= config.pkg.version %> deployed to <%= config.env.HOST %>' // {{message}} can be replaced with --message='some text' option from command line
    }
};
