module.exports = {
    options : {
        recursive : true,
        src                : ['./' ], //trailing slash REQUIRED [!]
        dest               : '<%= config.env.DEST %>',
        host               : ['<%= config.env.USER %>', '@', '<%= config.env.HOST %>'].join(''),
        syncDestIgnoreExcl : true
    },
    staging : {
        options : {
            exclude   : ['.git*', '.DS_store', 'Makefile', 'Procfile', 'README.md','config', '.tmp', 'node_modules', 'Gruntfile.js', '.env.development', '.env.production', 'test', '.editorconfig']
        }
    },
    live: {
        options : {
            exclude   : ['.git*', '.DS_store', 'Makefile', 'Procfile', 'README.md','config', '.tmp', 'node_modules', 'Gruntfile.js', '.env.development', '.env.staging', 'test', '.editorconfig']
            
        }
    }
};
