var fs = require('fs'),
	http = require('http'),
	querystring = require('querystring'),
	// parseURL = require('url').parse,
	mod = require('../../mod.js'),
	notice = mod.notice,
	util = mod.util,
	_conf = mod.conf,
	mime = mod.mime,
	Query = mod.load('Query'),
	watchFileCh = mod.load('watchFileCh'),
	wget = mod.load('wget'),
	resHead = mod.load('resHead'),
	proj404 = mod.load('proj404');



/**
 * confDataAPI 可包含的配置项目
 * hostname			线上地址
 * port				线上端口
 * update	false	对本地缓存的数据进行更新 
 * excludeQuery	[]
 * defaultMime	text/plain
 * formatQueryName format
 *
 * 每个数据文件可以包含的配置参数
 * mime
 * extname
 * wait
 */
module.exports = function(confDataAPI, projConf){
	// 处理默认值
	if (!confDataAPI.hostname) confDataAPI.hostname = projConf.hostname;
	if (!confDataAPI.defaultMime) confDataAPI.defaultMime = 'text/plain';
	if (!confDataAPI.formatQueryName) confDataAPI.formatQueryName = 'format';


	// 定义生成主函数用到的“全局”方法和变量
	var _dataConfFile = projConf.root + _conf.DynamicDataFile,
		saveDataConf = function(){
			util.writeFile(_dataConfFile, JSON.stringify(_dataConf, null, '\t'));
		},
		_dataConf;


	// 读取项目的配置文件
	try {
		_dataConf = JSON.parse(fs.readFileSync(_dataConfFile));
	} catch(err){
		notice.log('dataAPI', err, _dataConfFile);
		_dataConf = {};
		saveDataConf();
	}

	// 监听配置文件
	projConf.watchFiles[_dataConfFile] = watchFileCh(_dataConfFile, function(){
		_dataConf = JSON.parse(fs.readFileSync(_dataConfFile));
	});



	// 生成主处理函数
	// ps: 文件不存在 直接返回404；文件内容为空，执行sendDate返回404   两者是有差别的
	return function(uri, res, req, resErrorCall){
		var mainQuery = Query(),
			getQuery = util.cloneObject(uri.query),
			postQuery = {},
			isPost = req.method == 'POST',
			postData;


		// 收集可能的post内容
		if (isPost) {
			mainQuery.join(function(nextFunc){
				wget.getBuffer(res, function(buf){
					postData = buf;
					nextFunc();
				}, function(){
					postData = '';
					nextFunc();
				});
			});

			mainQuery.join(function(nextFunc){
				postQuery = querystring.parse(postData.toString());
				util.eachObject(postQuery, function(v, k){
					postQuery[k] = v.length > 5 ? v.substring(0, 5) : v;
				});
				nextFunc();
			});
		}

		// 删除不必要的参数
		if (Array.isArray(confDataAPI.excludeQuery)) {
			mainQuery.join(function(nextFunc){
				confDataAPI.excludeQuery.forEach(function(name){
					delete getQuery[name];
					delete postQuery[name];
				});
				nextFunc();
			});
		}



		// 读取内容
		mainQuery.join(function(){
			var dataDirname = getDateDirname(uri.pathname),
				dataFilename = getDateFilename(getQuery),
				sendData = function(cont){
					if (cont.length) {
						res.writeHead(200, resHead.byMime(conf.mime || (conf.extname ? mime(conf.extname) : confDataAPI.defaultMime)));
					} else {
						res.writeHead(404, {
							'Content-Type':  'text/html'
						});
						cont = proj404(projConf, uri.port);
					}

					if (conf.wait) {
						setTimeout(function(){
							res.end(cont);
						}, conf.wait);
					} else {
						res.end(cont);
					}
				},
				readCache = function(){
					dataFile = util.fileExists(dataFile) ? dataFile : cacheDateFile;
					fs.readFile(dataFile, function(err, buf){
						if (err) {
							resErrorCall(404);
						} else {
							sendData(buf);
						}
					});
				};
			
			if (isPost) {
				dataDirname += dataFilename+'/';
				dataFilename = getDateFilename(postQuery);
			}
			

			var dataFile = dataDirname+dataFilename,
				conf = _dataConf[dataFile],
				cacheDateFile;
			// 获取文件配置
			if (!conf){
				conf = _dataConf[dataFile] = {};
				if (uri.query[confDataAPI.formatQueryName]) conf.extname = uri.query[confDataAPI.formatQueryName];
				saveDataConf();
			}

			if (conf.extname) {
				dataFilename += '.'+conf.extname;
			}

			dataDirname = projConf.root+_conf.DynamicDataPath+dataDirname;
			dataFile = dataDirname+dataFilename;
			cacheDateFile = dataDirname+'[CACHE] '+dataFilename;

			// 获取返回内容
			if (confDataAPI.update) {
				if (confDataAPI.hostname) {
					var host = confDataAPI.hostname + (confDataAPI.port ? ':'+confDataAPI.port : ''),
						headers = util.cloneObject(req.headers);
					headers.host = host;
					notice.log('dataAPI', 'Start download data file', dataFile);

					wget({
						'host': host,
						'path': uri.path,
						'method': req.method,
						'headers': headers
					}, postData, function(res2){
						if (res2.statusCode == 200) {
							wget.getBuffer(res2, function(buf){
								// 获取内容类型
								if (!conf.mime && res2.headers['content-type']) {
									conf.mime = res2.headers['content-type'];
									saveDataConf();
								}

								sendData(buf);
								util.writeFile(cacheDateFile, buf);
							}, readCache);
						} else {
							res.writeHead(res2.statusCode, res2.headers);
							util.writeFile(dateFile, '');
							res.end();
						}
					}, readCache);
				} else {
					notice.warn('dataAPI', 'Can not update data which hostname is not specified');
					readCache();
				}
			} else {
				readCache();
			}
		});

		mainQuery.start();
	};
};



function getDateDirname(pathname){
	return (pathname.substring(1).replace(/[\/\\]/g, '_') || '_') +'/';
}

function getDateFilename(query, req){
	return util.sortAndStringifyJSON(query) || '[NULL]';
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

