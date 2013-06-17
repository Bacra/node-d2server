var _apps = {},
	_alias = {},
	path = require('path'),
	fs = require('fs'),
	util = require('./util.js'),
	notice = require('./notice.js'),
	watchFileCh = require('./watchfilechange.js'),
	d2io = require('./apps/i2serv.js').io.of('/d2'),
	Cache = require('./cache.js'),
	_conf = require('../conf.js'),
	mime = require('../mime.js'),
	_domainSplit = '.'+_conf.Domain.toLowerCase(),
	_servDocRoot = _conf.DocumentRoot,

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




function AppConfig(root, cont) {
	this.root = root;

	this.cache = {};
	this.cacheTpl = {};			// 缓存模板解析之后的函数  不使用ejs默认的缓存函数（变量冲突，更方便地进行管理）

	this.watchFiles = {};		// 文件监视
	this.sourceMap = {};		// 对应的多个文件 每个文件又要虚拟出一个目录和名字


	if (cont.MinCssName) this.MinCssName = cont.MinCssName;
	if (cont.sync) this.sync = cont.sync+'/';

	var self = this,
		sourceMap = this.sourceMap,
		fileIndex = 0,
		urlPrefix;

	// 数据文件 判断和处理方法
	// 注意：配置文件中的参数和appConf对象中的方法参数，有所不同
	if (cont.dataAPI) {

		this.dataAPIStep = {};		// 用于保存数据文件step数据
		this.dataAPI = function(uri, res, req){
			return cont.dataAPI(uri, {
				'res': res,
				'req': req,
				'root': root,
				'query': Object.create(uri.query),
				'isPost': function(){
					return req.method == "POST";
				},
				'require': function(path){
					return require(path);
				},
				'getDateFile': function(filename, extStr){
					if (!filename) {
						filename = uri.pathname.substring(1).replace(/[\/\\]/g, '_') + '/' + util.sortAndStringifyJSON(this.query);
						// 是否是post提交
						if (req.method == "POST") filename += '&&_post';
					}
					if (extStr) filename += extStr;

					this.dataFile = root + _conf.DynamicDataPath + filename;

					return this.dataFile;
				},
				'getFileExtname': function(){
					var file = this.dataFile || this.getDateFile();
					if (fs.existsSync(file+'.json')) return 'json';
					if (fs.existsSync(file+'.js')) return 'js';
					if (fs.existsSync(file+'.html')) return 'html';
					if (fs.existsSync(file+'.xml')) return 'xml';
					return '';

				},
				'readDateFile': function(file){
					if (!file) file = this.dataFile || this.getDateFile();
					try {
						return fs.readFileSync(file);
					} catch(err) {
						util.writeFile(file, '');
						notice.log('dataAPI', 'data file create', file);
						return undefined;
					}
				},
				'sendDate': function(wait, step){
					var extStr;
					if (step > 0) {
						var stepDate = self.dataAPIStep[file];

						extStr = '&&_step'+(self.dataAPIStep[file] = !stepDate || step < ++stepDate ? 1 : stepDate);
					}

					var file = this.getDateFile(this.dataFile, extStr);
					var extname = this.getFileExtname();
					if (extname) file += '.'+extname;

					var cont = this.readDateFile(file),
						rs = cont && cont.length;

					if (rs) {
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
			});
		};
	}

	// 二级域名
	if (cont.alias) {
		urlPrefix = 'http://'+cont.alias+'.'+_conf.Domain+':'+_conf.DevServPort+'/';
		_alias[cont.alias.toLowerCase()] = root;
	} else {
		var root2 = root.split(/[\/\\]+/);
		urlPrefix = 'http://'+_conf.Domain+':'+_conf.DevServPort+'/'+(root2.pop() || root2.pop())+'/';
	}


	// HTML页面配置信息处理
	this.defaultHeader = cont.defaultHeader || '';
	this.defaultFooter = cont.defaultFooter || '';

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
				var outFile = util.parsePath(root+i),
					redirectFile = path.dirname(outFile)+'/$.'+path.basename(outFile);
				sourceMap[outFile] = srcFile;

				// 写入文件跳转用的临时HTML
				if(!fs.existsSync(redirectFile)) util.writeFile(redirectFile, '<script type="text/javascript">window.location.href="'+urlPrefix+i+'"</script>');

				// 处理配置的参数
				// fileConf = Object.create(fileConf);
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
		notice.log('BASELESS', 'read file', baseLess);

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
				notice.error('BASELESS', err, baseLess);
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




function initAppConfig(root){
	var file = root + _conf.AppConfigFile,
		appconf = new AppConfig(root, require(file));

	watchFileCh(file, function(){
		appconf.destory();
		delete require.cache[require.resolve(file)];
		appconf = new AppConfig(root, require(file));
		appconf.emit('pageReload');
		notice.log('AppConf', 'Updataed Content', file);
	}, function(e){
		notice.warn('AppConf', 'config file '+e, file);
	});
}









// 每xxx分钟，清除缓存一次
setInterval(function(){
	util.eachObject(_apps, function(i, v){
		v.cache = {};
	});
}, _conf.AutoClearCache);


// 初始化项目属性
fs.readdir(_conf.DocumentRoot, function(err, files) {
	if (err) throw new Error('Serv Document not exists');
	files.forEach(function(v){
		if (v != '.'&& v != '..') {
			var file = _conf.DocumentRoot +v+'/'+_conf.AppConfigFile;
			fs.exists(file, function(exists){
				if (exists) initAppConfig(util.parsePath(_conf.DocumentRoot +v+'/'));
			});
		}
	});
});





module.exports = {
	'defaultApp': new AppConfig(_servDocRoot, {}),		// 新建一个空白项目，用于存放没有项目遮盖的文件
	/*'alias': _alias,
	'apps': _apps,
	'add': function(root, cont){
		return new AppConfig(root, cont);
	},
	'each': function(callback){
		util.eachObject(_apps, callback);
	},*/
	'find': function(file){
		var conf;
		util.eachObject(_apps, function(i){
			if (i != _servDocRoot && !file.indexOf(i)) {		// 需要排除defaultApp的干扰
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
		return host || _servDocRoot;
	},
	'init': initAppConfig
};