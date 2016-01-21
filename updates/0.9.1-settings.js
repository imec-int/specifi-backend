var keystone = require('keystone'),
    GameSetting = keystone.list('GameSetting');

var gameSettings = [
    { name: 'randomHotspotTime', value: '17:00' }
];

exports = module.exports = function(done) {
    keystone.createItems({ GameSetting:gameSettings },
        function(err, stats){
            console.log(stats);
            done(err);
        });
};