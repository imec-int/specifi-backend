/*!
 * Module dependencies.
 */

var _ = require('underscore'),
	keystone = require('keystone'),
    moment = keystone.moment,
	async = require('async'),
	util = require('util'),
	utils = keystone.utils,
	super_ = keystone.Field,
    fspath = require('path'),
    fs = require('fs'),
    request = require('request'),
    i18n = require('i18next'),
    Xmlbuilder = require('xmlbuilder'),
    mediahaven = require('../util/mediahaven-utils');

/**
 * MediaHaven FieldType Constructor
 * @extends Field
 * @api public
 */

function mediahavenfile(list, path, options) {

	this._underscoreMethods = ['format', 'uploadFile'];

	// event queues
	this._pre = {
		upload: []
	};

	options.nofilter = true;

	if (options.initial) {
		throw new Error('Invalid Configuration\n\n' +
			'MediaHaven fields (' + list.key + '.' + path + ') do not currently support being used as initial fields.\n');
	}

    options.templateDir = fspath.normalize( __dirname + '../../../templates/fields/' + this.constructor.name);

	mediahavenfile.super_.call(this, list, path, options);

	// Could be more pre- hooks, just upload for now
	if (options.pre && options.pre.upload) {
		this._pre.upload = this._pre.upload.concat(options.pre.upload);
	}

    this.type = 'localfile';
}

/*!
 * Inherit from Field
 */

util.inherits(mediahavenfile, super_);

/**
 * Allows you to add pre middleware after the field has been initialised
 *
 * @api public
 */

mediahavenfile.prototype.pre = function(event, fn) {
	if (!this._pre[event]) {
		throw new Error('MediaHavenFile (' + this.list.key + '.' + this.path + ') error: mediahavenfield.pre()\n\n' +
			'Event ' + event + ' is not supported.\n');
	}
	this._pre[event].push(fn);
	return this;
};


/**
 * Registers the field on the List's Mongoose Schema.
 *
 * @api public
 */

mediahavenfile.prototype.addToSchema = function() {

	var field = this,
		schema = this.list.schema;

	var paths = this.paths = {
		// fields
		filename:		this._path.append('.filename'),
		path:			this._path.append('.path'),
		size:			this._path.append('.size'),
		filetype:		this._path.append('.filetype'),
		url:			this._path.append('.url'),
        mediaObjectId:	this._path.append('.mediaObjectId'),
		// virtuals
		exists:			this._path.append('.exists'),
		upload:			this._path.append('_upload'),
		action:			this._path.append('_action')
	};

	var schemaPaths = this._path.addTo({}, {
        filename: String,
        mediaObjectId: String,
        fragmentId: String,
        ingestSpaceId: String,
        size: Number,
        filetype: String,
        metadata: String,
        url: String,
        videoPath: String
	});

	schema.add(schemaPaths);

	var exists = function(item) {
		return (item.get(paths.url) ? true : false);
	};
    

	// The .exists virtual indicates whether a file is stored
	schema.virtual(paths.exists).get(function() {
		return schemaMethods.exists.apply(this);
	});

	var reset = function(item) {
		item.set(field.path, {
            filename: '',
            mediaObjectId: '',
            fragmentId: '',
            ingestSpaceId: '',
            size: 0,
            filetype: '',
            metadata: '',
            url: '',
            videoPath: ''
		});
	};

	var schemaMethods = {
		exists: function() {
			return exists(this);
		},
		/**
		 * Resets the value of the field
		 *
		 * @api public
		 */
		reset: function() {
			reset(this);
		},
		/**
		 * Deletes the file from MediaHaven and resets the field
		 *
		 * @api public
		 */
		delete: function() {
			try {
                //TODO Implement delete
//				var client = knox.createClient(field.s3config);
//				client.deleteFile(this.get(paths.path) + this.get(paths.filename), function(err, res){ res ? res.resume() : false; });
			} catch(e) {}
			reset(this);
		}
	};

	_.each(schemaMethods, function(fn, key) {
		field.underscoreMethod(key, fn);
	});

	// expose a method on the field to call schema methods
	this.apply = function(item, method) {
		return schemaMethods[method].apply(item, Array.prototype.slice.call(arguments, 2));
	};

	this.bindUnderscoreMethods();
};


/**
 * Formats the field value
 *
 * @api public
 */

mediahavenfile.prototype.format = function(item) {
	return item.get(this.paths.url);
};


/**
 * Detects whether the field has been modified
 *
 * @api public
 */

mediahavenfile.prototype.isModified = function(item) {
	return item.isModified(this.paths.url);
};


/**
 * Validates that a value for this field has been provided in a data object
 *
 * @api public
 */

mediahavenfile.prototype.validateInput = function(data) {
	// TODO - how should file field input be validated?
	return true;
};


/**
 * Updates the value for this field in the item from a data object
 *
 * @api public
 */

mediahavenfile.prototype.updateItem = function(item, data) {
	// TODO - direct updating of data (not via upload)
};


/**
 * Uploads the file for this field
 *
 * @api public
 */

mediahavenfile.prototype.uploadFile = function(item, file, update, callback) {

	var field = this;
    var name;
    if(field.options.name) {
        if(field.options.name === 'random') {
            name = utils.randomString(24);
        } else {
            name = field.options.name;
        }
    }
    else
        name = item[field.options.nameField];
    name = name.toLowerCase();
    name = field.options.prefix + name;
    name+="."+mediahaven.getFileExtension(file.name);

	if (field.options.allowedTypes && !_.contains(field.options.allowedTypes, file.type)){
		return callback(new Error(i18n.t("error.UNSUPPORTED_FILE_TYPE", {fileType:file.type, allowedTypes:field.options.allowedTypes.toString()})));
	}

	if ('function' == typeof update) {
		callback = update;
		update = false;
	}
    
    var location = field.options.host || "";
    var user = field.options.username || "";
    var pw = field.options.password || "";
    var dest = field.options.dest || "";
    var ingestSpaceId = field.options.ingestSpaceId || "";
    var autoPublish = field.options.autoPublish || false;
    
    //Build a metadata 
    var xml = Xmlbuilder.create('MediaHAVEN_external_metadata');
    //set title
    xml.att('name', 'yourapp');
    xml.att('version', '1');
    xml.ele('title', name);
    //set allow duplicates
    //xml.ele('ALLOW_DUPLICATE', field.options.allowDuplicates);
    //set categories
    if(field.options.categories && field.options.categories.length > 0) {
        xml = xml.ele('MDProperties').ele('Categories');
        xml.att('type', 'list');
        _.each(field.options.categories, function(category, index) {
            xml.ele('category', category);
        });
        xml = xml.up().up();
    }
    //set keywords
    if(field.options.keywords && field.options.keywords.length > 0) {
        xml = xml.ele('keywords');
        _.each(field.options.keywords, function(keyword, index) {
            xml.ele('keyword', keyword);
        });
        xml = xml.up();
    }
    var metadata = xml.end({pretty:true});
    
    
	var doUpload = function() {

        var options = {
            port:443,
            strictSSL:false,
            timeout: 25000
        };
        
        var r = request.post(location+dest, options, function(err, httpResponse, body) {
            if (httpResponse) { httpResponse.resume(); }
            if(err || (httpResponse.statusCode != 200 && httpResponse.statusCode != 409 && httpResponse.statusCode != 201)) { return callback(new Error(i18n.t('1009'), '1009')); }
            if(httpResponse.statusCode == 409) { 
                //Duplicate file on mediahaven
                console.log(httpResponse.headers);
                if(httpResponse.headers['location']) {
                    var location = httpResponse.headers['location'].toString();
                    var lastSlash = location.lastIndexOf('/');
                    var mediaObjectId = location.substring(lastSlash+1);
                    var fileData = {
                        filename: name,
                        mediaObjectId: mediaObjectId,
                        fragmentId: null,
                        ingestSpaceId: ingestSpaceId,
                        size: file.size,
                        filetype: file.type,
                        metadata: metadata,
                        url: name,
                        videoPath:""
                    };
                    if (update) {
                        item.set(field.path, fileData);
                    }

                    return callback(null, fileData);
                } else {
                    return callback(new Error(i18n.t('1011'),'1011'));
                }
            }
            var bodyJSON;
            try {
                bodyJSON = JSON.parse(body);
            } catch(err) {
                return callback(new Error(i18n.t('1009'), '1009'));
            }
            if(!bodyJSON){ return callback(new Error(i18n.t('1009'), '1009')); }
            var fileData = {
                filename: name,
                mediaObjectId: bodyJSON.mediaObjectId,
                fragmentId: bodyJSON.fragmentId,
                ingestSpaceId: ingestSpaceId,
                size: file.size,
                filetype: file.type,
                metadata: metadata,
                url: name,
                videoPath:""
            };

            if (update) {
                item.set(field.path, fileData);
            }
            
            callback(null, fileData);
            
        }).auth(user, pw);

        var form = r.form();
        form.append('file', fs.createReadStream(fspath.join(file.path.replace(/[^\/]*$/, ''), name)));
        form.append('metadata', metadata);
        form.append('ingestSpaceId', ingestSpaceId);
        form.append('autoPublish', autoPublish);
        r.setHeader('content-type', 'multipart/form-data; charset=utf-8')
	};


    
    
	async.eachSeries(this._pre.upload, function(fn, next) {
		fn(item, file, next);
	}, function(err) {
		if (err) return callback(err);
        fs.rename(file.path, fspath.join(file.path.replace(/[^\/]*$/, ''),name), function (err, data) {
            if(err) { return callback(new Error(i18n.t('1009'), '1009')); }
            doUpload();
        });
	});

};


/**
 * Returns a callback that handles a standard form submission for the field
 *
 * Expected form parts are
 * - `field.paths.action` in `req.body` (`clear` or `delete`)
 * - `field.paths.upload` in `req.files` (uploads the file to mediahavenfile)
 *
 * @api public
 */

mediahavenfile.prototype.getRequestHandler = function(item, req, paths, callback) {

	var field = this;

	if (utils.isFunction(paths)) {
		callback = paths;
		paths = field.paths;
	} else if (!paths) {
		paths = field.paths;
	}

	callback = callback || function() {};

	return function() {

		if (req.body) {
			var action = req.body[paths.action];

			if (/^(delete|reset)$/.test(action))
				field.apply(item, action);
		}

		if (req.files && req.files[paths.upload] && req.files[paths.upload].size) {
			return field.uploadFile(item, req.files[paths.upload], true, callback);
		}

		return callback();

	};

};


/**
 * Immediately handles a standard form submission for the field (see `getRequestHandler()`)
 *
 * @api public
 */

mediahavenfile.prototype.handleRequest = function(item, req, paths, callback) {
	this.getRequestHandler(item, req, paths, callback)();
};


/*!
 * Export class
 */

exports = module.exports = mediahavenfile;
