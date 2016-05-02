var _ = require('underscore'),
	keystone = require('keystone'),
	Types = keystone.Field.Types,
    i18n = require("i18next");

/**
 * Users
 * =====
 */
var User = new keystone.List('User', {
    autokey: { path: 'slug', from: 'username', unique: true },
    map:{ name:'username' }, 
    track: true
});

User.add({
    username: { label:i18n.t("user.USERNAME"), type: String, required: true, index: true, initial: true},
    username_lowercase: { type: String, hidden: true},
	name: { label:i18n.t("NAME"), type: Types.Name, index: true, required: true, initial: true },
	role: { label:i18n.t('user.ROLE'), type: Types.Select, required: true, index: true, initial: true, options:[{label: i18n.t('user.USER'), value: "USER"}, {label: i18n.t('user.ADMIN'), value: "ADMIN"}], default: "USER", emptyOption: false },
	email: { label: i18n.t("EMAIL"), type: Types.Email, initial: true, required: true, index: true },
    email_lowercase: { type: String, hidden: true},
	password: { label: i18n.t("PASSWORD"), type: Types.Password, initial: true, required: true },
	language: { hidden: true, label: i18n.t("user.LANGUAGE"), type: Types.Select, required: true, initial: true, default:"nl-NL", options:[{label:i18n.t("language.DUTCH"), value:"nl-NL"}]},
    score: { label: i18n.t("SCORE"), type: Types.Number, default: 0 },
    photo: { 
        label: i18n.t("user.PHOTO"),
		type: Types.CloudinaryImage,
		publicId: 'slug',
		folder: 'users',
		autoCleanup: true
    }
}, i18n.t("user.PERMISSIONS"), {
	isAdmin: { label: i18n.t("user.ADMIN"), type: Boolean, default: false, noedit: true, hidden: true }
}, {
    resetPasswordKey: { type: String, hidden: true, noedit: true },
    resetTries: { type: Number, hidden: true, noedit: true, default: 0 },
    welcomeMailSend: { type: Types.Boolean, hidden: true, noedit: true, default: false },
    unsubscribed: { label: i18n.t("user.UNSUBSCRIBED"), type:Types.Boolean, noedit: true, default: false },
    privacyAndTerms: { label: i18n.t("user.PRIVACY_TERMS"), type:Types.Boolean, noedit: true, default: false, required: true },
    contactProjects: { label: i18n.t("user.CONTACT_PROJECTS"), type:Types.Boolean, noedit: true, default: false },
    contactSurveys: { label: i18n.t("user.CONTACT_SURVEYS"), type:Types.Boolean, noedit: true, default: false }
	
});


// ****************HOOKS****************//

/*
 * Make username and email lowercase, give admins access to admin panel
 * */
User.schema.pre('save', function(next){
    if(this.isModified('username')) {
        this.username_lowercase = this.username.toLowerCase();
    }
    if(this.isModified('email')) {
        this.email_lowercase = this.email.toLowerCase();
    }
	
	if(this.isModified('role')) {
		if(this.role === "ADMIN") {
			this.isAdmin = true;
		} else {
			this.isAdmin = false;
		}
	}
    return next();
});


/*
 * Check password length
 * */
User.schema.pre('validate', function(next){
    if(this.isModified('password')) {
        if(this.password.length < 5){ return next(new Error(i18n.t('1013'), '1013')); }
    }
    return next();
});

/*
* Check username uniqueness and length
* */
User.schema.pre('save', function(next){
    if(this.isModified('username')) {
        if(!this.username || this.username.length < 5 || this.username.length > 12) { return next(new Error(i18n.t('1008'), '1008')); }
        User.model.findOne().where('username_lowercase', this.username.toLowerCase()).exec(function(err,user){
            if(user) { return next(new Error(i18n.t('1007'), '1007')); }
            return next();
        });
    } else {
        return next();
    }
});


/*
* Check email uniqueness
* */
User.schema.pre('save', function(next){
    if(this.isModified('email')) {
        User.model.findOne().where('email_lowercase', this.email.toLowerCase()).exec(function(err,user){
            if(user) { return next(new Error(i18n.t('1002'), '1002')); }
            return next();
        });
    } else {
        return next();
    }
});

// ****************VIRTUALS****************//

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
	return this.isAdmin;
});

//****************METHODS****************//

//Sends the user a welcome email
User.schema.methods.welcomeEmail = function(callback, errorCallback) {
    var user = this;
	
	var content = [
		{name:"subject", content: i18n.t("emails.WELCOME_EMAIL_SUBJECT",{appName:i18n.t("APP_NAME")})},
		{name:"appName", content: i18n.t("APP_NAME")},
		{name:"username", content: user.username},
		{name:"mychallenges", content: i18n.t("MY_CHALLENGES")},
		{name:"supportSubject", content: i18n.t("emails.SUGGESTIONS_SUBJECT")},
		{name:"supportSubject", content: i18n.t("emails.SUGGESTIONS_SUBJECT")},
		{name:"supportEmail", content: process.env.SUPPORT_EMAIL},
		{name:"unsubscribeLink", content: process.env.BASE+'/unsubscribe/' + encodeURIComponent(user.email)},
		{name:"host", content: process.env.BASE},
	];
	
	var message = {
		subject: i18n.t("emails.WELCOME_EMAIL_SUBJECT",{appName:i18n.t("APP_NAME")}),
		from_email: process.env.NOREPLY_EMAIL,
		from_name: i18n.t("APP_NAME"),
		to: [{
			email: user.email,
			name: user.username,
			type: "to"
		}],
		images: [{
			type: "image/jpeg",
			name: "LOGO",
			content: "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"
		}]
	};
	
	keystone.mandrill_client.messages.sendTemplate({
		"template_name": "welcome-email-nl", 
		"template_content": content, 
		"message": message},
		callback, 
		errorCallback);
};


//Sends the user a reset password email
User.schema.methods.resetPasswordEmail = function(callback, errorCallback) {
    var user = this;

    this.resetPasswordKey = keystone.utils.randomString([24,32]);
    this.resetTries = 0;

    this.save(function(err){
        if(err) return callback(err);

		var content = [
			{name:"appName", content: i18n.t("APP_NAME")},
			{name:"username", content: user.username},
			{name:"unsubscribeLink", content: process.env.BASE+'/unsubscribe/' + encodeURIComponent(user.email)},
			{name:"resetLink", content: process.env.BASE+'/reset/' + encodeURIComponent(user.email)+ '/key/'+ encodeURIComponent(user.resetPasswordKey)},
			{name: "host", content:process.env.BASE}
		];

		var message = {
			subject: i18n.t("emails.RESET_PASSWORD_EMAIL_SUBJECT",{appName:i18n.t("APP_NAME")}),
			from_email: process.env.NOREPLY_EMAIL,
			from_name: i18n.t("APP_NAME"),
			to: [{
				email: user.email,
				name: user.username,
				type: "to"
			}],
			images: [{
				type: "image/jpeg",
				name: "LOGO",
				content: "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"
			}]
		};

		keystone.mandrill_client.messages.sendTemplate({
				"template_name": "reset-password-nl",
				"template_content": content,
				"message": message},
			callback,
			errorCallback);
    });

};


/**
 * Registration
 */
User.defaultColumns = 'username, name, email, score, role';
User.register();
