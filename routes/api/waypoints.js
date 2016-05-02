var keystone = require('keystone'),
    i18n = require('i18next');
var Waypoint = keystone.list('Waypoint');

/*
* Gets one particular Waypoint by its id
* */
exports.get = function(req, res) {
    Waypoint.model.findById(req.params.id).exec(function(err, wp) {
        if(err) return res.apiError('1000', i18n.t('1000'));
        if(!wp) return res.apiError('1031', i18n.t('1031'));
		return res.apiResponse({
			waypoint: waypoint
		});
    });
}
