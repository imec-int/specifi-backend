var keystone = require('keystone'),
	GameSetting = keystone.list('GameSetting');

var gameSettings = [
	{ name: 'challengeCooldown', value: 600, description:"Cooldown time in seconds that has to pass before a Challenge can be restarted. Only in effect if the Challenge is limited by cooldown. " }
];

exports = module.exports = function(done) {
	keystone.createItems({ GameSetting:gameSettings },
		function(err, stats){
			console.log(stats);
			done(err);
		});
};
