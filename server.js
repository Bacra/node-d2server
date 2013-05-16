var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
	less = require('less'),
	zlib = require("zlib"),
	stream = require('stream'),
	// util = require('util'),
	// Event = require("events").EventEmitter,

	io = require('socket.io'),
	ejs = require('ejs'),

	mime = require('./lib/mime.js'),
	_log = {},
	notice = require('./lib/notice.js')(_log, true),
	_conf = require('./lib/conf.js'),

	_fileServer = http.createServer(),

	_apps = {},
	_alias = {},
	_faviconIcoBuf = '',

	_watch = {},						// 文件监视对象
	_serverStartTime = getUTCtime(),
	_gzipExtname = /^(html|css|less|js)$/,		// 注意 只有使用gzip的文件 缓存才不会放入cacheTemp
	_gzipReg = /\bgzip\b/i,
	_aliasReg = /^([^\.]+)\./;



var AppConfig = function(root, cont) {
	_apps[root] = this;

	this.root = root;

	this.cacheCont = {};
	this.cacheTemp = {};
	this.cacheTpl = {};			// 缓存模板解析之后的函数  不使用ejs默认的缓存函数（变量冲突）

	this.fileWatch = {};		// 文件监视

	var self = this;

	// 数据文件
	if (cont.dataFiles) {
		this.dataFiles = cont.dataFiles.map(function(v){
			return parsePath(root+v);
		});
	}

	// 二级域名
	if (cont.alias) {
		_alias[cont.alias] = root;
	}

	// 文件映射
	if (cont.fileMap) {
		var fileMap = [],			// html中一个文件对应多个文件（转化之后，变成虚拟文件名）
			sourceMap = {},			// 对应的多个文件 每个文件又要虚拟出一个目录和名字
			fileIndex = 0;
		eachObject(cont.fileMap, function(ofile, srcfiles){
			var basePath = path.dirname(ofile)+'/',
				baseExtname = path.extname(ofile).substring(1).toLowerCase(),
				getConvertStrFunc = self.getConvertStr[baseExtname];
			
			fileMap.push(self.getConvertReg[baseExtname](ofile), srcfiles.map(function(v){
				var extname = path.extname(v),
					virtualFile = basePath+path.basename(v, extname)+'.m'+(fileIndex++)+extname;

				sourceMap[parsePath(root+virtualFile)] = parsePath(root+_conf.SourcePath+v);
				return getConvertStrFunc(virtualFile);
			}).join('\n'));
		});

		this.sourceMap = sourceMap;
		this.convertSource4HTML = function(cont){
			for(var i = 0, num = fileMap.length; i < num; i = i +2) {
				cont = cont.replace(fileMap[i], fileMap[i+1]);
			}
			return cont;
		};
	}


	// baseLess 文件
	if (cont.baseLess) {
		var baseLess = path.normalize(root + _conf.SourcePath+ cont.baseLess);

		this.readLessCont(baseLess);
		notice.log('BASELESS', 'read file', baseLess);

		this.fileWatch[this.baseLess] = initFsWatch(baseLess, function(){
			notice.log('BASELESS', 'updata cont', baseLess);
			self.readLessCont(baseLess);
		}, function(e){
			notice.warn('BASELESS', 'Base Less File '+e, baseLess);
		}, function(err){
			notice.error('BASELESS', err, baseLess);
		});
	}
};

AppConfig.prototype = {
	// 设置默认值
	'dataFiles': [],
	'baseLessCont': '',
	'sourceMap': {},
	'convertSource4HTML': function(cont){
		return cont;
	},


	'getConvertStr': {
		'js': function(path){
			return '<script type="text/javascript" src="'+path+'"></script>';
		},
		'css': function(path){
			return '<link rel="stylesheet" type="text/css" href="'+path+'" />';
		}
	},
	'getConvertReg': {
		'js': function(path) {
			return new RegExp('<script [^>]*src="'+getRegExpUnicode(path)+'"[^>]*><\/script>', 'i');
		},
		'css': function(path) {
			return new RegExp('<link [^>]*href="'+getRegExpUnicode(path)+'"[^>]*>', 'i');
		}
	},

	'readLessCont': function(baseLess) {
		var self = this;
		fs.readFile(baseLess, function(err, buf){
			if (err) {
				console.error('BASELESS', err, baseLess);
			} else {
				self.baseLessCont = buf.toString();

				// 需要刷新less的缓存
				eachObject(self.cacheCont, function(i, v){
					if (v.extname == 'less') v.destory();
				});
				eachObject(self.cacheTemp, function(i, v){
					if (v.extname == 'less') v.destory();
				});
			}
		});
	},
	'destory': function(){
		eachObject(this.fileWatch, function(i, v){
			v.close();
		});
		delete _apps[this.root];
	}
};



setInterval(function(){
	eachObject(_apps, function(i, v){
		v.cacheTemp = {};
	});
}, _conf.AutoClearCache);		// 每xxx分钟，清除临时缓存一次


fs.readFile('./favicon.ico', function(err, buf){
	if (err) {
		notice.warn('SYS', 'favicon not exists');
	} else {
		_faviconIcoBuf = buf;
	}
});



// 新建一个空白项目，用于存放没有项目遮盖的文件
new AppConfig('widthoutApp', {});
// 初始化项目属性
fs.readdir(_conf.DocumentRoot, function(err, files) {
	if (err) throw new Error();
	files.forEach(function(v){
		if (v != '.'&& v != '..') {
			var file = _conf.DocumentRoot +v+'/'+_conf.AppConfigFile;
			fs.exists(file, function(exists){
				if (exists) {
					var root = parsePath(_conf.DocumentRoot +v+'/'),
						appconf = new AppConfig(root, require(file));

					initFsWatch(file, function(){
						appconf.destory();
						delete require.cache[require.resolve(file)];
						appconf = new AppConfig(root, require(file));
						notice.log('APPConf', 'updata cont', file);
					}, function(e){
						notice.warn('APPConf', 'config file '+e, file);
					}, function(err){
						notice.error('APPConf', err, file);
					});
				}
			});
		}
	});
});










_fileServer.on('request', function(req, res){
	if (req.url == '/favicon.ico') {
		res.statusCode = 200;
		res.end(_faviconIcoBuf);
		return;
	}
	
	var uri = url.parse(req.url, true),
		host = req.headers.host,
		docRoot = _conf.DocumentRoot,
		file, appConf;

	// 获取文件顶端路径
	if (host) {
		host = host.match(_aliasReg);
		if (host) {
			host = host[1].toLowerCase();
			if (_alias[host]) docRoot = _alias[host];
		}
	}

	// 获取文件完整路径
	file = parsePath(docRoot + uri.pathname);

	// 获取项目配置文件
	eachObject(_apps, function(i){
		if (!file.indexOf(i)) {
			appConf = _apps[i];
			return false;
		}
	});

	if (appConf) {
		// 判断是否为数据文件
		var isDataFile = false,
			dataFile;
		forEach(appConf.dataFiles, function(){
			if (!file.indexOf(this)) {
				isDataFile = true;
				return false;
			}
		});

		if (isDataFile) {
			dataFile = appConf.docRoot + _DynamicDataPath + uri.pathname.replace(/[\/\\]/g, '_') + '/' + sortAndStringifyJSON(url.query);
			
			// 是否是post提交
			if (false) {
				dataFile += '&&_post';
			}

			fs.readFile(dataFile, function(err, buf){
				if (err) {
					fs.write(dataFile, '', function(err){
						if (err) notice.warn('FS', 'Create DataFile error');
					});
					res.statusCode = 404;
					res.end();
				} else if (buf.length) {
					res.end(buf);
				} else {
					res.statusCode = 404;
					res.end();
				}
			});

			return;
		} else if (appConf.sourceMap[file]){			// 是否在映射列表中
			file = appConf.sourceMap[file];
		}
	} else {
		appConf = _apps['widthoutApp'];
	}

	fileServer(req, res, file, uri, appConf);
});



function fileServer(req, res, file, uri, appConf){
	var extname = path.extname(file).substring(1),
		useGzip = false, cache;

	if (_gzipExtname.test(extname)) {
		// 判断浏览器是否支持gzip
		useGzip = req.headers['accept-encoding'] && _gzipReg.test(req.headers['accept-encoding']);
		if (!useGzip) notice.warn('GZIP', 'Browser do not support gzip');
	}
	cache = useGzip ? appConf.cacheCont[file] : appConf.cacheTemp[file];

	if (!cache) {
		if (!fs.existsSync(file)) {
			notice.log(404, file);
			res.statusCode = 404;
			res.end();
			return;
		} else {
			cache = new Cache(file, extname, useGzip, appConf);
		}
	}

	cache.getLastModified(function(err, lastModified){		// err 永远都是false 所以不用判断
		if (lastModified == req.headers['if-modified-since']) {
			res.statusCode = 304;
			res.end();
			return;
		} else {
			// 注意 由于sendCont和sendZipCont方法在fileServer函数中，是在getLastModified执行之后再执行的，所以lastModified值已经获取成功
			cache.sendCont(res);
		}

		if (!appConf.fileWatch[file]) {
			if (extname == 'css' || extname == 'less') {
				appConf.fileWatch[file] = initFsWatch(file, function(){
					// 动态刷新
					cache.refresh();
				});
			} else if (extname == 'html') {
				appConf.fileWatch[file] = initFsWatch(file, function(){
					// 刷新页面
					delete appConf.cacheTpl[file];
					cache.refresh();
				});
			} else {
				appConf.fileWatch[file] = initFsWatch(file, function(){
					// 刷新页面
					cache.refresh();
				});
			}
		}
	});
}






// 创建带有等待队列的生成函数（附加带有数据缓存）
// isFirstSync：第一次创建数据的时候，是否要执行添加的回调
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
				if (!err) data = rs;

				if (!isFirstSync) callback(err, rs);

				var len = query.length;
				notice.log('Query', len +' has waited');
				
				if (len) {
					var cb;
					while((cb = query.pop())) cb(err, rs);
				}
				query = null;
			}, createDataFuncParams);
		}
	};
}




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
		getLastModified = createCacheQuery(function(callback){
			try {
				lastModified = fs.statSync(file).mtime.toUTCString();
			} catch (err) {
				lastModified = _serverStartTime;
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
			getContData = createCacheQuery(function(callback, res){

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
				return createCacheQuery(function(callback){
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
		getContData = createCacheQuery(function(callback, res){
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
		new Cache(file, extname, useGzip, appConf, getUTCtime());
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








// 解析less文件
function parseLess(cont, file, callback, errorCallback, options){
	try {
		var parser = new(less.Parser)({
			paths: [path.dirname(file)],
			filename: path.basename(file)
		});

		if (options && options.baseLessCont) cont = options.baseLessCont + cont;

		parser.parse(cont, function (err, tree) {
			if (err) {
				errorCallback(err);
				return;
			}
			cont = tree.toCSS();
			cont = cont.replace(/([\w-]) +\.(--|__)/g, '$1$2');		// BEM支持
			callback(cont);
		});
	} catch (err) {
		errorCallback(err.message);
	}
}


function parseHtml(cont, file, callback, errorCallback, options) {
	try {
		cont = options.convertSource4HTML(cont);

		var tpl = options.cacheTpl[file] || (options.cacheTpl[file] = ejs.compile(cont, {
			'filename': file
		}));

		callback(tpl(options || {}));
	} catch (err) {
		errorCallback(err);
	}
}




function initFsWatch(file, changeFunc, removeFunc, errorFunc) {
	var watch = fs.watch(file),
		chWaitTime;

	watch.on('change', function(e){
		if (e == 'change') {
			if (chWaitTime) return;
			chWaitTime = setTimeout(function(){
				chWaitTime = null;
			}, 300);

			changeFunc();
			notice.log('Watch', 'file change', file);
		} else {
			watch.close();

			if (removeFunc) removeFunc(e);

			if (e == 'rename') {
				notice.warn('Watch', 'file rename', file);
			} else {
				notice.error('Watch', 'undefined Event', file);
			}
		}
	});
	watch.on('error', function(err){
		if (errorFunc) errorFunc(err);
		notice.error('Watch', err, file);
	});

	return watch;
}






_fileServer.listen(82);
notice.log('INFO',  'Server run in Port:82\t\t'+_serverStartTime);








var _infoServer = http.createServer(function(req, res){
	res.end('111');
});




io.listen(_infoServer);
_infoServer.listen(81);








// 命令行拓展
process.stdin.setEncoding('utf8');
process.stdin.resume();

process.stdin.on('data', function(data){
	data = data.trim();

	switch (data) {
		case 'rs':
			break;
		default:
			var root = _conf.DocumentRoot + data+'/';
			if (!fs.existsSync(root)) {
				try {
					mkdirs(root+_conf.SourcePath);
					mkdirs(root+_conf.DynamicDataPath);
					writeFile(root+_conf.AppConfigFile, 'module.exports = {\n\t"dataFiles": [],\n\t"alias": "",\n\t"fileMap": {},\n\t"baseLess": "",\n\t"sync": {\n\t}\n};');
				} catch(e) {
					console.error(e);
				}
			} else {

			}

	}
});






/******************
		util
*******************/

function mkdirs(p){
	if (!fs.existsSync(p)) {
		mkdirs(path.join(p, '..'));
		fs.mkdirSync(p);
	}
}

function writeFile(file, buf){
	mkdirs(path.dirname(file));
	fs.writeFile(file, buf);
}

function copyFile(from, to){
	writeFile(to, fs.readFileSync(from));
}





function getRegExpUnicode(str){
	var rs = '', code;
	for (var i = 0, num = str.length; i < num; i++) {
		// console.log(str.charCodeAt(i).toString(16));
		code = str.charCodeAt(i).toString(16);
		code = zeroize(code, 4);

		rs += '\\u' + code;
	}
	return rs;
}

function zeroize(value, length) {
	if (!length) return value;

	value = String(value);		// 必须转化为字符串才行
	for (var i = (length - value.length), zeros = ''; i > 0; i--) {
		zeros += '0';
	}
	return zeros + value;
}



function getUTCtime(){
	return new Date().toUTCString();
}


function forEach(arr, callback) {
	for (var i = 0, num = arr.length; i < num; i++) {
		if (callback.call(arr[i], i, arr[i], num) === false) break;
	}
}

function eachObject(obj, callback) {
	for (var i in obj) {
		if (callback.call(obj[i], i, obj[i]) === false) break;
	}
}

function sortAndStringifyJSON(json) {
	var arr = [],
		str = [];
	for (var i in json) {
		arr.push(i);
	}
	arr.sort();

	forEach(arr, function(){
		str.push(this + '=' +json[this]);
	});

	return str.join('&');
}

function parsePath(str) {
	return path.normalize(str).toLowerCase();
}