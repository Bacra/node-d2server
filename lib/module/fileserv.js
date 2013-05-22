var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),

	util = require('../util.js'),
	notice = require('../notice.js'),
	AppConfig = require('./server/AppConfig.js'),
	_conf = require('../conf.js'),
	watchFileCh = require('../watchFileCh.js'),

	initCache = require('./server/cache.js'),

	_fileServer = http.createServer(),

	_faviconIcoBuf = '',
	_gzipExtname = /^(html|css|less|js)$/,
	_gzipReg = /\bgzip\b/i;







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
		appConf = AppConfig.find(file);							// 获取项目配置文件


	if (appConf) {
		if (appConf.dataAPI(req, res, uri)) return;				// 判断是否为数据文件
		if (appConf.sourceMap[file]) file = appConf.sourceMap[file];	// 是否在映射列表中
	} else {
		appConf = AppConfig.defaultApp;							// 空白项目
	}

	fileServer(req, res, file, uri, appConf);
});



function fileServer(req, res, file, uri, appConf){
	var extname = path.extname(file).substring(1),
		useGzip = false, cache;

	if (_gzipExtname.test(extname)) {
		// 判断浏览器是否支持gzip
		useGzip = req.headers['accept-encoding'] && _gzipReg.test(req.headers['accept-encoding']);
		if (!useGzip) notice.warn('GZIP', 'Browser do not support gzip');
	}
	cache = useGzip ? appConf.cacheCont[file] : appConf.cacheTemp[file];

	if (!cache) {
		if (!fs.existsSync(file)) {
			notice.log(404, file);
			res.statusCode = 404;
			res.end();
			return;
		} else {
			cache = initCache(file, extname, useGzip, appConf);
		}
	}


	if (extname == 'html') {
		cache.sendCont(res, uri.query.block);			// 传入参数
	} else {
		cache.sendCont(res);
	}

	if (!appConf.fileWatch[file]) {
		if (extname == 'html') {
			appConf.fileWatch[file] = watchFileCh(file, function(){
				// 刷新页面
				delete appConf.cacheTpl[file];
				cache.refresh();
				appConf.emit(file, uri.pathname, extname);
			});
		} else {
			appConf.fileWatch[file] = watchFileCh(file, function(){
				// 刷新页面
				cache.refresh();
				appConf.emit(file, uri.pathname, extname);
			});
		}
	}
}



module.exports = _fileServer;