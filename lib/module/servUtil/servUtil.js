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
	combo = mod.load('combo'),

	parseHTML4splice = mod.load('parseHTML').parse4splice,
	SourcePath = util.parsePath(_conf.SourcePath);



function cacheServer(res, req, file, outFile, uri, projConf){
	var extname = util.getExtname(file),
		cache = projConf.cache[file];

	if (!cache) {
		if (!util.fileExists(file)) {
			projConf.dataAPI(uri, res, req, function(statusCode){
				proj404.send(res, projConf, uri.port);
			});
			return;
		}
		cache = projConf.initCacheAndWatch(file, extname, uri);
	}


	if (extname == 'html') {
		cache.sendCont(res, outFile);
	} else {
		cache.sendCont(res);
	}
}


function cacheServer4splice(res, req, file, outFile, uri, projConf) {
	if (util.getExtname(file) == 'html') {
		fs.readFile(file, function(err, buf){
			if (err) {
				projConf.dataAPI(uri, res, req, function(statusCode){
					proj404.send(res, projConf, uri.port);
				});
				notice.warn('splice', err, file);
			} else {
				res.writeHead(200, resHead('html'));
				res.end(parseHTML4splice(buf.toString(), file, projConf.getHTMLConfig(outFile)));
				
				if (!projConf.watchFiles[file]) {
					projConf.addPageReloadWatch(file, function(){
						delete projConf.cacheTpl[file];
						delete projConf.cache[file];
					});
				}
			}
		});
	} else {
		cacheServer(res, req, file, outFile, uri, projConf);
	}
}

// spliceServer的file必然也是outfile
function spliceServer(res, file, uri, projConf){
	var files = projConf.sourceLink[file];

	if (!files.length) {
		proj404.send(res, projConf, uri.port);
		notice.warn('link source', 'no file in query', file);
		return;
	}

	var extname = util.getExtname(file);

	// 可以拼接的资源有 js css less
	// html是不能直接拼接的
	if (extname == 'less' || extname == 'css' || extname == 'js') {
		var task = util.task(function(){
				if (errorNum == files.length) {
					res.statusCode = 500;
					res.end();
				} else {
					res.writeHead(200, resHead(extname));
					res.end(cont.join('\n\n\n'));
				}
			}),
			errorNum = 0,
			cont = [];

		files.forEach(function(srcFile, index){
			task.add(function(complete){
				var cache = projConf.cache[srcFile];
				if (!cache) {
					if (!fs.existsSync(srcFile)){
						errorNum++;
						notice.warn('link source', 'file not exists', srcFile);
						complete();
						return;
					}

					cache = projConf.initCacheAndWatch(srcFile, util.getExtname(srcFile), uri, true);
				}

				// 由于放在link里面的资源，都是可以拼接的，所以可以直接使用+
				cache.getContData(function(err, str){
					if (err) {
						errorNum++;
						notice.warn('link source', err, srcFile);
					} else {
						cont[index] = str.toString();
					}
					complete();
				});
			});
		});

		task.start();
	} else {
		combo(files, null, function(buf){
			if (buf.length) {
				res.writeHead(200, resHead(extname));
				res.end(buf);
			} else {
				res.statusCode = 404;
				res.end();
			}
		});
	}
}


function getListenFunc(sendFile){
	return function(req, res){
		if (favicon(req, res) === false) return;

		var uri = util.getURI(req),
			root = DRS.map(uri.hostname),
			outFile = util.parsePath(root + uri.pathname),			// 获取文件完整路径
			srcFile = outFile,
			projConf = ProjConfig.find(srcFile);							// 获取项目配置文件

		if (projConf) {
			if (projConf.sourceMap[srcFile]) {
				srcFile = projConf.sourceMap[srcFile];					// 是否在映射列表中
			} else if (projConf.sourceLink[srcFile]) {
				// 拼接资源
				spliceServer(res, srcFile, uri, projConf);
				return;
			} else if (projConf.inSourcePath(srcFile)) {
				res.writeHead(403, {
					'Content-Type': 'text/html'
				});
				res.end('Can not visit File in source path');
				return;
			} else if (projConf.catalog) {
				srcFile = projConf.removeCatalog(srcFile);			// 粗暴地拿到新地址，即使地址有问题，也没关系，无法找到相应的文件就会转到dataAPI下
			}
		} else {
			projConf = ProjConfig.defaultProj;							// 空白项目
		}

		sendFile(res, req, srcFile, outFile, uri, projConf);
	};
}






module.exports = {
	'cacheServer': cacheServer,
	'cacheServer4splice': cacheServer4splice,
	'getListenFunc': getListenFunc
};