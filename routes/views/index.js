var keystone = require('keystone'),
    i18n = require('i18next');

exports = module.exports = function(req, res) {
	
	var locals = res.locals,
		view = new keystone.View(req, res);
    view.on('init', function(next){
        next();
    });
    
    
    view.render('index');  
}
