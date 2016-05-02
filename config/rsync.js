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
			args:["--include=node_modules/keystone/", "--exclude=node_modules/*"],
            exclude   : ['env','.git*', '.DS_store', 'Makefile', 'Procfile', 'README.md','config', '.tmp', 'Gruntfile.js', '.env.development', '.env.production', 'test', 'ssl-bundle.crt', 'specifi.key', '.editorconfig', 'npm-debug.log']
		}
    },
    live: {
        options : {
			args:["--include=node_modules/keystone/", "--exclude=node_modules/*"],
            exclude   : ['env', '.git*', '.DS_store', 'Makefile', 'Procfile', 'README.md','config', '.tmp', 'Gruntfile.js', '.env.development', '.env.staging', 'test', 'ssl-bundle.crt', 'specifi.key', '.editorconfig', 'npm-debug.log']
            
        }
    }
};
