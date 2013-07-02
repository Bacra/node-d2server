var fs = require('fs'),
	parseUrl = require('url').parse,
	util = require('../util.js'),
	_conf = require('../../conf.js'),
	AppConfig = require('../appconfig.js'),
	notice = require('../notice.js');

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
	} else if (appConf){
		var html = '',
			sitePath = appConf.getSitePath(_conf.ViewServPort);

		util.eachObject(appConf.HTMLData, function(srcFile, outFiles){
			util.eachObject(outFiles, function(outFile, fileConf){
				html += '\t\t<li><a href="'+sitePath+fileConf.href+'" target="_blank">'+fileConf.title+'</a></li>\n';
			});
		});

		res.writeHead(404, {'Content-type': 'text/html'});
		res.end('<!DOCTYPE HTML>\n<html>\n<head>\n<meta charset="utf-8" />\n<title>项目页面INDEX</title>\n</head>\n<body>\n\t<ul>\n'+html+'\t</ul>\n</body>\n</html>');

		return;
	}


	res.statusCode = 404;
	res.end();
	notice.warn('400', 'view file not exists', file);
});