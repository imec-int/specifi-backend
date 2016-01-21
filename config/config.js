module.exports = function (grunt) {
    return {
        env: process.env,
        app: "app",
        dist: "dist",
        pkg: grunt.file.readJSON('package.json')
    };
};