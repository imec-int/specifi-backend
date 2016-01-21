var keystone = require('keystone'),
    GameSetting = keystone.list('GameSetting');

var gameSettings = [
    { name: 'personalMarkerCooldown', value: '1440' },
    { name: 'personalMarkerOwnerPoints', value: '1' },
    { name: 'personalMarkerScannerPoints', value: '10' },
    { name: 'personalMarkerGeoFencing', value: 'true' },
    { name: 'personalMarkerOwnerRescanPoints', value: '1' },
    { name: 'personalMarkerScannerRescanPoints', value: '2' }
];

exports = module.exports = function(done) {
    keystone.createItems({ GameSetting:gameSettings },
        function(err, stats){
            console.log(stats);
            done(err);
        });
};