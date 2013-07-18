var fs = require('fs'),
	path = require('path'),
	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf;



/* 读取配置文件 */
module.exports = function(dirname, ProjConfigClass){
	var root = _conf.DocumentRoot+dirname+'/',
		mainFile = root + _conf.MainConfigFile,
		myFile = root + _conf.ProjConfigFile,
		mainPath, mainConf, myConf, projConf,
		MinCssName, HTML, fileMap,			// 需要合并的资源
		confFiles = [];


	// 读取主配置文件
	try {
		delete require.cache[require.resolve(mainFile)];
		mainConf = require(mainFile);
		mainConf.confFiles = confFiles;
		confFiles.push(mainFile);


		// 初始化资源变量
		MinCssName = mainConf.MinCssName;
		if (MinCssName) {
			mainConf.MinCssName = MinCssName = typeof(MinCssName) == 'object' ? MinCssName : {};
		}
		if (mainConf.HTML) {
			HTML = mainConf.HTML;
		} else {
			HTML = mainConf.HTML = {};
		}
		if (mainConf.fileMap) {
			fileMap = mainConf.fileMap;
		} else {
			fileMap = mainConf.fileMap = {};
		}


		// 读取个人配置文件
		if (fs.existsSync(myFile)) {
			delete require.cache[require.resolve(myFile)];
			myConf = require(myFile);
			confFiles.push(myFile);

			if (myConf.sync) mainConf.sync = myConf.sync;
			if (myConf.alias) mainConf.alias = myConf.alias;
			// if (myConf.dataAPI) mainConf.dataAPI = myConf.dataAPI;
		}

		// 读取附加配置文件
		if (mainConf.extra) {
			mainPath = path.dirname(mainFile)+'/';

			mainConf.extra.map(function(v){
				var file = mainPath+v,
					conf;

				if (!fs.existsSync(file)) {
					notice.warn('ProjConf', 'extra conf file do not exists', file);
					return;
				}

				delete require.cache[require.resolve(file)];
				conf = require(file);
				confFiles.push(file);


				// 合并HTML配置
				if (conf.HTML) {
					util.eachObject(conf.HTML, function(file, outConf){
						if (HTML[file]) {
							if (outConf['footer'] || outConf['header']) {
								notice.warn('ProjConf', 'Do not override "header" or "footer" in HTML Config', file);
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
					util.eachObject(conf.fileMap, function(file, srcArr){
						if (fileMap[file]) {
							fileMap[file] = fileMap[file].concat(srcArr);
						} else {
							fileMap[file] = srcArr;
						}
					});
				}


				// 合并MinCssName
				if (MinCssName && conf.MinCssName) {
					util.eachObject(conf.MinCssName, function(i, v){
						if (MinCssName[i]) notice.warn('ProjConf', 'MinCssName('+i+') has inited');
						MinCssName[i] = v;
					});
				}
			});
		}

	} catch(err) {
		notice.warn('Splice ProjConf', err);
		return false;
	}


	projConf = new ProjConfigClass(dirname, mainConf);

	notice.log('ProjConf', 'Read conf('+dirname+') file success');
	return projConf;
};

