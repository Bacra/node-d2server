var _projs = {},
	_projDirname = {},
	_disableProjs = {},
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
	proj404 = mod.load('proj404'),
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


	this.sync = cont.sync;			// 同步目录
	this.catalog = cont.catalog;	// url追加地址

	// 线上资源
	if (cont.hostname) {
		this.hostname = cont.hostname.toLowerCase();
		DRS.addHostname(this.hostname, root);
	}

	// 二级域名
	if (cont.alias) {
		this.alias = cont.alias.toLowerCase();
		DRS.addAlias(this.alias, root);
	}

	if (cont.MinCssName) {
		var MinCssNameKeys = Object.keys(cont.MinCssName);
		if (MinCssNameKeys.length) {
			this.MinCssName = cont.MinCssName;
			this.MinCssNameKeys = MinCssNameKeys;
			this.MinCssNameKeyStr = MinCssNameKeys.join('|');			// 为RegExp做缓存处理
		}
	}




	var projConf = this,
		sourceMap = this.sourceMap,
		fileIndex = 0;


	// 给配置文件添加文件监听
	if (cont.confFiles) {
		var watchConf = this.watchConf;
		this.confFiles = cont.confFiles;
		cont.confFiles.forEach(function(confFile){
			if(!watchConf[confFile]) watchConf[confFile] = watchConfCh(confFile, projConf);
		});
	}




	// 数据文件 判断和处理方法
	// 注意：配置文件中的参数和projConf对象中的方法参数，有所不同
	if (cont.dataAPI) this.dataAPI = dataAPI(cont.dataAPI, this);



	if (cont.HTML) {
		var HTMLData = {},
			HTMLLinks = {},		// 用于d2fs.js 404等 生成连接地址
			catalog = cont.catalog || '';

		util.eachObject(cont.HTML, function(srcFile, oFiles){
			srcFile = util.parsePath(root+_conf.SourcePath+srcFile);
			var fDatas = {};


			util.eachObject(oFiles, function(href, fileConf){
				var outFile = util.parsePath(root+href);
				sourceMap[outFile] = srcFile;

				// 处理配置的参数
				href = catalog+href;
				projConf.initHTMLConfig(fileConf);
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
				fileType = util.getExtname(oFile).toLowerCase(),
				getConvertStrFunc = mimeTag[fileType],
				mySourceLink = [];

			if (!getConvertStrFunc) getConvertStrFunc = mimeTag.def;

			
			convertConf.push((mimeTag.getReg[fileType] || mimeTag.getReg.def)(oFile), srcFiles.map(function(v){
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
				projConf.reloadBaseLess();
			}, function(e){
				projConf.baseLessCont = '';
				notice.warn('BASELESS', 'Base Less File '+e, baseLess);
			});
		} else {
			notice.warn('BASELESS', 'Base Less File is not exists');
		}
	}

	// 注册
	_projs[root] = this;
	_projDirname[dirname] = this;
}



ProjConfigClass.prototype = {
	// 设置默认值
	'dataAPIStep': {},
	'dataAPI': function(uri, res, req, resErrorCall){
		resErrorCall(404);
	},
	'baseLessCont': '',
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
		var projConf = this;
		this.watchFiles[file] =  watchFileCh(file, function(){
			delete projConf.cache[file];
			projConf.emit('cssReload', {
				'pathname': pathname,
				'filename': path.basename(pathname)
			});
		});
	},
	'addPageReloadWatch': function(file, callback){
		var projConf = this;
		this.watchFiles[file] = watchFileCh(file, function(){
			callback();
			projConf.emit('pageReload');
		});
	},


	'reloadBaseLess': function() {
		var projConf = this,
			baseLess = this.baseLessFile;
		fs.readFile(baseLess, function(err, buf){
			if (err) {
				notice.warn('BASELESS', err, baseLess);
			} else {
				projConf.baseLessCont = buf.toString();

				var hasUpdate = false;
				util.eachObject(projConf.cache, function(i, v){
					if (v.extname == 'less') {
						hasUpdate = true;
						delete projConf.cache[i];
					}
				});

				if (hasUpdate) projConf.emit('pageReload');

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
		fData.data.extJS = fData.extJS ? fData.extJS.map(function(path){return mimeTag.js(path);}).join('\n') : '';
		fData.data.extCSS = fData.extCSS ? fData.extCSS.map(function(path){return mimeTag.css(path);}).join('\n') : '';

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
		this.disable();
	},
	'clear': function(){
		this.cache = {};
		this.cacheTpl = {};
	},
	'disable': function(){
		if (_disableProjs[this.root]) return;
		_disableProjs[this.root] = this;

		delete _projs[this.root];
		delete _projDirname[this.dirname];
		if (this.alias) delete DRS.alias[this.alias];
		if (this.hostname) delete DRS.hostname[this.hostname];
	},
	'enable': function(){
		if (!_disableProjs[this.root]) return;
		delete _disableProjs[this.root];

		_projs[this.root] = this;
		_projDirname[this.dirname] = this;
		if (this.hostname) DRS.addHostname(this.hostname, this.root);
		if (this.alias) DRS.addAlias(this.alias, this.root);
	}
};




function watchConfCh(file, projConf){
	var mainFile = projConf.root + _conf.MainConfigFile;

	return watchFileCh(file, function(){
		if (fs.existsSync(mainFile)) {
			reloadProjConfig(projConf.dirname, function(mainConf, dirname){
				if (mainConf) {
					projConf.destory();
					projConf = new ProjConfigClass(dirname, mainConf);
				} else {
					projConf.disable();
				}
			});
			projConf.emit('pageReload');
		} else {
			notice.warn('ProjConf', 'Proj Main Config File has removed', mainFile);
		}
	}, function(e){
		notice.warn('ProjConf', 'config File '+e, file);
	});
}


// 空白项目，用于存放没有项目遮盖的文件
var defaultProj = new ProjConfigClass('', {'alias': 'www', 'name': 'DocumentRoot Project'});
defaultProj.destory();

module.exports = {
	'defaultProj': defaultProj,
	'projs': _projs,
	'disableProjs': _disableProjs,
	'projDirname': _projDirname,
	'find': function(file){
		for(var i in _projs) {
			if (!file.indexOf(i)) return _projs[i];
		}
	},
	'clearCache': clearCache
};







// 每xxx分钟，清除缓存一次
setInterval(clearCache, _conf.AutoClearCache);

// 初始化项目属性
if (fs.existsSync(_conf.DocumentRoot)) util.mkdirs(_conf.DocumentRoot);

fs.readdir(_conf.DocumentRoot, function(err, files) {
	if (err) {
		notice.error('SYS', err, _conf.DocumentRoot);
		return;
	}
	files.forEach(function(dirname){
		if (dirname != '.'&& dirname != '..') initProjConfig(dirname);
	});
});


// 监视整个目录，动态获取项目配置信息
// 仅仅针对初始化，其他导致文件夹改变的操作，不做处理
var _watchDirnameTimer = {};
fs.watch(_conf.DocumentRoot, function(e, dirname){
	if (_projDirname[dirname]) return;
	if (_watchDirnameTimer[dirname]) clearTimeout(_watchDirnameTimer[dirname]);

	_watchDirnameTimer[dirname] = setTimeout(function(){
		_watchDirnameTimer[dirname] = null;
		initProjConfig(dirname);
	}, 1000);
});


// 附加了配置文件的存在判断
function initProjConfig(dirname){
	var file = _conf.DocumentRoot +dirname+'/'+_conf.MainConfigFile;
	fs.exists(file, function(exists){
		if (exists) reloadProjConfig(dirname, function(mainConf){
			if (mainConf) new ProjConfigClass(dirname, mainConf);
		});
	});
}


function clearCache(){
	defaultProj.clear();
	util.eachObject(_projs, function(i, v){
		v.clear();
	});
}

