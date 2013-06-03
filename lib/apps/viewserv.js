var fs = require('fs'),
	parseUrl = require('url').parse,
	util = require('../util.js'),
	AppConfig = require('../appconfig.js'),
	notice = require('../notice.js');

module.exports = require('http').createServer(function (req, res) {
	var file = AppConfig.DRS(req.headers.host || '') + parseUrl(req.url).pathname,
		appConf = AppConfig.find(file);

	if (appConf && appConf.root == util.parsePath(file)) {
		var html = '';
		util.eachObject(appConf.HTMLData, function(srcFile, outFiles){
			util.eachObject(outFiles, function(outFile, fileConf){
				html += '<li><a href="'+fileConf.href+'" target="_blank">'+fileConf.title+'</a></li>';
			});
		});

		res.writeHead(200, {'Content-type': 'text/html'});
		res.end('<ul>'+html+'</ul>');
		return;
	}

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