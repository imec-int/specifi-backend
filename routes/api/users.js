var keystone = require('keystone'),
    i18n = require('i18next');

var User = keystone.list('User');
var UserChallenge = keystone.list('UserChallenge'),
    Challenge = keystone.list('Challenge'),
    async = require('async');

/*
* Get User info by ID
* */
exports.get = function(req, res) {
    User.model.findById(req.params.id, "-password -username_lowercase -email_lowercase").exec(function(err, user) {
        if(err) return res.apiError('1000', i18n.t('1000'));
        if(!user) return res.apiError('1004', i18n.t('1004'));
		return res.apiResponse({ user: user });
    });
};

/*
* Register user
* */

exports.register = function(req, res) {
    var userData = {
        username: req.body.username,
		name: {
			first: req.body.firstname,
			last: req.body.surname
		},
        email: req.body.email,
        password: req.body.password,
        password_confirm: req.body.password,
        isAdmin: false,
		language: "nl-NL",
		privacyAndTerms: (req.body.privacyAndTerms === true || req.body.privacyAndTerms === "true" || req.body.privacyAndTerms === "1")?true:false,
		contactProjects: (req.body.contactProjects === true || req.body.contactProjects === "true" || req.body.contactProjects === "1")?true:false,
		contactSurveys: (req.body.contactSurveys === true || req.body.contactSurveys === "true" || req.body.contactSurveys === "1")?true:false,
		role: 'USER',
        score: keystone.get('startingTokens'),
		photo: (req.files)?req.files['photo_upload']:null
    };
    if(userData.name === {}|| !userData.username || !userData.email || !userData.password) {
        return res.apiError('1001', i18n.t('1001'));
    }
    
    if(userData.username.length < 5 || userData.username.length > 12) {
        return res.apiError('1008', i18n.t('1008'));
    }
    
    var newUser = new User.model(userData);
    User.model.findOne({username_lowercase: userData.username.toLowerCase()}, function(err, user) {
        if(user) { return res.apiError('1007', i18n.t('1007')); }
        User.model.findOne({email_lowercase: userData.email.toLowerCase()}, function(err, user) {
            if(err || user) { return res.apiError('1002', i18n.t('1002')); }
			newUser.getUpdateHandler(req).process(userData, {fields: 'username, email, password, role, language, isAdmin, score, photo, privacyAndTerms, contactProjects, contactSurveys'},
				function (err) {
					if (err) {
						console.log("Error: "+ JSON.stringify(err));
						return res.apiError('1003', i18n.t('1003'));
					}
					if (!newUser.welcomeMailSend)
						keystone.agenda.now('welcome email', {userId: newUser.id});
					
					return res.apiResponse({success: true});
			});
        });
    });
    
};

/*
 * Login user
 * */

exports.login = function(req, res) {
	if(!req.body || !req.body['email']) {
		return res.apiError('1000', i18n.t('1000'));
	}
	User.model.findOne({ email_lowercase: req.body['email'].toLowerCase() }, "-password -username_lowercase -email_lowercase", function(err, user) {
		if(err){
			console.log(JSON.stringify(err));
			return res.apiError('1000', i18n.t('1000'));
		}
		if(!user){ return res.apiError('1004', i18n.t('1004')); }

		keystone.session.signin({email: req.body['email'], password: req.body['password']}, req, res,
			function(user) {
				return res.apiResponse({ user: user });
			},
			function() {
				return res.apiError('1005', i18n.t('1005'));
			}
		);
	});
};

/*
* Logout user
* */

exports.logout = function (req, res) {
    keystone.session.signout(req, res, function(err) {
        if(err) { return res.apiResponse('1000', i18n.t('1000')); }
        return res.apiResponse({success: true});
    });
};


/*
* Change password
* */
exports.changePassword = function(req, res) {
    req.user._.password.compare(req.body['oldPassword'], function(err, result){
        if(err || !result) return res.apiError('1006', i18n.t('1006'));
        if(!req.body['newPassword'] || !req.body['newPassword_confirm'] || req.body['newPassword']=="" || req.body['newPassword_confirm'] =="")
            return res.apiError('1012', i18n.t('1012'));
        var newPassWord = { password: req.body['newPassword'],
                            password_confirm: req.body['newPassword_confirm'] };
        req.user.getUpdateHandler(req).process(newPassWord,{
            fields: 'password',
            flashErrors: false
        }, function(err) {
            if(err) return res.apiError('1000', i18n.t('1000'));
            return res.apiResponse({ success: true });
        });
    });
};


/*
* Edit user info
* */
exports.edit = function(req,res) {
    if(!req.body) { return res.apiError('1015', i18n.t('1015')); }
    if(req.body['password'] || req.body['email'] || req.body['score'] || req.body['username']) { return res.apiError('1016', i18n.t('1016')); }
    req.user.getUpdateHandler(req).process(req.body, {flashErrors: true}, function(err) {
        if(err) { return res.apiError('1014', i18n.t('1014')); }
        return res.apiResponse({ user: req.user});
    });
};

/*
 * Resets the password
 * */
exports.resetPassword = function(req,res) {
    if(!req.body || !req.body.email || !req.body.resetPasswordKey) { return res.apiError('1020', i18n.t('1020')); }
    if(!req.body['newPassword'] || !req.body['newPassword_confirm'] || req.body['newPassword']=="" || req.body['newPassword_confirm'] =="")
        return res.apiError('1012', i18n.t('1012'));
    User.model.findOne().where({'email': req.body.email, resetPasswordKey: req.body.resetPasswordKey}).exec(function(err, user){
        if(err || !user) { return res.apiError('1018', i18n.t('1018')); }
        var newPassWord = { resetPasswordKey : null,
            password: req.body['newPassword'],
            password_confirm: req.body['newPassword_confirm'] };
        user.getUpdateHandler(req).process(newPassWord,{
            fields: 'password, resetPasswordKey',
            flashErrors: false
        }, function(err) {
            if(err) return res.apiError('1000', i18n.t('1000'));
            keystone.session.signin(user._id.toString(), req, res,
                function(user) {
					return res.apiResponse({ user: user });
                },
                function(err) {
                    return res.apiError('1005', i18n.t('1005'));
                }
            );
        });
    });
};


/*
 * Check if username already exists
 * */
exports.checkIfUsernameExists = function(req, res) {
    if(!req.params.username || req.params.username === "") { return res.apiError('1001', i18n.t('1001')); }
    User.model.findOne({username_lowercase: req.params.username.toLowerCase()}, function(err, user) {
        if(err) { return res.apiError('1001', i18n.t('1001')); }
        if(user) { return res.apiError('1007', i18n.t('1007')); }
        return res.apiResponse({unique: true});
    });
};


/*
 * Check if email already exists
 * */
exports.checkIfEmailExists = function(req, res) {
    if(!req.params.email || req.params.email === "") { return res.apiError('1001', i18n.t('1001')); }
    User.model.findOne({email_lowercase: req.params.email.toLowerCase()}, function(err, user) {
        if(err) { return res.apiError('1001', i18n.t('1001')); }
        if(user) { return res.apiError('1002', i18n.t('1002')); }
        return res.apiResponse({unique: true});
    });
};


//**************CHALLENGES*****************//

/*
* Retrieve user's challenges
* */
exports.getChallenges = function(req, res) {
    var completed = false;
    if(req.params.complete && req.params.complete ==='true')
        completed = true;
    UserChallenge.model.find({'user': req.params.id, complete: completed}).populate('challenge user completedWP').exec(function(err, userChallenges) {

        if(err) return res.apiError('1000', i18n.t('1000'));
        
        Challenge.model.populate(userChallenges, {path: 'challenge.waypoints', model:'Waypoint'}, function(err, userChallenges){

            if(err) return res.apiError('1000', i18n.t('1000'));

			return res.apiResponse({
				challenges: userChallenges
			});
            
        });
        
    });
};


