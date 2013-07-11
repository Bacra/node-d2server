var _projs = {},
	_alias = {},
	path = require('path'),
	fs = require('fs'),
	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
	watchFileCh = mod.load('watchFileCh'),
	dataAPI = require('./dataAPI.js'),
	d2io = mod.load('i2serv').io.of('/d2'),

	mimeTag = mod.load('mimeTag'),
	Cache;			// Cache会调用许多组建，导致这些组建，都不能使用ProjConfig




function ProjConfig(dirname, cont) {
	var root = util.parsePath(_conf.DocumentRoot+dirname+'/');
	this.root = root;				// root作为proj的key  dirname不能，因为root为绝对路径，相比于dirname更加不容易判断错误
	this.dirname = dirname;
	this.name = cont.name || 'Unnamed Project';

	this.cache = {};
	this.cacheTpl = {};			// 缓存模板解析之后的函数  不使用ejs默认的缓存函数（变量冲突，更方便地进行管理）

	this.watchFiles = {};		// 文件监视
	this.sourceMap = {};		// 对应的多个文件 每个文件又要虚拟出一个目录和名字


	if (cont.MinCssName) {
		var MinCssNameKeys = Object.keys(cont.MinCssName);
		if (MinCssNameKeys.length) {
			this.MinCssName = cont.MinCssName;
			this.MinCssNameKeys = MinCssNameKeys;
			this.MinCssNameKeyStr = MinCssNameKeys.join('|');			// 为RegExp做缓存处理
		}
	}

	var self = this,
		sourceMap = this.sourceMap,
		fileIndex = 0;

	// 数据文件 判断和处理方法
	// 注意：配置文件中的参数和projConf对象中的方法参数，有所不同
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
		var HTMLData = {},
			HTMLLinks = {};		// 用于d2fs.js 404等 生成连接地址

		util.eachObject(cont.HTML, function(srcFile, oFiles){
			srcFile = util.parsePath(root+_conf.SourcePath+srcFile);
			var fDatas = {};

			// header footer
			var header = self.defaultHeader;
			var footer = self.defaultFooter;
			if ('header' in oFiles) {
				header = oFiles.header;
				delete oFiles.header;
			}
			if ('footer' in oFiles) {
				footer = oFiles.footer;
				delete oFiles.footer;
			}


			util.eachObject(oFiles, function(href, fileConf){
				var outFile = util.parsePath(root+href);
				sourceMap[outFile] = srcFile;

				// 处理配置的参数
				self.initHTMLConfig(fileConf);
				fileConf.header = header;
				fileConf.footer = footer;
				fileConf.href = href;
				HTMLLinks[href] = fileConf.title;

				fDatas[outFile] = fileConf;
			});

			HTMLData[srcFile] = fDatas;
		});

		this.HTMLData = HTMLData;
		this.HTMLLinks = HTMLLinks;
	}


	// 文件映射
	if (cont.fileMap) {
		var convertConf = [],			// html中一个文件对应多个文件
			sourceLink = {};			// 访问组合文件，自动拼接内容(build)
		
		util.eachObject(cont.fileMap, function(oFile, srcFiles){
			var basePath = path.dirname(oFile)+'/',
				baseExtname = util.getExtname(oFile).toLowerCase(),
				getConvertStrFunc = mimeTag[baseExtname],
				mySourceLink = [];

			if (!getConvertStrFunc) getConvertStrFunc = mimeTag.def;

			
			convertConf.push((mimeTag.getReg[baseExtname] || mimeTag.getReg.def)(oFile), srcFiles.map(function(v){
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
		var baseLess = this.baseLessFile = path.normalize(root + _conf.SourcePath+ cont.baseLess);

		if (util.fileExists(baseLess)) {
			this.resetLessCont();

			this.watchFiles[baseLess] = watchFileCh(baseLess, function(){
				notice.log('BASELESS', 'update cont', baseLess);
				self.resetLessCont();
			}, function(e){
				self.baseLessCont = '';
				notice.warn('BASELESS', 'Base Less File '+e, baseLess);
			});
		} else {
			notice.warn('BASELESS', 'Base Less File is not exists');
		}
	}
}



ProjConfig.prototype = {
	// 设置默认值
	'dataAPIStep': {},
	'dataAPI': function(){
		return false;
	},
	'baseLessCont': '',
	'alias': '',
	'HTMLData': {},
	'HTMLLinks': {},
	'sourceLink': {},
	'convertSource4HTML': function(cont){
		return cont;
	},
	'initCacheAndWatch': function(file, extname, uri, drGetCont){
		if (!Cache) Cache = mod.load('Cache');

		var projConf = this,
			cache = Cache(file, extname, this, drGetCont);
		this.cache[file] = cache;

		if (!this.watchFiles[file]) {
			if (extname == 'html') {
				this.addPageReloadWatch(file, function(){
					delete projConf.cacheTpl[file];
					delete projConf.cache[file];
				});
			} else if (extname == 'less' || extname == 'css') {
				this.addCssReloadWatch(file, uri.pathname);
			} else {
				this.addPageReloadWatch(file, function(){
					delete projConf.cache[file];
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


	'resetLessCont': function() {
		var self = this,
			baseLess = this.baseLessFile;
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
	'emit': function(eventStr, data){
		d2io.to(this.root).emit(eventStr, data);		// d2io.to 和 d2io.in 是相同的
	},


	'initHTMLConfig': function(fData) {
		if (!fData.title) fData.title = 'Unnamed File';
		if (!fData.data) fData.data = {};
		fData.data.title = fData.title;

		fData.data.block = fData.block && fData.block.trim() ? new RegExp('\\b('+fData.block.trim().replace(/\s+/g, '|')+')\\b') : false;		// 在data中将block转化为正则

		fData.projConf = this;

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
		var data, fDatas = this.HTMLData[file];
		if (fDatas) {
			if (outFile) {
				data = fDatas[outFile];
				if (data) return data;
			}
		}

		notice.warn('Serv', 'block not exisist');
		return false;
	},
	'getSitePath': function(port){
		if (this.alias) {
			return '//'+this.alias+'.'+_conf.Domain+':'+port+'/';
		} else {
			return '//'+_conf.Domain+':'+port+'/'+this.dirname+'/';
		}
	}
};




function removeProj(root){
	if (_projs[root]) {
		util.eachObject(_projs[root].watchFiles, function(i, v){
			v.close();
		});
		delete _projs[root];
	}
}


/* 读取配置文件 */
function reloadProjConfig(dirname, isInit){
	var root = _conf.DocumentRoot+dirname+'/',
		mainFile = root + _conf.MainConfigFile,
		mainPath, mainConf,
		myFile = root + _conf.ProjConfigFile,
		myConf,
		projConf, watchFunc,
		MinCssName;

	if (isInit) {
		watchFunc = function(file){
			watchFileCh(file, function(){
				removeProj(projConf.root);
				if (fs.existsSync(mainFile)) {
					var rs = reloadProjConfig(dirname);
					if (rs) {
						projConf = rs;
						notice.log('ProjConf', 'Updataed Content', file);
					}
					projConf.emit('pageReload');
				} else {
					notice.warn('ProjConf', 'Proj Main Config File has removed', mainFile);
				}
			}, function(e){
				notice.warn('ProjConf', 'config File '+e, file);
			});
		};
	}


	// 读取主配置文件
	try {
		delete require.cache[require.resolve(mainFile)];
		mainConf = require(mainFile);
		if (isInit) watchFunc(mainFile);
		if (mainConf.MinCssName) {
			MinCssName = typeof(MinCssName) == 'object' ? MinCssName : {};
		}


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
					notice.warn('ProjConf', 'extra conf file do not exists', file);
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
								notice.warn('ProjConf', 'Do not insertCan not override "header" or "footer" in HTML Config', file);
								return;
							}
							util.eachObject(outConf, function(path, data){
								if (HTML[file][path]) {
									notice.warn('ProjConf', 'Can not override "'+path+'" in HTML Config', file);
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


				// 合并MinCssName
				if (conf.MinCssName) {
					util.eachObject(conf.MinCssName, function(i, v){
						if (MinCssName[i]) notice.warn('ProjConf', 'MinCssName('+i+') has inited');
						MinCssName[i] = v;
					});
				}
			});
		}


		projConf = new ProjConfig(dirname, mainConf);

		// 注册
		_projs[projConf.root] = projConf;
		if (isInit) notice.log('ProjConf', 'read conf file success', mainFile);

		return projConf;

	} catch(e) {
		notice.warn('ProjConf', e);
		return false;
	}
}





function clearCache(){
	defaultProj.cache = {};
	util.eachObject(_projs, function(i, v){
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
				if (exists) reloadProjConfig(v, true);
			});
		}
	});
});




var defaultProj = new ProjConfig(_conf.DocumentRoot, '', {}),
	_domainSplit = '.'+_conf.Domain.toLowerCase();


module.exports = {
	'projs': _projs,
	'alias': _alias,
	'defaultProj': defaultProj,		// 新建一个空白项目，用于存放没有项目遮盖的文件
	// 注意：直接使用new 生成的对象，不会在_projs中注册
	'find': function(file){
		var conf;
		util.eachObject(_projs, function(i){
			if (!file.indexOf(i)) {
				conf = _projs[i];
				return false;
			}
		});

		return conf;
	},
	'DRS': function(host){					// Document Root System  来自于dns
		host = host.toLowerCase().split(_domainSplit);	// 由于端口绑定，所以不用太计较是否真的切分成这样，我们只关注host[0]获取到的值
		// 注意：域名浏览器会自动转化为小写，所以不需要执行toLowerCase方法
		if (host.length) host = _alias[host[0]];
		return host || _conf.DocumentRoot;
	},
	'reload': reloadProjConfig,
	'clearCache': clearCache,
	'removeProj': removeProj
};