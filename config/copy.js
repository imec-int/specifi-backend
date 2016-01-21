module.exports = {
    staging: {
        files: [{
            expand: true,
            dot: true,
            cwd: 'env-vars',
            dest: './',
            src: [
                '.env.staging'
            ],
            rename: function(dest, src) {
                return dest + src.replace('staging','production');
            }
        }]
    },
    live: {
        files: [{
            expand: true,
            dot: true,
            cwd: 'env-vars',
            dest: './',
            src: [
                '.env.production'
            ],
            rename: function(dest, src) {
                return dest + src;
            }
        }]
    }
};