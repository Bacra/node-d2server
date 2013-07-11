var fs = require('fs'),
	parseUrl = require('url').parse,

	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
	Cache = mod.load('Cache'),
	resHead = mod.load('resHead'),
	p404 = mod.load('p404'),

	parseHTML4splice = mod.load('parseHTML').parse4splice,
	SourcePath = util.parsePath(_conf.SourcePath),
	
	_faviconIcoBuf;


fs.readFile(__dirname+'/favicon.ico', function(err, buf){
	if (err) {
		notice.warn('SYS', 'favicon not exists');
	} else {
		_faviconIcoBuf = buf;
	}
});


function cacheServer(res, file, outFile, uri, projConf){
	var extname = util.getExtname(file),
		cache = projConf.cache[file];

	if (!cache) {
		if (!util.fileExists(file)) {
			notice.log('404', file);
			res.writeHead(404, {
				'Content-Type':  'text/html'
			});
			res.end(p404(projConf, _conf.DevServPort));
			return;
		}
		cache = projConf.initCacheAndWatch(file, extname, uri);
	}


	if (extname == 'html') {
		projConf.dataAPIStep = {};						// 重置步骤数据
		cache.sendCont(res, outFile);
	} else {
		cache.sendCont(res);
	}
}








// spliceServer的file必然也是outfile
function spliceServer(res, file, uri, projConf, sendFile){
	var extname = util.getExtname(file),
		files = projConf.sourceLink[file],
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
			var cache = projConf.cache[srcFile];
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
							res.writeHead(200, resHead(extname));
							res.end(cont.join('\n\n\n'));
						}
					}
					return;
				}

				cache = projConf.initCacheAndWatch(srcFile, util.getExtname(srcFile), uri, true);
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
						res.writeHead(200, resHead(extname));
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
		sendFile(res, files[0], files[0], uri, projConf);
	}
}



function cacheServer4splice(res, file, outFile, uri, projConf) {
	if (util.getExtname(file) == 'html') {
		fs.readFile(file, function(err, buf){
			if (err) {
				notice.warn('splice', err, file);
				res.statusCode = 404;
				res.end();
			} else {
				res.writeHead(200, resHead('html'));
				res.end(parseHTML4splice(buf.toString(), file, projConf.getHTMLConfig(file, outFile)));
				
				if (!projConf.watchFiles[file]) {
					projConf.addPageReloadWatch(file, function(){
						delete projConf.cacheTpl[file];
						delete projConf.cache[file];
					});
				}
			}
		});
	} else {
		cacheServer(res, file, outFile, uri, projConf);
	}
}



function getListenFunc(sendFile){
	var ProjConfig = mod.load('ProjConfig');

	return function(req, res){
		if (req.url == '/favicon.ico') {
			res.statusCode = 200;
			res.end(_faviconIcoBuf);
			return;
		}
		
		var uri = parseUrl(req.url, true),
			outFile = util.parsePath(ProjConfig.DRS(req.headers.host || '') + uri.pathname),			// 获取文件完整路径
			srcFile = outFile,
			projConf = ProjConfig.find(outFile);							// 获取项目配置文件



		if (projConf) {
			if (projConf.dataAPI(uri, res, req)) return;					// 判断是否为数据文件
			
			if (projConf.sourceMap[outFile]) {
				srcFile = projConf.sourceMap[outFile];					// 是否在映射列表中
			
			} else if (projConf.sourceLink[outFile]) {
				// 拼接资源
				spliceServer(res, srcFile, uri, projConf, sendFile);
				return;
			} else if (outFile.indexOf(SourcePath) != -1) {
				res.writeHead(200, {
					'Content-Type': 'text/html'
				});
				res.end('Can not visit File in source path');
				return;
			}

		} else {
			projConf = ProjConfig.defaultProj;							// 空白项目
		}

		sendFile(res, srcFile, outFile, uri, projConf);
	};
}






module.exports = {
	'cacheServer': cacheServer,
	'cacheServer4splice': cacheServer4splice,
	'spliceServer': spliceServer,
	'getListenFunc': getListenFunc,
	'faviconIcoBuf': _faviconIcoBuf
};