var keystone = require('keystone'),
    GameSetting = keystone.list('GameSetting');

var gameSettings = [
    { name: 'personalMarkerGeoFencingDistance', value: '100' }
];

exports = module.exports = function(done) {
    keystone.createItems({ GameSetting:gameSettings },
        function(err, stats){
            console.log(stats);
            done(err);
        });
};