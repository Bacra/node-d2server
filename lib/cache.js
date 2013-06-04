var fs = require('fs'),
	notice = require('./notice.js'),
	util = require('./util.js'),
	getHead = require('./servutil.js').getHead,
	parseHTML = require('./parser/parseHTML.js').parse4cache,
	parseLess = require('./parser/parseLess.js');




// drGetCont参数：直接获取内容，用于拼接内容的时候，不执行res的send方法
// 注意：由于less和html本身就必须直接获取内容，所以该参数是否设置，对这两种类型的文件无影响
function Cache(file, extname, appConf, drGetCont){
	var getContData, sendCont,
		head = getHead(extname),
		updateHead = function(){
			head['Last-Modified'] = util.getUTCtime();
			return head;
		};

	if (extname == 'html' || extname == 'less') {			// 需要解析的内容
		var buildGetContDate = function(parseFunc, options){
				return util.createCacheQuery(function(callback){
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
			getContData = buildGetContDate(parseLess, appConf);
		} else if (extname == 'html') {
			var createGetContData = function(parseFunc, getOptionsFunc){
				var getContDataFuncs = {},
					defaultGetContDataFunc = buildGetContDate(parseFunc, getOptionsFunc());
				
				return function(callback, mark){
					if (mark) {
						var func = getContDataFuncs[mark];
						if (!func) {
							func = buildGetContDate(parseFunc, getOptionsFunc(mark));
							getContDataFuncs[mark] = func;
						}
						func(callback);
					} else {
						defaultGetContDataFunc(callback);
					}
				};
			};


			getContData = createGetContData(parseHTML, function(mark){
				return appConf.getHTMLConfig(file, mark);
			});
		}

		sendCont = function(res, mark){
			getContData(function(err, buf){
				directSendData(res, extname.toUpperCase(), err, buf, updateHead);
			}, mark);
		};
	} else if (drGetCont) {
		getContData = util.createCacheQuery(function(callback){
			fs.readFile(file, callback);
		});

		sendCont = function(res){
			getContData(function(err, buf){
				directSendData(res, extname.toUpperCase(), err, buf, updateHead);
			});
		};
	} else {
		getContData = util.createCacheQuery(function(callback, res){
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
				directSendData(res, extname.toUpperCase(), err, buf, updateHead);
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



module.exports = Cache;