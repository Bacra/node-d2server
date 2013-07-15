var fs = require('fs'),

	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
	DRS = mod.load('DRS'),
	Cache = mod.load('Cache'),
	resHead = mod.load('resHead'),
	proj404 = mod.load('proj404'),
	favicon = mod.load('favicon'),
	ProjConfig = mod.load('ProjConfig'),

	parseHTML4splice = mod.load('parseHTML').parse4splice,
	SourcePath = util.parsePath(_conf.SourcePath);



function cacheServer(res, file, outFile, uri, projConf){
	var extname = util.getExtname(file),
		cache = projConf.cache[file];

	if (!cache) {
		if (!util.fileExists(file)) {
			notice.log('404', file);
			res.writeHead(404, {
				'Content-Type':  'text/html'
			});
			res.end(proj404(projConf, _conf.DevServPort));
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


function cacheServer4splice(res, file, outFile, uri, projConf) {
	if (util.getExtname(file) == 'html') {
		fs.readFile(file, function(err, buf){
			if (err) {
				res.writeHead(404, {
					'Content-Type':  'text/html'
				});
				res.end(proj404(projConf, _conf.DevServPort));
				notice.warn('splice', err, file);
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

// spliceServer的file必然也是outfile
function spliceServer(res, file, uri, projConf, sendFile){
	var files = projConf.sourceLink[file],
		wait = files.length;

	if (!wait) {
		res.writeHead(404, {
			'Content-Type':  'text/html'
		});
		res.end(proj404(projConf, _conf.DevServPort));
		notice.warn('link source', 'no file in query', file);
		return;
	}

	var extname = util.getExtname(file),
		errorNum = 0,
		hasDone = false,
		cont = [],
		endFunc = function(){
			if (!wait) {
				hasDone = true;
				if (errorNum == files.length) {
					res.statusCode = 500;
					res.end();
				} else {
					res.writeHead(200, resHead(extname));
					res.end(cont.join('\n\n\n'));
				}
			}
		};

	// 可以拼接的资源有 js css less
	// html是不能直接拼接的
	if (extname == 'less' || extname == 'css' || extname == 'js') {
		files.forEach(function(srcFile, index){
			var cache = projConf.cache[srcFile];
			if (!cache) {
				if (!fs.existsSync(srcFile)){
					wait--;
					errorNum++;
					notice.warn('link source', 'file not exists', srcFile);
					endFunc();
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
				endFunc();
			});
		});

		if (!hasDone && !wait) {
			if (errorNum == files.length) res.statusCode = 500;
			res.end();
		}
	} else {
		// 不能拼接的资源 直接调用第一个文件输出（拼接相当于转发）
		sendFile(res, files[0], files[0], uri, projConf);
	}
}


function getListenFunc(sendFile){
	return function(req, res){
		if (favicon(req, res) === false) return;

		var uri = util.getURI(req),
			outFile = util.parsePath(DRS.map(uri.hostname) + uri.pathname),			// 获取文件完整路径
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
	'getListenFunc': getListenFunc
};