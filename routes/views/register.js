var keystone = require('keystone'),
	i18n = require('i18next');

exports = module.exports = function(req, res) {

	var locals = res.locals,
		view = new keystone.View(req, res);

	if(req.user) {
		return res.redirect('/');
	}

	locals.logo = '/images/logo.jpg';

	view.render('register');
}
