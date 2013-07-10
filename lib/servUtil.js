var fs = require('fs'),
	parseUrl = require('url').parse,

	util = require('./util.js'),
	mime = require('../mime.js'),
	notice = require('./notice.js'),
	_conf = require('../conf.js'),
	get404page = require('./get404page.js'),

	parseHTML4splice = require('./parser/parseHTML.js').parse4splice,
	SourcePath = util.parsePath(require('../conf.js').SourcePath),
	
	_faviconIcoBuf;


fs.readFile(__dirname+'/src/favicon.ico', function(err, buf){
	if (err) {
		notice.warn('SYS', 'favicon not exists');
	} else {
		_faviconIcoBuf = buf;
	}
});


function cacheServer(res, file, outFile, uri, appConf){
	var extname = util.getExtname(file),
		cache = appConf.cache[file];

	if (!cache) {
		if (!util.fileExists(file)) {
			notice.log('404', file);
			res.writeHead(404, {
				'Content-Type':  'text/html'
			});
			res.end(get404page(appConf, _conf.DevServPort));
			return;
		}
		cache = appConf.initCacheAndWatch(file, extname, uri);
	}


	if (extname == 'html') {
		appConf.dataAPIStep = {};						// 重置步骤数据
		cache.sendCont(res, outFile);
	} else {
		cache.sendCont(res);
	}
}








// spliceServer的file必然也是outfile
function spliceServer(res, file, uri, appConf, sendFile){
	var extname = util.getExtname(file),
		files = appConf.sourceLink[file],
		wait = files.length,
		errorNum = 0,
		hasDone = false,
		cont = [];

	if (!wait) {
		res.statusCode = 404;
		res.end();
		return;
	}

	// 可以拼接的资源有 js css less
	// html是不能直接拼接的
	if (extname == 'less' || extname == 'css' || extname == 'js') {
		files.forEach(function(srcFile, index){
			var cache = appConf.cache[srcFile];
			if (!cache) {
				if (!fs.existsSync(srcFile)){
					errorNum++;
					wait--;
					notice.warn('link source', 'file not exists', srcFile);

					if (!wait) {
						hasDone = true;
						if (errorNum == files.length) {
							res.statusCode = 404;
							res.end();
						} else {
							res.writeHead(200, getHead(extname));
							res.end(cont.join('\n\n\n'));
						}
					}
					return;
				}

				cache = appConf.initCacheAndWatch(srcFile, util.getExtname(srcFile), uri, true);
			}

			// 由于放在link里面的资源，都是可以拼接的，所以可以直接使用+
			cache.getContData(function(err, str){
				wait--;
				if (err) {
					errorNum++;
					notice.warn('link source', err, srcFile);
				} else {
					cont[index] = str.toString();
				}

				if (!wait) {
					hasDone = true;
					if (errorNum == files.length) {
						res.statusCode = 404;
						res.end();
					} else {
						res.writeHead(200, getHead(extname));
						res.end(cont.join('\n\n\n'));
					}
				}
			});
		});

		if (!hasDone && !wait) {
			if (errorNum == files.length) res.statusCode = 404;
			res.end();
		}
	} else {
		// 不能拼接的资源 直接调用第一个文件输出（拼接相当于转发）
		sendFile(res, files[0], files[0], uri, appConf);
	}
}



function cacheServer4splice(res, file, outFile, uri, appConf) {
	if (util.getExtname(file) == 'html') {
		fs.readFile(file, function(err, buf){
			if (err) {
				notice.warn('splice', err, file);
				res.statusCode = 404;
				res.end();
			} else {
				res.writeHead(200, getHead('html'));
				res.end(parseHTML4splice(buf.toString(), file, appConf.getHTMLConfig(file, outFile)));
				
				if (!appConf.watchFiles[file]) {
					appConf.addPageReloadWatch(file, function(){
						delete appConf.cacheTpl[file];
						delete appConf.cache[file];
					});
				}
			}
		});
	} else {
		cacheServer(res, file, outFile, uri, appConf);
	}
}



function getListenFunc(sendFile){
	var AppConfig = require('./AppConfig.js');

	return function(req, res){
		if (req.url == '/favicon.ico') {
			res.statusCode = 200;
			res.end(_faviconIcoBuf);
			return;
		}
		
		var uri = parseUrl(req.url, true),
			outFile = util.parsePath(AppConfig.DRS(req.headers.host || '') + uri.pathname),			// 获取文件完整路径
			srcFile = outFile,
			appConf = AppConfig.find(outFile);							// 获取项目配置文件



		if (appConf) {
			if (appConf.dataAPI(uri, res, req)) return;					// 判断是否为数据文件
			
			if (appConf.sourceMap[outFile]) {
				srcFile = appConf.sourceMap[outFile];					// 是否在映射列表中
			
			} else if (appConf.sourceLink[outFile]) {
				// 拼接资源
				spliceServer(res, srcFile, uri, appConf, sendFile);
				return;
			} else if (outFile.indexOf(SourcePath) != -1) {
				res.writeHead(200, {
					'Content-Type': 'text/html'
				});
				res.end('Can not visit File in source path');
				return;
			}

		} else {
			appConf = AppConfig.defaultApp;							// 空白项目
		}

		sendFile(res, srcFile, outFile, uri, appConf);
	};
}


function getHead(extname){
	return {
		'Content-Type': mime(extname),
		'Expires': '-1',
		'Cache-Control': 'no-store, no-cache, must-revalidate',
		'Pragma': 'no-cache',						//兼容http1.0和https
		'Last-Modified': util.getUTCtime()
	};
}



module.exports = {
	'cacheServer': cacheServer,
	'cacheServer4splice': cacheServer4splice,
	'spliceServer': spliceServer,
	'getListenFunc': getListenFunc,
	'getHead': getHead
	/*'faviconIcoBuf': _faviconIcoBuf*/
};