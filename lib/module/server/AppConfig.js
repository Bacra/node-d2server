var _apps = {},
	_alias = {},
	path = require('path'),
	fs = require('fs'),
	util = require('../../util.js'),
	notice = require('../../notice.js'),
	watchFileCh = require('../../watchFileCh.js'),
	d2io = require('../initI2serv.js').io.of('/d2'),
	Cache = require('./cache.js'),
	_conf = require('../../conf.js'),
	_servDocRoot = _conf.DocumentRoot,

	_aliasReg = /^([^\.]+)\./,

	getConvertStr = {
		'js': function(path){
			return '<script type="text/javascript" src="'+path+'"></script>';
		},
		'css': function(path){
			return '<link rel="stylesheet" type="text/css" href="'+path+'" />';
		}
	},
	getConvertReg = {
		'js': function(path) {
			return new RegExp('<script [^>]*src="'+util.getRegExpUnicode(path)+'"[^>]*><\/script>', 'i');
		},
		'css': function(path) {
			return new RegExp('<link [^>]*href="'+util.getRegExpUnicode(path)+'"[^>]*>', 'i');
		}
	};




function AppConfig(root, cont) {
	this.root = root;

	this.cache = {};
	this.cacheTpl = {};			// 缓存模板解析之后的函数  不使用ejs默认的缓存函数（变量冲突，更方便地进行管理）

	this.watchFiles = {};		// 文件监视
	this.sourceMap = {};		// 对应的多个文件 每个文件又要虚拟出一个目录和名字

	var self = this,
		sourceMap = this.sourceMap,
		data;

	// 数据文件 判断和处理方法
	// 注意：配置文件中的参数和appConf对象中的方法参数，有所不同
	if (cont.dataAPI) {
		this.dataAPI = function(req, res, uri){
			return cont.dataAPI(req, uri, function(callback){
				var dataAPIutil = Object.create(util);
				dataAPIutil.appConf = self;
				dataAPIutil.servConf = Object.create(_conf);
				dataAPIutil.uri = uri;
				dataAPIutil.getDateFile = function(filename){
					if (!filename) {
						filename = uri.pathname.replace(/[\/\\]/g, '_') + '/' +	dataAPIutil.sortAndStringifyJSON(uri.query);
						// 是否是post提交
						if (false) filename += '&&_post';
					}

					var dataFile = self.docRoot + _conf.DynamicDataPath + filename;

					this.dataFile = dataFile;
					return dataFile;
				};
				dataAPIutil.readDateFile =  function(file){
					if (!file) file = this.dataFile || this.getDateFile();
					try {
						return fs.readFileSync(file);
					} catch(err) {
						util.writeFile(file, '');
						return '';
					}
				};

				callback(res, dataAPIutil);
			});
		};
	}

	// 二级域名
	if (cont.alias) _alias[cont.alias.toLowerCase()] = root;



	// HTML页面配置信息处理
	if (cont.HTML) {
		data = {};
		util.eachObject(cont.HTML, function(srcFile, ofiles){
			srcFile = root+_conf.SourcePath+srcFile;			// 不需要转化地址，这个地址可控
			var blocks = {};

			util.eachObject(ofiles, function(i, v){
				sourceMap[util.parsePath(root+i)] = srcFile;
				blocks[v.omit] = v.data;
			});

			data[srcFile] = blocks;
		});

		this.HTML = cont.HTML;
	}


	// 文件映射
	if (cont.fileMap) {
		var fileMap = [],			// html中一个文件对应多个文件（转化之后，变成虚拟文件名）
			fileIndex = 0;
		util.eachObject(cont.fileMap, function(ofile, srcfiles){
			var basePath = path.dirname(ofile)+'/',
				baseExtname = path.extname(ofile).substring(1).toLowerCase(),
				getConvertStrFunc = getConvertStr[baseExtname];
			
			fileMap.push(getConvertReg[baseExtname](ofile), srcfiles.map(function(v){
				var extname = path.extname(v),
					virtualFile = basePath+path.basename(v, extname)+'.m'+(fileIndex++)+extname;

				sourceMap[util.parsePath(root+virtualFile)] = util.parsePath(root+_conf.SourcePath+v);
				return getConvertStrFunc(virtualFile);
			}).join('\n'));
		});

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

		this.watchFiles[this.baseLess] = watchFileCh(baseLess, function(){
			notice.log('BASELESS', 'updata cont', baseLess);
			self.readLessCont(baseLess);
		}, function(e){
			notice.warn('BASELESS', 'Base Less File '+e, baseLess);
		}, function(err){
			notice.error('BASELESS', err, baseLess);
		});
	}

	this.ioRoom = d2io.in(root);

	// 注册
	_apps[root] = this;
}



AppConfig.prototype = {
	// 设置默认值
	'dataAPI': function(){
		return false;
	},
	'baseLessCont': '',
	'HTML': {},
	'data': {},
	'convertSource4HTML': function(cont){
		return cont;
	},
	'addCache': function(file, extname){
		var cache = this.cache[file] = Cache(file, extname, this);
		return cache;
	},
	'addCssReloadWatch': function(file, pathname){
		var self = this;
		this.watchFiles[file] =  watchFileCh(file, function(){
			delete self.cache[file];
			self.ioRoom.emit('cssReload', {
				'pathname': pathname,
				'filename': path.basename(pathname)
			});
		});
	},
	'addPageReloadWatch': function(file, callback){
		var self = this;
		this.watchFiles[file] = watchFileCh(file, function(){
			callback();
			self.ioRoom.emit('pageReload');
		});
	},


	'readLessCont': function(baseLess) {
		var self = this;
		fs.readFile(baseLess, function(err, buf){
			if (err) {
				console.error('BASELESS', err, baseLess);
			} else {
				self.baseLessCont = buf.toString();

				util.eachObject(self.cache, function(i, v){
					if (v.extname == 'less') v.destory();
				});
			}
		});
	},
	'destory': function(){
		delete _apps[this.root];
		util.eachObject(this.watchFiles, function(i, v){
			v.close();
		});
	}
};







// 每xxx分钟，清除缓存一次
setInterval(function(){
	util.eachObject(_apps, function(i, v){
		v.cache = {};
	});
}, _conf.AutoClearCache);







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
		host = host.match(_aliasReg);
		if (host) host = _alias[host[1].toLowerCase()];
		return host || _servDocRoot;
	},
	'init': function(root){
		var file = root + _conf.AppConfigFile,
			appconf = new AppConfig(root, require(file));

		watchFileCh(file, function(){
			appconf.destory();
			delete require.cache[require.resolve(file)];
			appconf = new AppConfig(root, require(file));
			notice.log('APPConf', 'Updataed Content', file);
		}, function(e){
			notice.warn('APPConf', 'config file '+e, file);
		}, function(err){
			notice.error('APPConf', err, file);
		});
	}
};