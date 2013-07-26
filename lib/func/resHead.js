var mime = require('../../mime.js'),
	getUTCtime = require('./util.js').getUTCtime,
	resHead = function(extname){
		return resHead.byMime(mime(extname));
	};


resHead.byMime = function(mime){
	return {
		'Content-Type': mime,
		'Expires': '-1',
		'Cache-Control': 'no-store, no-cache, must-revalidate',
		'Pragma': 'no-cache',						//兼容http1.0和https
		'Last-Modified': getUTCtime()
	};
};

module.exports = resHead;