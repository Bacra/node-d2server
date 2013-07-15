var fs = require('fs'),
	path = require('path'),
	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf,
	watchFileCh = mod.load('watchFileCh'),

	ProjConfigData = require('./ProjConfigData.js'),
	_projs = ProjConfigData.projs,


	// 新建一个空白项目，用于存放没有项目遮盖的文件
	// 注意：直接使用new 生成的对象，不会在_projs中注册
	defaultProj = new ProjConfigData.ProjConfigClass('', {});


ProjConfigData.defaultProj = defaultProj;
ProjConfigData.find = function(file){
	var conf;
	util.eachObject(_projs, function(i){
		if (!file.indexOf(i)) {
			conf = _projs[i];
			return false;
		}
	});

	return conf;
};
ProjConfigData.reload = reloadProjConfig;
ProjConfigData.clearCache = clearCache;
ProjConfigData.removeProj = removeProj;


module.exports = ProjConfigData;





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


function removeProj(root){
	var projConf = _projs[root];
	
	if (projConf) {
		util.eachObject(projConf.watchFiles, function(i, v){
			v.close();
		});
		if (projConf.alias) delete _alias[projConf.alias];
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


		projConf = new ProjConfigData.ProjConfigClass(dirname, mainConf);

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


