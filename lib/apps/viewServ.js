var fs = require('fs'),
	mod = require('../mod.js'),
	util = mod.util,
	_conf = mod.conf,
	notice = mod.notice,
	mime = mod.mime,
	DRS = mod.load('DRS'),
	favicon = mod.load('favicon'),
	ProjConfig = mod.load('ProjConfig'),
	proj404 = mod.load('proj404');

module.exports = require('http').createServer(function (req, res) {
	if (favicon(req, res) === false) return;

	var uri = util.getURI(req),
		root = DRS.map(uri.hostname),
		file = root + uri.pathname,
		projConf = ProjConfig.projs[root];

	if (projConf && projConf.dataAPI(uri, res, req)) return;		// 判断是否为数据文件

	if (util.fileExists(file)) {
		res.writeHead(200, {
			'Content-type': mime(util.getExtname(file).toLowerCase())
		});
		fs.createReadStream(file)
			.on('error', function(err){
				res.statusCode = 500;
				res.end();

				notice.warn('view', err, file);
			})
			.pipe(res);

		return;
	}

	res.writeHead(404, {'Content-type': 'text/html'});
	res.end(proj404(projConf, _conf.ViewServPort));
	notice.warn('view', '404', file);
});