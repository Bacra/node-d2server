var fs = require('fs'),
	parseUrl = require('url').parse,
	AppConfig = require('./AppConfig.js'),
	notice = require('../notice.js');

module.exports = require('http').createServer(function (req, res) {
	var file = AppConfig.DRS(req.headers.host || '') + parseUrl(req.url).pathname;

	if (fs.existsSync(file)) {
		res.statusCode = 200;
		fs.createReadStream(file)
			.on('error', function(){
				res.statusCode = 500;
				res.end();
			})
			.pipe(res);
	} else {
		res.statusCode = 404;
		res.end();
		notice.warn('400', 'view file not exists', file);
	}
});