var _ = require('underscore'),
	keystone = require('keystone'),
	middleware = require('./middleware'),
	importRoutes = keystone.importer(__dirname),
    scanUtils = require('../lib/util/scan-utils');

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
	views: importRoutes('./views'),
    api: importRoutes('./api')
};

// Setup Route Bindings
exports = module.exports = function(app) {
    
	// Views
	app.get('/', routes.views.index);
    app.get('/qrcodes/:id', middleware.requireUser, middleware.forceSSL, routes.views.challengeqrcodes);
    app.get('/qr/:id/model/:model/path/:path/title/:title', middleware.requireUser, middleware.forceSSL, routes.views.qrcodes);
    app.all('/signin', middleware.forceSSL, routes.views.signin);
    app.all('/forgotpassword', middleware.forceSSL, routes.views.forgotPassword);
    app.get('/reset/:email/key/:key', middleware.forceSSL, routes.views.resetPassword);
    app.all('/changepassword', middleware.requireUser, middleware.forceSSL, routes.views.changePassword);
    app.all('/unsubscribe/:email', middleware.requireUser, middleware.forceSSL, routes.views.unsubscribe);
    app.all('/highscores/:type?', middleware.forceSSL, routes.views.highscores);
    app.all('/mymarker', middleware.forceSSL, middleware.requireUser,routes.views.personalmarker);
    app.all('/mymarker/qr/:userid', middleware.forceSSL, middleware.requireUser,routes.views.personalmarkerqr);
    
    //USER API
    app.get('/api/user/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.users.get);
    app.post('/api/user/register', keystone.initAPI, middleware.forceSSL, routes.api.users.register);
    app.post('/api/user/login', keystone.initAPI, middleware.forceSSL, routes.api.users.login);
    app.post('/api/user/logout', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.users.logout);
    app.post('/api/user/changepassword', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.users.changePassword);
    app.get('/api/user/:id/challenges/:complete?', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.users.getChallenges);
    app.get('/api/user/:username/username/unique', keystone.initAPI, middleware.forceSSL, routes.api.users.checkIfUsernameExists);
    app.get('/api/user/:email/email/unique', keystone.initAPI, middleware.forceSSL, routes.api.users.checkIfEmailExists);
    
    //CHALLENGE API
    app.get('/api/challenge/list', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.challenges.list);
    app.get('/api/challenge/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.challenges.get);
    app.get('/api/challenge/nearby/:location/distance/:distance', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.challenges.getNearby);
    
    //USERCHALLENGE API
    app.get('/api/userchallenge/:challengeid', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.userchallenges.get);
    app.get('/api/userchallenge/:challengeid/start/:extra?', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.userchallenges.start);
    app.get('/api/userchallenge/:challengeid/stop', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.userchallenges.stop);
    app.post('/api/userchallenge/waypoint/complete', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.userchallenges.completeWP);
    app.post('/api/userchallenge/waypoint/qr', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.userchallenges.completeWPWithQR);
    app.post('/api/userchallenge/waypoint/beacon', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.userchallenges.completeWPWithBeacon);
    app.get('/api/userchallenge/:challengeid/waypoint/:wpid/hint', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.userchallenges.usedHint);
    
    //WAYPOINTS API
    app.get('/api/waypoint/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.waypoints.get);
    
    //USERGENERATEDCONTENT API
    app.get('/api/ugc/challenge/:challengeid/waypoint/:wpid', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.usergeneratedcontent.getLastUGCForWP);
    app.post('/api/ugc/rate', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.usergeneratedcontent.rateUGCWP);

    //PERSONAL MARKER API
    app.get('/api/personalmarker/list', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.personalmarkers.list);
    app.get('/api/personalmarker/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.personalmarkers.get);
    
    //SCANS API
    app.get('/api/scan/'+scanUtils.PERSONAL_MARKER+'/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.scans.scanPersonalMarker);
    app.get('/api/scan/'+scanUtils.WAYPOINT+'/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.scans.scanWaypoint);
    
    //MEETING HOTSPOT API
    app.get('/api/meetinghotspot/list', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.meetinghotspots.list);
    app.get('/api/meetinghotspot/nearby/:location/distance/:distance', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.meetinghotspots.getNearby);
    app.get('/api/meetinghotspot/:id/start/:location', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.meetinghotspots.start);
    app.get('/api/meetinghotspot/:id/stop', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.meetinghotspots.stop);
    app.post('/api/meetinghotspot/scan', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.meetinghotspots.scan);
    app.get('/api/meetinghotspot/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.meetinghotspots.get);
    
    //EXPERIENCES API
    app.get('/api/experience/list', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.experiences.list);
    app.post('/api/experience/buy', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.experiences.buy);
    app.get('/api/experience/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.experiences.get);
    
    //EXPERIENCE TICKETS API
    app.get('/api/experienceticket/list', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.experiencetickets.list);
    app.post('/api/experienceticket/use', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.experiencetickets.use);
    app.get('/api/experienceticket/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.experiencetickets.get);
    
    //NEARBY API
    app.get('/api/nearby/:location/distance/:distance', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.util.getNearby);
    
    //HIGHSCORES API
    app.get('/api/highscore/weekly/:top?', keystone.initAPI, middleware.forceSSL, routes.api.highscores.weeklyHighscores);
    app.get('/api/highscore/personal', keystone.initAPI, middleware.forceSSL, routes.api.highscores.personalHighscores);
    app.get('/api/highscore/:top?', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.highscores.topHighscores);
    
    //UTIL API
    app.get('/api/ping', keystone.initAPI, middleware.forceSSL, routes.api.util.ping);
    app.get('/api/settings', keystone.initAPI, middleware.forceSSL, routes.api.util.settings);
    app.get('/api/media/:objectId', keystone.initAPI, middleware.forceSSL, routes.api.util.getMediahavenUrl);
    
    //FACEBOOK API
    app.get('/fb/challenge/completed/:id', routes.views.fbchallengecompleted);
    
    app.all(/.*/, middleware.forceSSL, routes.views.index)
    
}
