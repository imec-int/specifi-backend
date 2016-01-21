var keystone = require('keystone'),
    GameSetting = keystone.list('GameSetting');

var gameSettings = [
    { name: 'ticketsEmail', value: process.env.NOREPLY_EMAIL }
];

exports = module.exports = function(done) {
    keystone.createItems({ GameSetting:gameSettings },
        function(err, stats){
            console.log(stats);
            done(err);
        });
};