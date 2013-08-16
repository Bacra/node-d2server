var mime = require('mime');

mime.define({
	'text/css': ['less']
});

module.exports = function(fileType){
	return mime.lookup(fileType);
};