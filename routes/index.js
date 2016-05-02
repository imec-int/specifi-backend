var _ = require('underscore'),
	keystone = require('keystone'),
	middleware = require('./middleware'),
	importRoutes = keystone.importer(__dirname)
	path = require("path");

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
	app.all('/register', middleware.forceSSL, routes.views.register);
	app.all('/register/normal', middleware.forceSSL, routes.views.registrationform);
    app.all('/forgotpassword', middleware.forceSSL, routes.views.forgotPassword);
    app.get('/reset/:email/key/:key', middleware.forceSSL, routes.views.resetPassword);
    app.all('/changepassword', middleware.requireUser, middleware.forceSSL, routes.views.changePassword);
    app.all('/unsubscribe/:email', middleware.requireUser, middleware.forceSSL, routes.views.unsubscribe);
	
    //USER API
    app.get('/api/user/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.users.get);
    app.post('/api/user/register', keystone.initAPI, middleware.forceSSL, routes.api.users.register);
    app.post('/api/user/login', keystone.initAPI, middleware.forceSSL, routes.api.users.login);
    app.post('/api/user/logout', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.users.logout);
    app.post('/api/user/changepassword', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.users.changePassword);
    app.get('/api/user/:id/challenges/:complete?', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.users.getChallenges);
    app.get('/api/user/:username/username/unique', keystone.initAPI, middleware.forceSSL, routes.api.users.checkIfUsernameExists);
    app.get('/api/user/:email/email/unique', keystone.initAPI, middleware.forceSSL, routes.api.users.checkIfEmailExists);
	
    //app.post('/api/user/edit', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.users.edit);
    //app.post('/api/user/resetpassword', keystone.initAPI, middleware.forceSSL, routes.api.users.resetPassword);
    
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
    
    //WAYPOINTS API
    app.get('/api/waypoint/:id', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.waypoints.get);
    
    //USERGENERATEDCONTENT API
    app.get('/api/ugc/challenge/:challengeid/waypoint/:wpid', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.usergeneratedcontent.getLastUGCForWP);
    app.post('/api/ugc/rate', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.usergeneratedcontent.rateUGCWP);

    //NEARBY API
    app.get('/api/nearby/:location/distance/:distance', keystone.initAPI, middleware.requireUserAPI, middleware.forceSSL, routes.api.util.getNearby);
    
    //UTIL API
    app.get('/api/ping', keystone.initAPI, middleware.forceSSL, routes.api.util.ping);
    app.get('/api/settings', keystone.initAPI, middleware.forceSSL, routes.api.util.settings);
	
	//Privacy
	app.get('/api/termsandconditions', keystone.initAPI, middleware.forceSSL, routes.api.util.privacy);
	
    app.all(/.*/, middleware.forceSSL, routes.views.index)
    
}
