var keystone = require('keystone'),
    GameSetting = keystone.list('GameSetting');

var gameSettings = [
    { name: 'ratingPointsCreator', value: '1', description:"Amount of points the creator of the UGC receives when someone likes his content." }
];

exports = module.exports = function(done) {
    keystone.createItems({ GameSetting:gameSettings },
        function(err, stats){
            console.log(stats);
            done(err);
        });
};
