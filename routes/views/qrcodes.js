var keystone = require('keystone'),
    i18n = require('i18next');

exports = module.exports = function(req, res) {
    
    var locals = res.locals,
        view = new keystone.View(req, res);

    view.on('init', function(next){
        keystone.list(req.params.model).model.findOne({_id: req.params.id}).exec(function(err, item){
            locals.item = {
                value: item.id+'/'+item[req.params.path],
                title: req.params.title
            };
            next();
        });
    });

    view.render('qrcodes');
}