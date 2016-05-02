var _ = require('underscore'),
	keystone = require('keystone'),
	i18n = require('i18next'),
	User = keystone.list("User");
var querystring = require('querystring');

exports = module.exports = function(req, res) {

	var locals = res.locals,
		view = new keystone.View(req, res);

	locals.logo = '/images/logo.jpg';
	
	var origin = 'site';
	
	if(req.user) {
		return res.redirect('/');
	}
	
	
	locals.user = {
		"name":{
			"first": "",
			"last": ""
		}
	};
	
	view.on('post', { action: 'register' }, function(next) {

		var userData = {
			username: req.body['username'],
			email: req.body['email'],
			password: req.body['password'],
			password_confirm: req.body['password'],
			name: {
				first: req.body['firstname'],
				last: req.body['surname']
			},
			language: "nl-NL",
			privacyAndTerms: req.body['privacyAndTerms'], 
			contactProjects: req.body['contactProjects'], 
			contactSurveys: req.body['contactSurveys'],
			isAdmin: false,
			role: 'USER',
			score: 0
		};

		
		//Do validation
		var errors = [];
		
		if(!userData.username || !userData.name || !userData.name.first || !userData.name.last || !userData.email || !userData.password || !userData.language || !userData.privacyAndTerms) {
			errors.push(i18n.t('1001'));
		}

		if(userData.username.length < 5 || userData.username.length > 12) {
			errors.push(i18n.t('1008'));
		}
		
		var newUser = new User.model(userData);

		User.model.findOne({username_lowercase: userData.username.toLowerCase()}, function(err, user) {
			if(user) { errors.push(i18n.t('1007')); }
			User.model.findOne({email_lowercase: userData.email.toLowerCase()}, function(err, user) {
				if(err || user) { errors.push(i18n.t('1002')); }
				
				if(errors.length > 0) {
					req.flash('error', _.each(errors, function(error) {
						return error + "\n";
					}));
					locals.user = userData;
					return next();
				}
				newUser.getUpdateHandler(req).process(userData, {fields:'username, name, email, password, isAdmin, score, language, privacyAndTerms, contactProjects, contactSurveys'},
					function(err) {
						if(err) {
							req.flash('error', i18n.t('1003'));
							return next();
						}
						if(!newUser.welcomeMailSend)
							keystone.agenda.now('welcome email',{userId: newUser.id});

						var onSuccess = function() {
							return res.redirect('/');
						}

						var onFail = function() {
							req.flash('error', i18n.t("error.INCORRECT_PASSWORD"));
							return res.redirect('/');
						}
		
						return keystone.session.signin({ email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail);
						
					});
			});
		});
		
	});

	view.render('registrationform');
}
