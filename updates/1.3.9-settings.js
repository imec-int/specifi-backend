var keystone = require('keystone'),
    GameSetting = keystone.list('GameSetting');

var gameSettings = [
    { name: 'startingTokens', value: 0, description:"Token amount new players start the game with." }
];

exports = module.exports = function(done) {
    keystone.createItems({ GameSetting:gameSettings },
        function(err, stats){
            console.log(stats);
            done(err);
        });
};
