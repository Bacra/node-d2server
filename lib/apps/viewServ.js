var fs = require('fs'),
	mod = require('../mod.js'),
	util = mod.util,
	_conf = mod.conf,
	notice = mod.notice,
	mime = mod.mime,
	DRS = mod.load('DRS'),
	favicon = mod.load('favicon'),
	ProjConfig = mod.load('ProjConfig'),
	proj404 = mod.load('proj404'),

	d2fsJS = mod.load('d2fsJS'),
	mimeTag = mod.load('mimeTag');

module.exports = require('http').createServer(function (req, res) {
	if (favicon(req, res) === false) return;

	var uri = util.getURI(req),
		root = DRS.map(uri.hostname),
		file = util.parsePath(root + uri.pathname),
		projConf = ProjConfig.find(file);

	if (projConf) {
		if (file == projConf.root) {		// 项目首页（相关信息）
			proj404.send(res, projConf, _conf.ViewServPort);
			return;
		}
		if (projConf.catalog) file = projConf.removeCatalog(file);
	}


	if (util.fileExists(file)) {
		res.writeHead(200, {
			'Content-type': mime(file)
		});
		fs.createReadStream(file)
			.on('error', function(err){
				res.statusCode = 500;
				res.end();

				notice.warn('view', err, file);
			})
			.on('end', function(){
				if (util.getExtname(file) == 'html') {
					res.end('\n'+mimeTag.js(d2fsJS.getD2fsURI(projConf ? projConf.dirname : '')));
				} else {
					res.end();
				}
			})
			.pipe(res, {'end': false});
	} else if (projConf) {
		projConf.dataAPI(uri, res, req, function(statusCode){
			notice.warn('view', statusCode, file);
			proj404.send(res, projConf, _conf.ViewServPort);
		});
	} else {
		proj404.send(res, projConf, _conf.ViewServPort);
		notice.warn('view', '404', file);
	}

});