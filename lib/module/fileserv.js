var http = require('http'),
	fs = require('fs'),
	parseUrl = require('url').parse,
	pathExtname = require('path').extname,

	util = require('../util.js'),
	SourcePath = util.parsePath(require('../conf.js').SourcePath),
	notice = require('../notice.js'),
	AppConfig = require('./AppConfig.js'),
	servUtil = require('./server/servUtil.js'),

	_fileServ = http.createServer(),
	_faviconIcoBuf = '';


fs.readFile(__dirname+'/server/favicon.ico', function(err, buf){
	if (err) {
		notice.warn('SYS', 'favicon not exists');
	} else {
		_faviconIcoBuf = buf;
	}
});


_fileServ.on('request', function(req, res){
	if (req.url == '/favicon.ico') {
		res.statusCode = 200;
		res.end(_faviconIcoBuf);
		return;
	}
	
	var uri = parseUrl(req.url, true),
		docRoot = AppConfig.DRS(req.headers.host || ''),		// 获取文件顶端路径
		file = util.parsePath(docRoot + uri.pathname),			// 获取文件完整路径
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


module.exports = _fileServ;