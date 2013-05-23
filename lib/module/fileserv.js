var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),

	util = require('../util.js'),
	notice = require('../notice.js'),
	AppConfig = require('./server/AppConfig.js'),
	_conf = require('../conf.js'),

	_fileServer = http.createServer(),
	_faviconIcoBuf = '';





fs.readFile(__dirname+'/server/favicon.ico', function(err, buf){
	if (err) {
		notice.warn('SYS', 'favicon not exists');
	} else {
		_faviconIcoBuf = buf;
	}
});




// 初始化项目属性
fs.readdir(_conf.DocumentRoot, function(err, files) {
	if (err) throw new Error();
	var initAppConfig = AppConfig.init;
	files.forEach(function(v){
		if (v != '.'&& v != '..') {
			var file = _conf.DocumentRoot +v+'/'+_conf.AppConfigFile;
			fs.exists(file, function(exists){
				if (exists) initAppConfig(util.parsePath(_conf.DocumentRoot +v+'/'));
			});
		}
	});
});









_fileServer.on('request', function(req, res){
	if (req.url == '/favicon.ico') {
		res.statusCode = 200;
		res.end(_faviconIcoBuf);
		return;
	}
	
	var uri = url.parse(req.url, true),
		docRoot = AppConfig.DRS(req.headers.host || ''),		// 获取文件顶端路径
		file = util.parsePath(docRoot + uri.pathname),			// 获取文件完整路径
		appConf = AppConfig.find(file),							// 获取项目配置文件
		isBlankApp, isInSourceMap;


	if (appConf) {
		if (appConf.dataAPI(req, res, uri)) return;				// 判断是否为数据文件
		if (appConf.sourceMap[file]) {
			file = appConf.sourceMap[file];	// 是否在映射列表中
			isInSourceMap = true;
		}
	} else {
		appConf = AppConfig.defaultApp;							// 空白项目
		isBlankApp = true;
	}




	var extname = path.extname(file).substring(1),
		cache = appConf.cache[file];

	if (!cache) {
		if (!fs.existsSync(file)) {
			notice.log(404, file);
			res.statusCode = 404;
			res.end();
			return;
		} else if (extname == 'html') {
			if (!isBlankApp && !isInSourceMap) {
				res.writeHead(200, {
					'Content-Type': 'text/html'
				});
				res.end('HTML File Must Specified In AppConfig');
				return;
			}
			
			appConf.addPageReloadWatch(file, function(){
				delete appConf.cacheTpl[file];
				delete appConf.cache[file];
			});
		} else if (!appConf.watchFiles[file]) {
			if (extname == 'less' || extname == 'css') {
				appConf.addCssReloadWatch(file, uri.pathname);
			} else {
				appConf.addPageReloadWatch(file, function(){
					delete appConf.cache[file];
				});
			}
		}

		cache = appConf.addCache(file, extname);
	}


	if (extname == 'html') {
		cache.sendCont(res, uri.query.block);			// 传入参数
	} else {
		cache.sendCont(res);
	}
});



module.exports = _fileServer;