var fs = require('fs'),
	parseUrl = require('url').parse,
	pathExtname = require('path').extname,

	util = require('../util.js'),
	SourcePath = util.parsePath(require('../conf.js').SourcePath),
	notice = require('../notice.js'),
	AppConfig = require('./AppConfig.js'),
	servUtil = require('./server/servUtil.js'),

	zlib = require("zlib"),
	i2serv = require('./initI2serv.js'),

	_faviconIcoBuf, d2fsCont;


fs.readFile(__dirname+'/server/favicon.ico', function(err, buf){
	if (err) {
		notice.warn('SYS', 'favicon not exists');
	} else {
		_faviconIcoBuf = buf;
	}
});

fs.readFile('./lib/module/server/d2fs.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.js'+err);
	} else {
		zlib.gzip(buf, function(err, buf){
			if (err) {
				notice.warn('io', 'gzip d2fs.js'+err);
			} else {
				d2fsCont = buf;
			}
		});
	}
});

i2serv.infoServ.on('request', function(req, res){
	if (req.url == '/d2fs.js') {
		res.writeHead(200, {
			'Content-Type': 'text/javascript',
			'Content-Encoding': 'gzip'
		});
		res.end(d2fsCont);
	}
});

i2serv.io.of('/d2').on('connection', function (socket) {
	socket.on('href', function(href){
		var uri = parseUrl(href),
			conf = AppConfig.find(util.parsePath(AppConfig.DRS(uri.hostname) + uri.pathname)) || AppConfig.defaultApp;

		this.join(conf.root);
	});
});







module.exports = require('http').createServer(function(req, res){
	if (req.url == '/favicon.ico') {
		res.statusCode = 200;
		res.end(_faviconIcoBuf);
		return;
	}
	
	var uri = parseUrl(req.url, true),
		file = util.parsePath(AppConfig.DRS(req.headers.host || '') + uri.pathname),			// 获取文件完整路径
		appConf = AppConfig.find(file);							// 获取项目配置文件



	if (appConf) {
		if (appConf.dataAPI(req, res, uri)) return;				// 判断是否为数据文件
		
		if (appConf.sourceMap[file]) {
			file = appConf.sourceMap[file];						// 是否在映射列表中
		
		} else if (appConf.sourceLink[file]) {
			// 拼接资源
			servUtil.spliceServer(res, file, uri, appConf);
			return;
		} else if (file.indexOf(SourcePath) != -1) {
			res.writeHead(200, {
				'Content-Type': 'text/html'
			});
			res.end('Can not visit File in source path');
			return;
		}

	} else {
		appConf = AppConfig.defaultApp;							// 空白项目
	}

	servUtil.fileServer(res, file, uri, appConf);
});