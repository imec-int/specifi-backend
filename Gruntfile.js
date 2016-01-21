// Generated on 2014-03-10 using generator-webapp 0.4.8
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    var configs = require('load-grunt-configs')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig(configs);

    grunt.registerTask('deploy', function(target){
        if(!target){
            throw new Error('You need to provide an env target');
        }
        grunt.task.run(['env:' + target, 'rsync:'+target, 'slack:' + target]);
    });

//    grunt.registerTask('serve', function (target) {
//        if (target === 'dist') {
//            return grunt.task.run(['build', 'connect:dist:keepalive']);
//        }
//
//        grunt.task.run([
//            'clean:server',
//            'concurrent:server',
//            'autoprefixer',
//            'connect:livereload',
//            'watch'
//        ]);
//    });

//    grunt.registerTask('server', function (target) {
//        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
//        grunt.task.run([target ? ('serve:' + target) : 'serve']);
//    });
//
//    grunt.registerTask('test', function (target) {
//        if (target !== 'watch') {
//            grunt.task.run([
//                'clean:server',
//                'concurrent:test',
//                'autoprefixer'
//            ]);
//        }
//
//        grunt.task.run([
//            'connect:test',
//            'mocha'
//        ]);
//    });

//    grunt.registerTask('build', [
//        'clean:dist',
//        'useminPrepare',
//        'concurrent:dist',
//        'autoprefixer',
//        'concat',
//        'cssmin',
//        'uglify',
//        'copy:dist',
//        'rev',
//        'usemin',
//        'htmlmin'
//    ]);

    grunt.registerTask('default', [
        'deploy'
    ]);


//    grunt.registerTask('release', function(versionOrType){
//        var bumpTask = 'bump-only';
//        if(!versionOrType){
//            bumpTask += ':patch';
//        }else if(semver.clean(versionOrType)){
//            grunt.option('setversion', versionOrType);
//        }else{
//            bumpTask += ':' + versionOrType;
//        }
//        grunt.task.run([
//            bumpTask, 'version', 'build', 'bump-commit'
//        ]);
//    });

};
