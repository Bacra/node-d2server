var fs = require('fs'),
	mod = require('../../mod.js'),
	notice = mod.notice,
	util = mod.util,
	MaxCacheFileSize = mod.conf.MaxCacheFileSize,
	resHead = mod.load('resHead'),
	parseHTML = mod.load('parseHTML').parse4cache,
	parseLess = mod.load('parseLess');




// drGetCont参数：直接获取内容，用于拼接内容的时候，不执行res的send方法
// 注意：由于less和html本身就必须直接获取内容，所以该参数是否设置，对这两种类型的文件无影响
function Cache(file, extname, projConf, drGetCont){
	var getContData, sendCont,
		head = resHead(extname),
		updateHead = function(){
			head['Last-Modified'] = util.getUTCtime();
			return head;
		};

	if (extname == 'html' || extname == 'less') {			// 需要解析的内容
		var buildGetContDate = function(parseFunc, options){
				return createCacheQuery(function(callback){
					fs.readFile(file, function(err, cont){
						if (err) {
							callback(err);
							return;
						}
						cont = cont.toString();
						parseFunc(cont, file, function(cont){
							callback(false, cont);
						}, function(err){
							callback(err);
						}, options);
					});
				});
			};

		if (extname == 'less'){
			getContData = buildGetContDate(parseLess, projConf);
		} else if (extname == 'html') {
			var getContDataFuncs = {};
			getContData = function(finalOutCallback, outFile){
				var func = getContDataFuncs[outFile];
				if (!func) {
					var opts = projConf.getHTMLConfig(outFile);
					if (!opts) {
						notice.log('Cache', 'HTML is not in Config File', file);
						opts = projConf.initHTMLConfig({});
					}
					func = buildGetContDate(parseHTML, opts);
					getContDataFuncs[outFile] = func;
				}
				func(finalOutCallback);
			};
		}

		sendCont = function(res, outFile){
			getContData(function(err, buf){
				directSendData(res, extname, err, buf, updateHead);
			}, outFile);
		};
	} else if (drGetCont) {
		getContData = createCacheQuery(function(callback){
			fs.readFile(file, callback);
		});

		sendCont = function(res){
			getContData(function(err, buf){
				directSendData(res, extname, err, buf, updateHead);
			});
		};
	} else {
		getContData = createCacheQuery(function(callback, res){
			res.writeHead(200, head);

			var bufs = [];
			fs.createReadStream(file)
				.on('data', function(buf){
					bufs.push(buf);
				})
				.on('end', function(){
					callback(false, Buffer.concat(bufs));
					// console.log(file, fs.readFileSync(file).toString());
				})
				.on('error', function(err){
					callback(err);

					notice.error('Stream', err);
					res.writeHead(500, 'Stream Error');
					res.end();
				})
				.pipe(res);
		}, true);


		sendCont = function(res){
			getContData(function(err, buf){
				directSendData(res, extname, err, buf, updateHead);
			}, res);
		};
	}


	var ob = {
		'extname': extname,							// baseLess刷新时需要
		'getContData': getContData,					// gzip需要调用非gzip的这个方法
		'sendCont': sendCont
	};

	return ob;
}



// 直接发送数据
function directSendData(res, errorName, err, buf, updateHead){
	if (err) {
		res.statusCode = 500;
		res.end();
		notice.error(errorName, err);
	} else {
		res.writeHead(200, updateHead());
		res.end(buf);
	}
}



// 创建带有等待队列的生成函数（附加带有数据缓存）
// isFirstSync：第一次创建数据的时候，是否要执行添加的回调
// 由于函数会缓存一个文件内容，需要一个watchFileCh函数配合才好使用（系统级的文件读取缓存，用这个函数反而显得复杂）
// 注意：不要放入util，Cache独有
function createCacheQuery(createDateFunc, isFirstSync){
	var data, query;

	return function(callback, createDataFuncParams){	// createDataFuncParams 一般是不需要的，但考虑到 isFirstSync就有可能传入动态的数据
		if (data !== undefined) {
			callback(false, data);
		} else if (query){
			query.push(callback);
		} else {
			query = [];
			createDateFunc(function(err, rs){
				if (!err) {
					if (MaxCacheFileSize < (Buffer.isBuffer(rs) ? rs.length : Buffer.byteLength(rs))) {
						notice.log('Cache', 'The Data is to large');
					} else {
						data = rs;
					}
				}

				if (!isFirstSync) callback(err, rs);

				var len = query.length;
				
				if (len) {
					notice.log('Query', len +' has waited');
					var cb;
					while((cb = query.pop())) cb(err, rs);
				}
				query = null;
			}, createDataFuncParams);
		}
	};
}



module.exports = Cache;