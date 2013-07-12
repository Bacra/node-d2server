var fs = require('fs'),
	parseUrl = require('url').parse,
	mod = require('../mod.js'),
	util = mod.util,
	_conf = mod.conf,
	notice = mod.notice,
	ProjConfig = mod.load('ProjConfig'),
	proj404 = mod.load('proj404');

module.exports = require('http').createServer(function (req, res) {
	var uri = parseUrl(req.url, true),
		file = ProjConfig.DRS(req.headers.host || '') + uri.pathname,
		projConf = ProjConfig.find(file);

	if (projConf && projConf.dataAPI(uri, res, req)) return;		// 判断是否为数据文件

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
	res.end(proj404(projConf, _conf.ViewServPort));
	notice.warn('400', 'view file not exists', file);
});