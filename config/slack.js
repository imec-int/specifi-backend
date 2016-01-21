module.exports = {
    options : {
        token      : '', // get one from here: https://typekit.slack.com/services
        domain     : '', // https://domain.slack.com
        channel    : '',
        username   : '',
        icon_emoji : '',
        icon_url   : '' // if icon_emoji not specified
    },
    staging : {
        text : '<%= config.pkg.name %> v<%= config.pkg.version %> deployed to <%= config.env.HOST %>' // {{message}} can be replaced with --message='some text' option from command line
    },
    live : {
        text : '<%= config.pkg.name %> v<%= config.pkg.version %> deployed to <%= config.env.HOST %>' // {{message}} can be replaced with --message='some text' option from command line
    }
};
