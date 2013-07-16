var _projs = {},
	path = require('path'),
	fs = require('fs'),
	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
	DRS = mod.load('DRS'),
	reloadProjConfig = require('./reloadProjConfig.js'),
	watchFileCh = mod.load('watchFileCh'),
	dataAPI = mod.load('dataAPI'),
	d2io = mod.load('i2serv').io.of('/d2'),

	mimeTag = mod.load('mimeTag'),
	Cache;			// Cache会调用许多组建，导致这些组建，都不能使用ProjConfig


setTimeout(function(){
	Cache = mod.load('Cache');
}, 1);




function ProjConfigClass(dirname, cont) {
	var root = util.parsePath(_conf.DocumentRoot+dirname+'/');
	this.root = root;				// root作为proj的key  dirname不能，因为root为绝对路径，相比于dirname更加不容易判断错误
	this.dirname = dirname;
	this.name = cont.name || 'Unnamed Project';


	this.cache = {};
	this.cacheTpl = {};			// 缓存模板解析之后的函数  不使用ejs默认的缓存函数（变量冲突，更方便地进行管理）


	this.watchFiles = {};		// 文件监视
	this.sourceMap = {};		// 对应的多个文件 每个文件又要虚拟出一个目录和名字
	this.watchConf = {};		// 配置文件监视

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

	// 给配置文件添加文件监听
	if (cont.confFiles) {
		var watchConf = this.watchConf;
		cont.confFiles.forEach(function(confFile){
			if(!watchConf[confFile]) watchConf[confFile] = watchConfCh(confFile, self);
		});
	}


	// 数据文件 判断和处理方法
	// 注意：配置文件中的参数和projConf对象中的方法参数，有所不同
	if (cont.dataAPI) {
		this.dataAPIStep = {};		// 用于保存数据文件step数据
		this.dataAPI = dataAPI(cont.dataAPI, this);
	}

	// 二级域名
	this.alias = (cont.alias || dirname).toLowerCase();
	DRS.addAlias(this.alias, root);
	

	// 线上资源
	if (cont.hostname) {
		this.hostname = cont.hostname.toLowerCase();
		DRS.addHostname(this.hostname, root);
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
			this.reloadBaseLess();

			this.watchFiles[baseLess] = watchFileCh(baseLess, function(){
				notice.log('BASELESS', 'update cont', baseLess);
				self.reloadBaseLess();
			}, function(e){
				self.baseLessCont = '';
				notice.warn('BASELESS', 'Base Less File '+e, baseLess);
			});
		} else {
			notice.warn('BASELESS', 'Base Less File is not exists');
		}
	}

	// 注册
	_projs[root] = this;
}



ProjConfigClass.prototype = {
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


	'reloadBaseLess': function() {
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
	},
	'destory': function(){
		util.eachObject(this.watchFiles, function(i, v){
			v.close();
		});
		util.eachObject(this.watchConf, function(i, v){
			v.close();
		});
		delete _projs[this.root];
	}
};




function watchConfCh(file, projConf){
	return watchFileCh(file, function(){
		projConf.destory();
		if (fs.existsSync(mainFile)) {
			var rs = reloadProjConfig(dirname, ProjConfigClass);
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
}


// 空白项目，用于存放没有项目遮盖的文件
var defaultProj = new ProjConfigClass('', {'alias': 'www'});

module.exports = {
	'defaultProj': defaultProj,
	'projs': _projs,
	'find': function(file){
		for(var i in _projs) {
			if (!file.indexOf(i) && _projs[i].dirname) return _projs[i];		// _projs[i].dirname 条件是为了排除默认项目
		}
	},
	'reload': function(dirname){
		return reloadProjConfig(dirname, ProjConfigClass);
	},
	'clearCache': clearCache
};







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
				if (exists) reloadProjConfig(v, ProjConfigClass);
			});
		}
	});
});

function clearCache(){
	util.eachObject(_projs, function(i, v){
		v.cache = {};
	});
}

