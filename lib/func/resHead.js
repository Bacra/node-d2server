var mime = require('../../mime.js'),
	getUTCtime = require('./util.js').getUTCtime;


module.exports = function(extname){
	return {
		'Content-Type': mime(extname),
		'Expires': '-1',
		'Cache-Control': 'no-store, no-cache, must-revalidate',
		'Pragma': 'no-cache',						//兼容http1.0和https
		'Last-Modified': getUTCtime()
	};
};