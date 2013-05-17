var fs = require('fs'),
	zlib = require("zlib"),
	stream = require('stream'),
	util = require('../../util.js'),
	mime = require('../../mime.js'),
	parseHtml = require('../parser/parseHtml.js'),
	parseLess = require('../parser/parseLess.js'),
	defaultLastModified = util.getUTCtime();



function Cache(file, extname, useGzip, appConf, lastModified){
	// 赶紧注册全局变量
	if (useGzip) {
		appConf.cacheCont[file] = this;
	} else {
		appConf.cacheTemp[file] = this;
	}


	this.extname = extname;			// baseLess刷新时需要

	var self = this,
		contentType = mime(extname),
		needParseCont = extname == 'html' || extname == 'less',
		getLastModified, getContData, getHead, destory;

	if (lastModified) {
		getLastModified = function(callback){
			callback(false, lastModified);
		};
	} else {
		getLastModified = util.createCacheQuery(function(callback){
			try {
				lastModified = fs.statSync(file).mtime.toUTCString();
			} catch (err) {
				lastModified = defaultLastModified;
				notice.error('FS', err);
			}

			callback(false, lastModified);
		});
	}


	if (useGzip) {
		// 注意 由于sendCont和sendZipCont方法在fileServer函数中，是在getLastModified执行之后再执行的，所以lastModified值已经获取成功
		getHead = function(){
			return {
				'Content-Encoding': 'gzip',
				'Content-Type': contentType,
				'Last-Modified': lastModified
			};
		};

		destory = function(){
			delete appConf.cacheCont[file];
			if (appConf.cacheTemp[file]) delete appConf.cacheTemp[file];
		};


		if (needParseCont) { 
			getContData = util.createCacheQuery(function(callback, res){

				// 先生成没有压缩的缓存，然后再对cont进行压缩
				// 注意：由于query本身就是带有缓存的，所以在处理useGzip的时候，必须使用isFirstSync参数
				var cache = appConf.cacheTemp[file];
				if (!cache) cache = new Cache(file, extname, false, appConf);

				cache.getContData(function(err, data){
					directSendData(res, extname.toUpperCase(), err, data);
					if (err) {
						callback(err);
						return;
					} else {
						zlib.gzip(data.buf, function(err, buf){
							if (err) {
								callback(err);
							} else {
								callback(false, {
									'head': getHead(),
									'buf': buf
								});
							}
						});
					}
				});
			}, true);
		}
	} else {
		getHead = function(){
			return {
				'Content-Type': contentType,
				'Last-Modified': lastModified
			};
		};

		destory = function(){
			delete appConf.cacheTemp[file];
		};

		if (needParseCont) {
			var createGetContData = function(parseFunc, options){
				return util.createCacheQuery(function(callback){
					fs.readFile(file, function(err, cont){
						if (err) {
							callback(err);
							return;
						}
						cont = cont.toString();
						parseFunc(cont, file, function(cont){
							callback(false, {
								'head': getHead(),
								'buf': cont
							});
						}, function(err){
							callback(err);
						}, options);
					});
				});
			};

			if (extname == 'html') {
				getContData = createGetContData(parseHtml, appConf);
			} else if (extname == 'less'){
				getContData = createGetContData(parseLess, appConf);
			}
		}
	}

	if (!needParseCont) {
		getContData = util.createCacheQuery(function(callback, res){
			var head = getHead();
			res.writeHead(200, head);

			var st = fs.createReadStream(file),
				cachePipe = stream.PassThrough(),
				bufs = [];
			cachePipe.on('data', function(buf){
				bufs.push(buf);
			});
			cachePipe.on('end', function(){
				callback(false, {
					'head': head,
					'buf': Buffer.concat(bufs)
				});
			});
			st.on('error', function(err){
				callback(err);

				notice.error('Stream', err);
				res.writeHead(500, 'Stream Error');
				res.end();
			});

			if (useGzip) {
				st.pipe(zlib.createGzip()).pipe(cachePipe).pipe(res);
			} else {
				st.pipe(cachePipe).pipe(res);
			}
		}, true);
	}


	this.getContData = getContData;
	this.destory = destory;
	this.getLastModified = getLastModified;
	this.sendCont = function(res){
		getContData(function(err, data){
			directSendData(res, extname.toUpperCase(), err, data);
		}, res);
	};
	this.refresh = function(){
		destory();
		new Cache(file, extname, useGzip, appConf, util.getUTCtime());
	};
}


// 直接发送数据
function directSendData(res, errorName, err, data){
	if (err) {
		res.writeHead(500, err);
		res.end();
		notice.error(errorName, err);
	} else {
		res.writeHead(200, data.head);
		res.end(data.buf);
	}
}



module.exports = Cache;