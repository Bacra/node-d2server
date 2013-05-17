var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),

	util = require('../util.js'),
	notice = require('../notice.js'),
	AppConfig = require('./server/AppConfig.js'),
	_alias = AppConfig.alias,
	_apps = AppConfig.apps,
	_conf = require('../conf.js'),
	watchFileCh = require('../watchFileCh.js'),

	Cache = require('./server/cache.js'),

	_fileServer = http.createServer(),

	_faviconIcoBuf = '',
	_gzipExtname = /^(html|css|less|js)$/,
	_gzipReg = /\bgzip\b/i,
	_aliasReg = /^([^\.]+)\./;






setInterval(function(){
	util.eachObject(_apps, function(i, v){
		v.cacheTemp = {};
	});
}, _conf.AutoClearCache);		// 每xxx分钟，清除临时缓存一次


fs.readFile(__dirname+'/server/favicon.ico', function(err, buf){
	if (err) {
		notice.warn('SYS', 'favicon not exists');
	} else {
		_faviconIcoBuf = buf;
	}
});



// 新建一个空白项目，用于存放没有项目遮盖的文件
AppConfig.add('widthoutApp', {});
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
		host = req.headers.host,
		docRoot = _conf.DocumentRoot,
		file, appConf;

	// 获取文件顶端路径
	if (host) {
		host = host.match(_aliasReg);
		if (host) {
			host = host[1].toLowerCase();
			if (_alias[host]) docRoot = _alias[host];
		}
	}

	// 获取文件完整路径
	file = util.parsePath(docRoot + uri.pathname);

	// 获取项目配置文件
	util.eachObject(_apps, function(i){
		if (!file.indexOf(i)) {
			appConf = _apps[i];
			return false;
		}
	});

	if (appConf) {
		// 判断是否为数据文件
		var isDataFile = false,
			dataFile;
		util.forEach(appConf.dataFiles, function(){
			if (!file.indexOf(this)) {
				isDataFile = true;
				return false;
			}
		});

		if (isDataFile) {
			dataFile = appConf.docRoot + _DynamicDataPath + uri.pathname.replace(/[\/\\]/g, '_') + '/' + sortAndStringifyJSON(url.query);
			
			// 是否是post提交
			if (false) {
				dataFile += '&&_post';
			}

			fs.readFile(dataFile, function(err, buf){
				if (err) {
					fs.write(dataFile, '', function(err){
						if (err) notice.warn('FS', 'Create DataFile error');
					});
					res.statusCode = 404;
					res.end();
				} else if (buf.length) {
					res.end(buf);
				} else {
					res.statusCode = 404;
					res.end();
				}
			});

			return;
		} else if (appConf.sourceMap[file]){			// 是否在映射列表中
			file = appConf.sourceMap[file];
		}
	} else {
		appConf = _apps['widthoutApp'];
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
			cache = new Cache(file, extname, useGzip, appConf);
		}
	}

	cache.getLastModified(function(err, lastModified){		// err 永远都是false 所以不用判断
		if (lastModified == req.headers['if-modified-since']) {
			res.statusCode = 304;
			res.end();
			return;
		} else {
			// 注意 由于sendCont和sendZipCont方法在fileServer函数中，是在getLastModified执行之后再执行的，所以lastModified值已经获取成功
			cache.sendCont(res);
		}

		if (!appConf.fileWatch[file]) {
			if (extname == 'css' || extname == 'less') {
				appConf.fileWatch[file] = watchFileCh(file, function(){
					// 动态刷新
					cache.refresh();
				});
			} else if (extname == 'html') {
				appConf.fileWatch[file] = watchFileCh(file, function(){
					// 刷新页面
					delete appConf.cacheTpl[file];
					cache.refresh();
				});
			} else {
				appConf.fileWatch[file] = watchFileCh(file, function(){
					// 刷新页面
					cache.refresh();
				});
			}
		}
	});
}



module.exports = _fileServer;