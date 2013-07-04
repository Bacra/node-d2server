var fs = require('fs'),
	parseUrl = require('url').parse,
	util = require('../util.js'),
	_conf = require('../../conf.js'),
	AppConfig = require('../appconfig.js'),
	notice = require('../notice.js'),
	get404page = require('../get404page.js');

module.exports = require('http').createServer(function (req, res) {
	var uri = parseUrl(req.url, true),
		file = AppConfig.DRS(req.headers.host || '') + uri.pathname,
		appConf = AppConfig.find(file);

	if (appConf && appConf.dataAPI(uri, res, req)) return;		// 判断是否为数据文件

	if (util.fileExists(file)) {
		res.statusCode = 200;
		fs.createReadStream(file)
			.on('error', function(){
				res.statusCode = 500;
				res.end();
			})
			.pipe(res);

		return;
	}

	res.writeHead(404, {'Content-type': 'text/html'});
	res.end(get404page(appConf, _conf.ViewServPort));
	notice.warn('400', 'view file not exists', file);
});