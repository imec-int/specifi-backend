module.exports = {
  "options": {
    "reporter": require('jshint-stylish'),
    "force": true
  },
  "all": [
    "Gruntfile.js",
    "<%= config.app %>/config/{,*/}*.js",
    "!<%= config.app %>/scripts/vendor/*",
    "test/spec/{,*/}*.js"
  ]
};