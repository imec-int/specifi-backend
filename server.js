// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();
// Require keystone
var keystone = module.exports = require('keystone'),
    _ = require('underscore'),
    i18n = require('i18next');

var agenda = require('./lib/agenda/agenda');

keystone.init({
    
	'name': 'playground',
	'brand': 'Playground',
    'title': process.env.APP_NAME,
    
    'port': process.env.HTTP_PORT,
	
	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	
	'views': 'templates/views',
	'view engine': 'jade',

    'emails': 'templates/emails',
	
	'auto update': true,
	
	'session': true,
    'session store': 'mongo',
	'auth': true,
	'user model': 'User',
    'signin url': '/signin',
    'signin redirect': '/',
    
    'ssl': 'true',
    'ssl port': process.env.PORT,
    'ssl key': '../yourkey.pem',
    'ssl cert': '../yourkey.pem',
    
    'cookie signin': true
    
});


i18n.init({
    lng: "en-US",
    fallbackLng: 'en-US'
}, function(t) {
    
    // Load your project's Models
    keystone.import('models');

    // Setup common locals for your templates. The following are required for the
    // bundled templates and layouts. Any runtime locals (that should be set uniquely
    // for each request) should be added to ./routes/middleware.js
    keystone.set('locals', {
        _: require('underscore'),
        env: keystone.get('env'),
        utils: keystone.utils,
        editable: keystone.content.editable
    });


    // Load your project's Routes
    keystone.set('routes', require('./routes'));

    // Configure the navigation bar in Keystone's Admin UI
    keystone.set('nav', {
        'users': 'User',
        'challenges': ['Challenge', 'Waypoint'],
        'personal-marker': ['PersonalMarker'],
        'meeting-hotspots': ['MeetingHotspotTemplate', 'MeetingHotspot', 'MeetingHotspotScan'],
        'experiences':['Experience', 'ExperienceTicket'],
        'user-data': ['Scan', 'UserChallenge', 'UserGeneratedContent', 'UserGeneratedContentRating', 'ActionLog'],
        'settings': 'GameSetting'
    });

    // Start Keystone to connect to your database and initialise the web server
    keystone.start(function(){
        //Load game settings
        var GameSetting = keystone.list('GameSetting');
        GameSetting.model.find(function(err, settings) {
            _.each(settings,function(setting){
                keystone.set(setting.name, setting.value);
            });
            //Start agenda
            keystone.agenda = agenda(['meetinghotspot', 'email']);

            //Schedule random hotspots
            keystone.agenda.cancel({name:'spawnRandomMeetingHotspot'}, function(err, removed) {
                var job = keystone.agenda.create('spawnRandomMeetingHotspot');
                job.schedule(keystone.get('randomHotspotTime'));
                job.repeatAt('tomorrow at '+keystone.get('randomHotspotTime'));
                job.save(function(err){
                    console.log('Random hotspot job saved');
                });
            });

        });

    });
});

i18n.registerAppHelper(keystone.app);

// Configure i18n
keystone.app.configure(function() {
    keystone.app.use(i18n.handle);
});




