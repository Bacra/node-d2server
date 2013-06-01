var util = require('./util.js'),
	mime = require('../mime.js'),
	notice = require('./notice.js'),
	existsSync = require('fs').existsSync;



function fileServer(res, file, uri, appConf){
	var extname = util.getExtname(file),
		cache = appConf.cache[file];

	if (!cache) {
		if (!existsSync(file)) {
			notice.log(404, file);
			res.statusCode = 404;
			res.end();
			return;
		} else if (!appConf.watchFiles[file]) {
			if (extname == 'html') {
				appConf.addPageReloadWatch(file, function(){
					delete appConf.cacheTpl[file];
					delete appConf.cache[file];
				});
			} else if (extname == 'less' || extname == 'css') {
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
		appConf.dataAPIStep = {};						// 重置步骤数据
		cache.sendCont(res, uri.query.block);			// 传入参数
	} else {
		cache.sendCont(res);
	}
}




function spliceServer(res, file, uri, appConf){
	var extname = util.getExtname(file),
		files = appConf.sourceLink[file],
		wait = files.length,
		errorNum = 0,
		hasDone = false,
		cont = [];

	// 可以拼接的资源有 js css less
	// html是不能直接拼接的
	if (extname == 'less' || extname == 'css' || extname == 'js') {
		files.forEach(function(srcFile, index){
			var cache = appConf.cache[srcFile];
			if (!cache) {
				if (!existsSync(srcFile)){
					errorNum++;
					wait--;
					notice.warn('link source', 'file not exists', srcFile);

					if (!wait) {
						hasDone = true;
						if (errorNum == files.length) {
							res.statusCode = 404;
							res.end();
						} else {
							res.writeHead(200, getHead());
							res.end(cont.join('\n\n\n'));
						}
					}
					return;
				}
				cache = appConf.addCache(srcFile, util.getExtname(srcFile), true);
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
						res.writeHead(200, getHead());
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
		fileServer(res, files[0], uri, appConf);
	}
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
	'fileServer': fileServer,
	'spliceServer': spliceServer,
	'getHead': getHead
};