var _ = require('underscore'),
	keystone = require('keystone'),
	Types = keystone.Field.Types,
    CustomTypes = require('../lib/fieldTypes'),
    request = require('request'),
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
	name: { label:i18n.t("NAME"), type: Types.Name, index: true },
	email: { label: i18n.t("EMAIL"), type: Types.Email, initial: true, required: true, index: true },
    email_lowercase: { type: String, hidden: true},
	password: { label: i18n.t("PASSWORD"), type: Types.Password, initial: true, required: true },
    score: { label: i18n.t("SCORE"), type: Types.Number, default: 0 },
    birthyear: { label: i18n.t("user.BIRTHYEAR"),type: String },
    gender: { label: i18n.t("user.GENDER"), type: Types.Select, options:[{label:i18n.t("user.MALE"), value:'Male'}, {label:i18n.t("user.FEMALE"), value:'Female'}] },
    photo: { 
        label: i18n.t("user.PHOTO"),
        name: 'random',
        prefix: 'profile-picture-',
        type: CustomTypes.MediaHavenFile,
        host: process.env.MEDIAHAVEN_HOST,
        dest: process.env.MEDIAHAVEN_PATH, 
        allowedTypes: ["image/png", "image/jpeg", "image/gif"],
        username: process.env.MEDIAHAVEN_PUBLIC_USERNAME,
        password: process.env.MEDIAHAVEN_PUBLIC_PW,
        ingestSpaceId: process.env.MEDIAHAVEN_PUBLIC_INGESTSPACE,
        keywords: ['user', 'playground', process.env.ENVIRONMENT],
        categories: ['profiles'],
        allowDuplicates: '1',
        autoPublish: 'true'
    }
}, i18n.t("user.PERMISSIONS"), {
	isAdmin: { label: i18n.t("user.ADMIN"), type: Boolean, default: false }
}, {
    resetPasswordKey: { type: String, hidden: true, noedit: true },
    resetTries: { type: Number, hidden: true, noedit: true, default: 0 },
    welcomeMailSend: { type: Types.Boolean, hidden: true, noedit: true, default: false },
    invitationMailSend: { type: Types.Boolean, hidden: true, noedit: true, default: false },
    unsubscribed: { label: i18n.t("user.UNSUBSCRIBED"), type:Types.Boolean, noedit: true, default: false}
});


// ****************HOOKS****************//

/*
 * Make username and email lowercase
 * */
User.schema.pre('save', function(next){
    if(this.isModified('username')) {
        this.username_lowercase = this.username.toLowerCase();
    }
    if(this.isModified('email')) {
        this.email_lowercase = this.email.toLowerCase();
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
User.schema.methods.getMediaHavenUrls = function(cb) {
    var user = this;
    if(user.photo && user.photo.mediaObjectId !== "") {
        
        var options = {
            port:443,
            strictSSL:false,
            timeout: 2000
        };

        request.get(process.env.MEDIAHAVEN_HOST+process.env.MEDIAHAVEN_PATH+'/'+user.photo.mediaObjectId, options, function(err, message, media) {
            var mediaJSON;
            try{
                mediaJSON = JSON.parse(media);
            }
            catch(err) {
                mediaJSON = null;
            }
            if(mediaJSON) {
                if(mediaJSON.previewImagePath ==="" && mediaJSON.videoPath ==="") {
                    user.photo.url = null;
                    user.photo.videoPath = null;
                } else {
                    user.photo.url = mediaJSON.previewImagePath;
                    user.photo.videoPath = mediaJSON.videoPath;
                }
            } else {
                user.photo = null;
            }
            return cb(user);
        }).auth(process.env.MEDIAHAVEN_PUBLIC_USERNAME, process.env.MEDIAHAVEN_PUBLIC_PW);
    } else {
        return cb(); 
    }
};

//Sends the user a welcome email
User.schema.methods.welcomeEmail = function(callback) {
    var user = this;
    var options = {
        from: {
            name: i18n.t("APP_NAME"),
            email: process.env.NOREPLY_EMAIL
        },
        to: {
            name: user.username,
            email: user.email
        },
        subject: i18n.t("emails.WELCOME_EMAIL_SUBJECT",{appName:i18n.t("APP_NAME")}),
        username: user.username,
        supportEmail: process.env.SUPPORT_EMAIL,
        unsubscribeLink: process.env.BASE+'/unsubscribe/' + encodeURIComponent(user.email),
        host: process.env.BASE
    };

    new keystone.Email('welcome-email').send(options, callback);
};


//Sends the user a reset password email
User.schema.methods.resetPasswordEmail = function(callback) {
    var user = this;

    this.resetPasswordKey = keystone.utils.randomString([24,32]);
    this.resetTries = 0;

    this.save(function(err){
        if(err) return callback(err);

        var resetLink=process.env.BASE+'/reset/' + encodeURIComponent(user.email)+ '/key/'+ encodeURIComponent(user.resetPasswordKey);
        var options = {
            from: {
                name: i18n.t("APP_NAME"),
                email: process.env.NOREPLY_EMAIL
            },
            to: {
                name: user.username,
                email: user.email
            },
            subject: i18n.t("emails.RESET_PASSWORD_EMAIL_SUBJECT",{appName:i18n.t("APP_NAME")}),
            username: user.username,
            unsubscribeLink: process.env.BASE+'/unsubscribe/' + encodeURIComponent(user.email),
            resetLink: resetLink,
            host: process.env.BASE
        };

        new keystone.Email('reset-email').send(options, callback);
    });

};

//Sends the user a ticket bought email
User.schema.methods.ticketBoughtEmail = function(amount, experience, callback) {
    var user = this;
    
    var options = {
        from: {
            name: i18n.t("APP_NAME"),
            email: process.env.NOREPLY_EMAIL
        },
        to: {
            name: user.username,
            email: user.email
        },
        subject: i18n.t("emails.TICKET_BOUGHT_EMAIL_SUBJECT",{appName:i18n.t("APP_NAME")}),
        username: user.username,
        amount: amount,
        experience: experience,
        unsubscribeLink: process.env.BASE+'/unsubscribe/' + encodeURIComponent(user.email),
        host: process.env.BASE
    };

    new keystone.Email('ticket-email').send(options, callback);

};


/**
 * Registration
 */
User.defaultColumns = 'username, name, email, score, isAdmin';
User.register();