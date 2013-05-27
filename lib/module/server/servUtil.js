var notice = require('../../notice.js'),
	pathExtname = require('path').extname,
	existsSync = require('fs').existsSync;


function fileServer(res, file, uri, appConf){
	var extname = pathExtname(file).substring(1),
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
		cache.sendCont(res, uri.query.block);			// 传入参数
	} else {
		cache.sendCont(res);
	}
}




function spliceServer(res, file, uri, appConf){
	var extname = pathExtname(file).substring(1),
		wait = 0,
		errorNum = 0,
		files = appConf.sourceLink[file],
		cont;

	// 可以拼接的资源有 js css less
	if (extname == 'less' || extname == 'css' || extname == 'js') {
		files.forEach(function(srcFile){
			var cache = appConf.cache[srcFile];
			if (!cache) {
				if (!existsSync(srcFile)){
					errorNum++;
					notice.warn('link source', 'file not exists', srcFile);
					return;
				}
				cache = appConf.addCache(srcFile, extname, true);
			}

			wait++;
			// 由于放在link里面的资源，都是可以拼接的，所以可以直接使用+
			cache.getContData(function(err, str){
				wait--;
				if (err) {
					errorNum++;
					notice.warn('link source', err, srcFile);
				} else {
					cont += '\n\n'+str;
				}

				if (!wait) {
					if (errorNum == files.length) {
						res.statusCode = 404;
						res.end();
					} else {
						res.writeHead(200, {
							'Content-Type': mime(extname),
							'Expires': '-1',
							'Cache-Control': 'no-store, no-cache, must-revalidate',
							'Pragma': 'no-cache',
							'Last-Modified': util.getUTCtime()
						});
						res.end(cont);
					}
				}
			});
		});


		if (!wait) {
			if (errorNum) res.statusCode = 404;
			res.end();
		}
	} else {
		// 不能拼接的资源 直接调用第一个文件输出（拼接相当于转发）
		fileServer(res, files[0], uri, appConf);
	}
}



module.exports = {
	'fileServer': fileServer,
	'spliceServer': spliceServer
};