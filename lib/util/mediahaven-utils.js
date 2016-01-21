
/*
* Returns the extension based on the filename
* */
exports.getFileExtension = function(filename) {
    var re = /(?:\.([^.]+))?$/;
    return re.exec(filename)[1];
};