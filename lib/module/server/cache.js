var fs = require('fs'),
	zlib = require("zlib"),
	stream = require('stream'),
	notice = require('../../notice.js'),
	util = require('../../util.js'),
	mime = require('../../mime.js'),
	parseHTML = require('../parser/parseHtml.js').parseCall,
	parseLess = require('../parser/parseLess.js'),
	defaultLastModified = util.getUTCtime();



function htmlOptions(appConf, mark) {
	return {
		'data': appConf,
		'appConf': appConf
	};
}





function initCache(file, extname, useGzip, appConf){
	var needParseCont = extname == 'html' || extname == 'less',
		getContData, sendCont, destory,
		head = {
			'Content-Type': mime(extname),
			'Expires': '-1',
			'Last-Modified': util.getUTCtime(),
			'Cache-Control': 'no-store, no-cache, must-revalidate',
			'Pragma': 'no-cache'		//兼容http1.0和https
		};


	if (useGzip) {
		head['Content-Encoding'] = 'gzip';

		destory = function(){
			delete appConf.cacheTemp[file];
			delete appConf.cacheCont[file];
		};


		if (needParseCont) {
			var buildGetContDate = function(mark){
					return util.createCacheQuery(function(callback, res){
						// 先生成没有压缩的缓存，然后再对cont进行压缩
						// 注意：由于query本身就是带有缓存的，所以在处理useGzip的时候，必须使用isFirstSync参数
						var cache = appConf.cacheTemp[file];
						if (!cache) cache = initCache(file, extname, false, appConf);

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
											'head': head,
											'buf': buf
										});
									}
								});
							}
						}, mark);
					}, true);
				},
				getContDataFuncs = {},
				defaultGetContDataFunc = buildGetContDate();

			getContData = function(callback, res, mark){
				if (mark) {
					var func = getContDataFuncs[mark];
					if (!func) {
						func = buildGetContDate(mark);
						getContDataFuncs[mark] = func;
					}
					func(callback, res);
				} else {
					defaultGetContDataFunc(callback, res);
				}
			};


			sendCont = function(res, mark){
				getContData(function(err, data){
					directSendData(res, extname.toUpperCase(), err, data);
				}, res, mark);
			};
		}
	} else {

		destory = function(){
			delete appConf.cacheTemp[file];
		};

		if (needParseCont) {
			var createGetContData = function(parseFunc, getOptionsFunc){
					var getContDataFuncs = {},
						defaultGetContDataFunc = buildGetContDate2(parseFunc, getOptionsFunc());
					
					return function(callback, mark){
						if (mark) {
							var func = getContDataFuncs[mark];
							if (!func) {
								func = buildGetContDate2(parseFunc, getOptionsFunc(mark));
								getContDataFuncs[mark] = func;
							}
							func(callback);
						} else {
							defaultGetContDataFunc(callback);
						}
					};
				},
				buildGetContDate2 = function(parseFunc, options){
					return util.createCacheQuery(function(callback){
						fs.readFile(file, function(err, cont){
							if (err) {
								callback(err);
								return;
							}
							cont = cont.toString();
							parseFunc(cont, file, function(cont){
								callback(false, {
									'head': head,
									'buf': cont
								});
							}, function(err){
								callback(err);
							}, options);
						});
					});
				};

			if (extname == 'html') {
				getContData = createGetContData(parseHTML, function(mark){
					return htmlOptions(appConf, mark);
				});
			} else if (extname == 'less'){
				getContData = createGetContData(parseLess, function(){
					return appConf;
				});
			}

			sendCont = function(res, mark){
				getContData(function(err, data){
					directSendData(res, extname.toUpperCase(), err, data);
				}, mark);
			};
		}
	}

	if (!needParseCont) {
		getContData = util.createCacheQuery(function(callback, res){
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


		sendCont = function(res){
			getContData(function(err, data){
				directSendData(res, extname.toUpperCase(), err, data);
			}, res);
		};
	}


	var ob = {
		'extname': extname,							// baseLess刷新时需要
		'getContData': getContData,					// gzip需要调用非gzip的这个方法
		'destory': destory,
		'sendCont': sendCont,
		'refresh': function(){
			destory();
			initCache(file, extname, useGzip, appConf);
		}
	};
	



	// 注册全局变量
	if (useGzip) {
		appConf.cacheCont[file] = ob;
	} else {
		appConf.cacheTemp[file] = ob;
	}

	return ob;
}



// 直接发送数据
function directSendData(res, errorName, err, data){
	if (err) {
		res.statusCode = 500;
		res.end();
		notice.error(errorName, err);
	} else {
		res.writeHead(200, data.head);
		res.end(data.buf);
	}
}



module.exports = initCache;