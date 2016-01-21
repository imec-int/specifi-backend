module.exports = {
  "options": {
    "port": 3000,
    "livereload": 35729,
    "hostname": "localhost"
  },
  "livereload": {
    "options": {
      "open": true,
      "base": [
        ".tmp",
        "<%= config.app %>"
      ]
    }
  },
  "test": {
    "options": {
      "port": 3001,
      "base": [
        ".tmp",
        "test",
        "<%= config.app %>"
      ]
    }
  },
  "dist": {
    "options": {
      "open": true,
      "base": "<%= config.dist %>",
      "livereload": false
    }
  }
};