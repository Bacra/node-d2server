var fs = require('fs'),
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





function initCache(file, extname, appConf){
	var getContData, sendCont,
		head = {
			'Content-Type': mime(extname),
			'Expires': '-1',
			'Last-Modified': util.getUTCtime(),
			'Cache-Control': 'no-store, no-cache, must-revalidate',
			'Pragma': 'no-cache'		//兼容http1.0和https
		},
		destory = function(){
			delete appConf.cache[file];
		};

	if (extname == 'html' || extname == 'less') {			// 需要解析的内容
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
	} else{
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

			st.pipe(cachePipe).pipe(res);
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
			initCache(file, extname, appConf);
		}
	};
	



	// 注册全局变量
	appConf.cache[file] = ob;

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