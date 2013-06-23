var _apps = {},
	_alias = {},
	path = require('path'),
	fs = require('fs'),
	util = require('./util.js'),
	notice = require('./notice.js'),
	watchFileCh = require('./watchfilechange.js'),
	dataAPI = require('./dataapi.js'),
	d2io = require('./apps/i2serv.js').io.of('/d2'),
	Cache = require('./cache.js'),
	_conf = require('../conf.js'),
	_domainSplit = '.'+_conf.Domain.toLowerCase(),

	getConvertStr4js = function(path){
		return '<script type="text/javascript" src="'+path+'"></script>';
	},
	getConvertStr4css = function(path){
		return '<link rel="stylesheet" type="text/css" href="'+path+'" />';
	},
	getConvertStr4other = function(path) {
		return path;
	},
	getConvertReg4js = function(path) {
		return new RegExp('<script [^>]*src=("|\\\')'+util.getRegExpUnicode(path)+'\\1[^>]*><\/script>', 'i');
	},
	getConvertReg4css = function(path) {
		return new RegExp('<link [^>]*href=("|\\\')'+util.getRegExpUnicode(path)+'\\1[^>]*>', 'i');
	},
	getConvertReg4other = function(path) {
		return new RegExp(util.getRegExpUnicode(path), 'i');
	},
	getConvertStr = function(extname){
		if (extname == 'js') {
			return getConvertStr4js;
		} else if (extname == 'css' || extname == 'less'){
			return getConvertStr4css;
		} else {
			return getConvertStr4other;
		}
	},
	getConvertReg = function(extname) {
		if (extname == 'js') {
			return getConvertReg4js;
		} else if (extname == 'css' || extname == 'less'){
			return getConvertReg4css;
		} else {
			return getConvertReg4other;
		}
	};




function AppConfig(dirname, cont) {
	root = util.parsePath(_conf.DocumentRoot+dirname+'/');
	this.root = root;
	this.dirname = dirname;

	this.cache = {};
	this.cacheTpl = {};			// 缓存模板解析之后的函数  不使用ejs默认的缓存函数（变量冲突，更方便地进行管理）

	this.watchFiles = {};		// 文件监视
	this.sourceMap = {};		// 对应的多个文件 每个文件又要虚拟出一个目录和名字


	if (cont.MinCssName) this.MinCssName = cont.MinCssName;

	var self = this,
		sourceMap = this.sourceMap,
		fileIndex = 0;

	// 数据文件 判断和处理方法
	// 注意：配置文件中的参数和appConf对象中的方法参数，有所不同
	if (cont.dataAPI) {

		this.dataAPIStep = {};		// 用于保存数据文件step数据
		this.dataAPI = dataAPI(cont.dataAPI, this);
	}

	// 二级域名
	if (cont.alias) {
		this.alias = cont.alias.toLowerCase();
		_alias[this.alias] = root;
	}


	// HTML页面配置信息处理
	this.defaultHeader = cont.defaultHeader;
	this.defaultFooter = cont.defaultFooter;

	if (cont.HTML) {
		var HTMLData = {};
		util.eachObject(cont.HTML, function(srcFile, oFiles){
			srcFile = util.parsePath(root+_conf.SourcePath+srcFile);
			var fDatas = {};

			// header footer
			var header = self.defaultHeader;
			var footer = self.defaultFooter;
			if (oFiles.header !== undefined) {
				header = oFiles.header;
				delete oFiles.header;
			}
			if (oFiles.footer !== undefined) {
				footer = oFiles.footer;
				delete oFiles.footer;
			}


			util.eachObject(oFiles, function(i, fileConf){
				var outFile = util.parsePath(root+i);
				sourceMap[outFile] = srcFile;

				// 处理配置的参数
				fileConf.href = i;
				fileConf = self.initHTMLConfig(fileConf);
				fileConf.header = header;
				fileConf.footer = footer;

				fDatas[outFile] = fileConf;
			});

			HTMLData[srcFile] = fDatas;
		});

		this.HTMLData = HTMLData;
	}


	// 文件映射
	if (cont.fileMap) {
		var convertConf = [],			// html中一个文件对应多个文件
			sourceLink = {};			// 访问组合文件，自动拼接内容(build)
		
		util.eachObject(cont.fileMap, function(oFile, srcFiles){
			var basePath = path.dirname(oFile)+'/',
				baseExtname = util.getExtname(oFile).toLowerCase(),
				getConvertStrFunc = getConvertStr(baseExtname),
				mySourceLink = [];

			
			convertConf.push(getConvertReg(baseExtname)(oFile), srcFiles.map(function(v){
				var extname = path.extname(v),
					virtualFile = basePath+path.basename(v, extname)+'.m'+(fileIndex++)+extname,
					srcFile = util.parsePath(root+_conf.SourcePath+v);

				sourceMap[util.parsePath(root+virtualFile)] = srcFile;		// fileServ 地址转化
				mySourceLink.push(srcFile);									// 原始文件路径对应拼接资源

				return getConvertStrFunc(virtualFile);
			}).join('\n'));


			if (mySourceLink.length) {		// 拒绝空数组保存（可在split过程中少进行一次if判断）
				sourceLink[util.parsePath(root+oFile)] = mySourceLink;
			}
		});

		this.convertSource4HTML = function(cont){
			for(var i = 0, num = convertConf.length; i < num; i = i +2) {
				cont = cont.replace(convertConf[i], convertConf[i+1]);
			}
			return cont;
		};

		this.sourceLink = sourceLink;
	}


	// baseLess 文件
	if (cont.baseLess) {
		var baseLess = path.normalize(root + _conf.SourcePath+ cont.baseLess);

		this.readLessCont(baseLess);

		this.watchFiles[this.baseLess] = watchFileCh(baseLess, function(){
			notice.log('BASELESS', 'update cont', baseLess);
			self.readLessCont(baseLess);
		}, function(e){
			self.readLessCont = '';
			notice.warn('BASELESS', 'Base Less File '+e, baseLess);
		});
	}

	// 注册
	_apps[root] = this;
}



AppConfig.prototype = {
	// 设置默认值
	'dataAPIStep': {},
	'dataAPI': function(){
		return false;
	},
	'baseLessCont': '',
	'alias': '',
	'HTMLData': {},
	'sourceLink': {},
	'convertSource4HTML': function(cont){
		return cont;
	},
	'initCacheAndWatch': function(file, extname, uri, drGetCont){
		var appConf = this,
			cache = Cache(file, extname, this, drGetCont);
			
		this.cache[file] = cache;

		if (!this.watchFiles[file]) {
			if (extname == 'html') {
				this.addPageReloadWatch(file, function(){
					delete appConf.cacheTpl[file];
					delete appConf.cache[file];
				});
			} else if (extname == 'less' || extname == 'css') {
				this.addCssReloadWatch(file, uri.pathname);
			} else {
				this.addPageReloadWatch(file, function(){
					delete appConf.cache[file];
				});
			}
		}

		return cache;
	},
	'addCssReloadWatch': function(file, pathname){
		var self = this;
		this.watchFiles[file] =  watchFileCh(file, function(){
			delete self.cache[file];
			self.emit('cssReload', {
				'pathname': pathname,
				'filename': path.basename(pathname)
			});
		});
	},
	'addPageReloadWatch': function(file, callback){
		var self = this;
		this.watchFiles[file] = watchFileCh(file, function(){
			callback();
			self.emit('pageReload');
		});
	},


	'readLessCont': function(baseLess) {
		var self = this;
		fs.readFile(baseLess, function(err, buf){
			if (err) {
				notice.warn('BASELESS', err, baseLess);
			} else {
				self.baseLessCont = buf.toString();

				var hasUpdate = false;
				util.eachObject(self.cache, function(i, v){
					if (v.extname == 'less') {
						hasUpdate = true;
						delete self.cache[i];
					}
				});

				if (hasUpdate) self.emit('pageReload');

				notice.log('BASELESS', 'read file', baseLess);
			}
		});
	},
	'destory': function(){
		delete _apps[this.root];
		util.eachObject(this.watchFiles, function(i, v){
			v.close();
		});
	},
	'emit': function(eventStr, data){
		d2io.to(this.root).emit(eventStr, data);		// d2io.to 和 d2io.in 是相同的
	},


	'initHTMLConfig': function(fData) {
		if (!fData.title) fData.title = '未命名';
		if (!fData.data) fData.data = {};
		fData.data.title = fData.title;

		fData.data.block = fData.block && fData.block.trim() ? new RegExp('\\b('+fData.block.trim().replace(/\s+/g, '|')+')\\b') : false;		// 在data中将block转化为正则

		fData.appConf = this;

		return fData;
	},

	'getIncludeTpl': function(path, oth, isBegin){
		if (path) {
			var str = '<% include '+path+' %>';
			if (isBegin) {
				str += '\n\n\n\n\n\n<!-- Content Begin -->\n';
			} else {
				str = '\n<!-- Content End -->\n\n\n\n\n\n' + str;
			}
			return str;
		} else {
			return oth;
		}
	},
	'getHTMLConfig': function(file, outFile){
		var data, HTMLData = this.HTMLData[file];

		if (HTMLData) {
			if (outFile) {
				data = HTMLData[outFile];
				if (!data) notice.warn('Serv', 'block not exisist');
			}

			return data || HTMLData['default'];
		}

		notice.warn('Serv', 'block not exisist');
		return this.initHTMLConfig({});
	}
};




function reloadAppConfig(dirname, isInit){
	var root = _conf.DocumentRoot+dirname+'/',
		mainFile = root + _conf.MainConfigFile,
		mainPath, mainConf,
		myFile = root + _conf.AppConfigFile,
		myConf,
		appConf, watchFunc;

	if (isInit) {
		watchFunc = function(file){
			watchFileCh(file, function(){
				appConf.destory();
				if (fs.existsSync(mainFile)) {
					appConf = reloadAppConfig(dirname);
					appConf.emit('pageReload');
					notice.log('AppConf', 'Updataed Content', file);
				} else {
					notice.warn('AppConf', 'App Main Config File has removed', mainFile);
				}
			}, function(e){
				notice.warn('AppConf', 'config File '+e, file);
			});
		};
	}


	// 读取主配置文件
	delete require.cache[require.resolve(mainFile)];
	mainConf = require(mainFile);
	if (isInit) watchFunc(mainFile);


	// 读取个人配置文件
	if (fs.existsSync(myFile)) {
		delete require.cache[require.resolve(myFile)];
		myConf = require(myFile);
		if (isInit) watchFunc(myFile);

		if (myConf.sync) mainConf.sync = myConf.sync;
		if (myConf.alias) mainConf.alias = myConf.alias;
		// if (myConf.dataAPI) mainConf.dataAPI = myConf.dataAPI;
	}

	// 读取附加配置文件
	if (mainConf.extra) {
		mainPath = path.dirname(mainFile)+'/';

		mainConf.extra.map(function(v){
			var file = mainPath+v,
				conf, HTML, fileMap;

			if (!fs.existsSync(file)) {
				notice.warn('AppConf', 'extra conf file do not exists', file);
				return;
			}

			delete require.cache[require.resolve(file)];
			conf = require(file);
			if (isInit) watchFunc(file);


			// 合并HTML配置
			if (conf.HTML) {
				HTML = mainConf.HTML;
				util.eachObject(conf.HTML, function(file, outConf){
					if (HTML[file]) {
						if (outConf['footer'] || outConf['header']) {
							notice.warn('AppConf', 'Do not insertCan not override "header" or "footer" in HTML Config', file);
							return;
						}
						util.eachObject(outConf, function(path, data){
							if (HTML[file][path]) {
								notice.warn('AppConf', 'Can not override "'+path+'" in HTML Config', file);
							} else {
								HTML[file][path] = data;
							}
						});
					} else {
						HTML[file] = outConf;
					}
				});
			}

			// 合并文件映射配置
			if (conf.fileMap) {
				fileMap = mainConf.fileMap;

				util.eachObject(conf.fileMap, function(file, srcArr){
					if (fileMap[file]) {
						fileMap[file] = fileMap[file].concat(srcArr);
					} else {
						fileMap[file] = srcArr;
					}
				});
			}

		});
	}


	appConf = new AppConfig(dirname, mainConf);

	if (isInit) notice.log('AppConf', 'read conf file success', mainFile);

	return appConf;
}





function clearCache(){
	util.eachObject(_apps, function(i, v){
		v.cache = {};
	});
}

// 每xxx分钟，清除缓存一次
setInterval(clearCache, _conf.AutoClearCache);



// 初始化项目属性
fs.readdir(_conf.DocumentRoot, function(err, files) {
	if (err) {
		notice.error('SYS', 'Serv Document not exists', _conf.DocumentRoot);
		return;
	}
	files.forEach(function(v){
		if (v != '.'&& v != '..') {
			var file = _conf.DocumentRoot +v+'/'+_conf.MainConfigFile;
			fs.exists(file, function(exists){
				if (exists) reloadAppConfig(v, true);
			});
		}
	});
});





module.exports = {
	'defaultApp': new AppConfig(_conf.DocumentRoot, '', {}),		// 新建一个空白项目，用于存放没有项目遮盖的文件
	'find': function(file){
		var conf;
		util.eachObject(_apps, function(i){
			if (i != _conf.DocumentRoot && !file.indexOf(i)) {		// 需要排除defaultApp的干扰
				conf = _apps[i];
				return false;
			}
		});

		return conf;
	},
	'DRS': function(host){					// Document Root System  来自于dns
		host = host.split(_domainSplit);	// 由于端口绑定，所以不用太计较是否真的切分成这样，我们只关注host[0]获取到的值
		// 注意：域名浏览器会自动转化为小写，所以不需要执行toLowerCase方法
		if (host.length) host = _alias[host[0]];
		return host || _conf.DocumentRoot;
	},
	'reload': reloadAppConfig,
	'clearCache': clearCache
};