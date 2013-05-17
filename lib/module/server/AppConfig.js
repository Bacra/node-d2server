var _apps = {},
	_alias = {},
	path = require('path'),
	fs = require('fs'),
	util = require('../../util.js'),
	notice = require('../../notice.js'),
	watchFileCh = require('../../watchFileCh.js'),
	_conf = require('../../conf.js');

var getConvertStr = {
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
			return util.parsePath(root+v);
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

		this.fileWatch[this.baseLess] = watchFileCh(baseLess, function(){
			notice.log('BASELESS', 'updata cont', baseLess);
			self.readLessCont(baseLess);
		}, function(e){
			notice.warn('BASELESS', 'Base Less File '+e, baseLess);
		}, function(err){
			notice.error('BASELESS', err, baseLess);
		});
	}
}



AppConfig.prototype = {
	// 设置默认值
	'dataFiles': [],
	'baseLessCont': '',
	'sourceMap': {},
	'convertSource4HTML': function(cont){
		return cont;
	},


	'readLessCont': function(baseLess) {
		var self = this;
		fs.readFile(baseLess, function(err, buf){
			if (err) {
				console.error('BASELESS', err, baseLess);
			} else {
				self.baseLessCont = buf.toString();

				// 需要刷新less的缓存
				util.eachObject(self.cacheCont, function(i, v){
					if (v.extname == 'less') v.destory();
				});
				util.eachObject(self.cacheTemp, function(i, v){
					if (v.extname == 'less') v.destory();
				});
			}
		});
	},
	'destory': function(){
		util.eachObject(this.fileWatch, function(i, v){
			v.close();
		});
		delete _apps[this.root];
	}
};




module.exports = {
	'alias': _alias,
	'apps': _apps,
	'add': function(root, cont){
		return new AppConfig(root, cont);
	},
	'init': function(root){
		var file = root + _conf.AppConfigFile,
			appconf = new AppConfig(root, require(file));

		watchFileCh(file, function(){
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
};