module.exports = {
    options : {
        files         : ['package.json'],
        updateConfigs : ['config.pkg'],
        commit        : true,
        commitMessage : 'Release v%VERSION%',
        commitFiles   : ['-a'],
        push          : true,
        pushTo        : 'origin',
        createTag     : true,
        tagName       : 'v%VERSION%',
        tagMessage    : 'Version v%VERSION%'
    }
};