/**
 * This file contains the common middleware used by your routes.
 * 
 * Extend or replace these functions as your application requires.
 * 
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */

var _ = require('underscore'),
	querystring = require('querystring'),
	keystone = require('keystone');


/**
	Initialises the standard view locals
	
	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/

exports.initLocals = function(req, res, next) {
	
	var locals = res.locals;

    locals.title = process.env.APP_NAME;
    locals.user = req.user;
    locals.navLinks = [
		{ label: i18n.t("highscores.HIGHSCORES_TITLE"), key: 'highscores', href: '/highscores', class:'fa-cubes', requireUser: false },
		{ label: i18n.t("personalmarker.PERSONALMARKER_TITLE"), key: 'mymarker', href: '/mymarker', class:'fa-qrcode', requireUser: true }
	];
	
	next();
	
};


/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {
	
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	};
	
	res.locals.messages = _.any(flashMessages, function(msgs) { return msgs.length }) ? flashMessages : false;
	
	next();
	
};


/**
	Prevents people from accessing protected pages when they're not signed in
 */

exports.requireUser = function(req, res, next) {
	if (!req.user) {
		req.flash('error', 'You have to be logged in to see this page.');
		res.redirect('/signin');
	} else {
		next();
	}
	
}


/*
* Forces HTTPS
* */
exports.forceSSL = function(req,res,next) {
    //this should work for local development as well
    if(!req.secure && keystone.get('ssl')=="true") {
        var sslHost = keystone.get('ssl host') || keystone.get('host') || process.env.HOST || process.env.IP,
            sslPort = keystone.get('ssl port');
        if(!sslHost) {
            var gethost=req.get('host').replace('http://','').split(':');
            sslHost=gethost[0];
        }
        //fix port for external webserver use
        if(sslPort)sslPort=':'+sslPort;
        if (!req.secure) {
            return res.redirect('https://' + sslHost + sslPort + req.url);
        }
    }
    next();
}


/**
 Prevents people from accessing protected data when they're not signed in through the API
 */
exports.requireUserAPI = function(req, res, next) {

    if (!req.user) {
        return res.apiError('1010', i18n.t('1010')); 
    } else {
        next();
    }

}
