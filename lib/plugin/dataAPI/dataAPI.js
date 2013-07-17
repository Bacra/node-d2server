var fs = require('fs'),
	http = require('http'),
	querystring = require('querystring'),
	mod = require('../../mod.js'),
	notice = mod.notice,
	util = mod.util,
	_conf = mod.conf,
	mime = mod.mime,
	watchFileCh = mod.load('watchFileCh'),
	wget = mod.load('wget');



function sendData(file, res, projConf, wait, step, extname){
	if (step > 0) {
		var stepDate = projConf.dataAPIStep[file];
		file += '&&_step'+(projConf.dataAPIStep[file] = !stepDate || step < ++stepDate ? 1 : stepDate);
	}

	if (!extname) extname = getFileExtname(file);
	if (extname) file += '.'+extname;

	var cont = readDateFile(file);

	if (cont.length) {
		res.writeHead(200, {
			'Content-Type': mime(extname)
		});
	} else {
		res.statusCode = 404;
	}

	if (wait) {
		setTimeout(function(){
			res.end(cont);
		}, wait);
	} else {
		res.end(cont);
	}
}





/**
 * confDataAPI		可包含的配置项目
 * hostname			线上地址
 * port				线上端口
 * cache	true	针对线上的数据进行本地缓存
 * update	false	对本地缓存的数据进行更新 
 * usePostQuery	false
 * excludeQuery	[]
 * defaultMime	text/plain
 */
module.exports = function(confDataAPI, projConf){
	// 处理默认值
	if (!confDataAPI.hostname) confDataAPI.hostname = projConf.hostname;
	if (!('cache' in confDataAPI)) confDataAPI.cache = true;
	if (!confDataAPI.defaultMime) confDataAPI.defaultMime = 'text/plain';

	// 定义生成主函数用到的“全局”方法和变量
	var _dataConfFile = projConf.root + _conf.DynamicDataFile,
		_sendData = function(res, cont, conf){
			if (cont.length) {
				res.writeHead(200, {
					'Content-Type': conf.mime || conf.extname ? mime[conf.extname] : _dataConf.defaultMime
				});
			} else {
				res.statusCode = 404;
			}

			if (conf.wait) {
				setTimeout(function(){
					res.end(cont);
				}, conf.wait);
			} else {
				res.end(cont);
			}
		},
		_getDataFail = function(res){
			res.statusCode = 500;
			res.end();
		},
		_saveDataConf = function(){
			util.writeFile(_dataConf, JSON.stringify(_dataConf));
		},
		_dataConf;


	// 读取项目的配置文件
	try {
		_dataConf = JSON.parse(fs.readFileSync(_dataConfFile));
	} catch(err){
		notice.log('dataAPI', err, _dataConfFile);
		_dataConf = {};
		_saveDataConf();
	}

	// 监听配置文件
	projConf.watchFiles[_dataConfFile] = watchFileCh(_dataConfFile, function(){
		_dataConf = JSON.parse(fs.readFileSync(_dataConfFile));
	});



	// 生成主处理函数
	return function(uri, res, req){
		var mainQuery = util.query(),
			query = Object.create(uri.query),
			postData;
		

		// 收集可能的post内容
		mainQuery.join(function(nextFunc){
			wget.getBuffer(res, function(buf){
				postData = buf;
			}, function(){
				nextFunc();
			});
		});

		// 将post的内容写入query
		if (Array.isArray(confDataAPI.usePostQuery)) {
			mainQuery.join(function(nextFunc){
				data = querystring.parse(postData.toString());
				util.eachObject(data, function(v, k){
					query[k] = v.length > 5 ? v.substring(0, 5) : v;
				});
			});
		}

		// 删除不必要的参数
		if (Array.isArray(confDataAPI.excludeQuery)) {
			mainQuery.join(function(nextFunc){
				confDataAPI.excludeQuery.forEach(function(name){
					delete query[name];
				});
				nextFunc();
			});
		}

		// 读取内容
		mainQuery.join(function(){
			var file = getDateFilePath(uri.pathname, query, req),
				conf = _dataConf[file];
			
			// 获取文件配置
			if (!conf){
				conf = _dataConf[file] = {};
				_saveDataConf();
			} else if (conf.extname) {
				file += '.'+conf.extname;
			}

			// 获取返回内容
			if (_dataConf.update || (_dataConf.cache && !util.fileExists(file))) {
				if (_dataConf.hostname) {
					wget(uri.path, req.method == 'POST', postData, req.headers, _dataConf.hostname, _dataConf.port, function(res2){
						wget.getBuffer(res2, function(buf){
							// 获取内容类型
							if (!conf.mime && res2.getHeader('content-type')) {
								conf.mime = res2.getHeader('content-type');
								_saveDataConf();
							}

							_sendData(res, buf, conf);
							if (_dataConf.cache) util.writeFile(file, buf);
						}, function(err){
							_getDataFail(res);
						});
					}, function(err){
						_getDataFail(res);
					});
				} else {
					notice.warn('dataAPI', 'Can not update data which hostname is not specified');
				}
			} else {
				// 读取缓存内容
				fs.readFile(file, function(err, buf){
					if (err) {
						_getDataFail(res);
						notice.warn('dataAPI', err, file);
					} else {
						_sendData(res, buf, conf);
					}
				});
			}
		});

		mainQuery.start();
	};
};





function getDateFilePath(pathname, query, req){
	var filename = (pathname.substring(1).replace(/[\/\\]/g, '_') || '\u3000') + '/' + util.sortAndStringifyJSON(query);
	if (req.method == "POST") filename = '_post_&&'+filename;

	return filename;
}

function readDateFile(file){
	try {
		return fs.readFileSync(file);
	} catch(err) {
		util.writeFile(file, '');
		notice.log('dataAPI', 'data file create', file);
		return '';
	}
}

