var fs = require('fs'),
	parseUrl = require('url').parse,
	pathExtname = require('path').extname,

	util = require('../util.js'),
	_conf = require('../../conf.js'),
	SourcePath = util.parsePath(_conf.SourcePath),
	notice = require('../notice.js'),
	AppConfig = require('../appconfig.js'),
	servUtil = require('../servutil.js'),


	i2serv = require('./i2serv.js'),
	_faviconIcoBuf, d2fsCont,
	d2fsUrlReg = /^\/d2fs\.js(?:\?root=(.*))$/i,
	encodeDocumentRoot = encodeURIComponent(_conf.DocumentRoot);


fs.readFile(__dirname+'/../src/favicon.ico', function(err, buf){
	if (err) {
		notice.warn('SYS', 'favicon not exists');
	} else {
		_faviconIcoBuf = buf;
	}
});

fs.readFile(__dirname+'/../src/d2fs.js', function(err, buf){
	if (err) {
		notice.warn('io', 'read d2fs.js'+err);
	} else {
		d2fsCont = buf.toString();
	}
});

i2serv.infoServ.on('request', function(req, res){
	var match = req.url.match(d2fsUrlReg);
	if (match) {
		res.writeHead(200, {
			'Content-Type': 'text/javascript'
		});
		
		res.end(d2fsCont.replace('{@appname}', match[1] || encodeDocumentRoot));
	}
});

i2serv.io.of('/d2').on('connection', function (socket) {
	socket.on('joinApp', function(root){
		this.join(decodeURIComponent(root));
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