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
		confFiles = [];


	// 读取主配置文件
	try {
		delete require.cache[require.resolve(mainFile)];
		mainConf = require(mainFile);
		mainConf.confFiles = confFiles;
		confFiles.push(mainFile);


		// 初始化资源变量
		var MinCssName = mainConf.MinCssName,
			HTML = {},
			fileMap = mainConf.fileMap;		// 需要合并的资源
		
		if (MinCssName) MinCssName = mainConf.MinCssName = typeof(MinCssName) == 'object' ? MinCssName : {};
		if (!fileMap) fileMap = mainConf.fileMap = {};
		if (mainConf.HTML) concatHTMLConf(mainConf.HTML, mainConf.defaultHeader, mainConf.defaultFooter, HTML);
		mainConf.HTML = HTML;

		delete mainConf.sync;


		// 读取个人配置文件
		if (fs.existsSync(myFile)) {
			delete require.cache[require.resolve(myFile)];
			myConf = require(myFile);
			confFiles.push(myFile);

			if (myConf.sync) mainConf.sync = myConf.sync;
			if (myConf.alias) mainConf.alias = myConf.alias;
		}

		// 读取附加配置文件
		if (mainConf.extra) {
			mainPath = path.dirname(mainFile)+'/';

			mainConf.extra.map(function(v){
				var file = mainPath+v,
					conf;

				if (!util.fileExists(file)) throw new reloadError('extra conf file do not exists', file);

				delete require.cache[require.resolve(file)];
				conf = require(file);
				confFiles.push(file);


				// 合并HTML配置
				if (conf.HTML) concatHTMLConf(conf.HTML, mainConf.defaultHeader, mainConf.defaultFooter, HTML);

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
						if (MinCssName[i]) throw new reloadError('MinCssName('+i+') has inited', file);
						MinCssName[i] = v;
					});
				}
			});
		}


	} catch(err) {
		notice.warn('Splice ProjConf', err, err.targetFile);
		return false;
	}


	projConf = new ProjConfigClass(dirname, mainConf);

	notice.log('ProjConf', 'Read conf('+dirname+') file success');
	return projConf;
};





function concatHTMLConf(conf, defaultHeader, defaultFooter, RsConf){
	if ('header' in conf) {
		defaultHeader = conf.header;
		delete conf.header;
	}
	if ('footer' in conf) {
		defaultFooter = conf.footer;
		delete conf.footer;
	}

	util.eachObject(conf, function(file, outConf){
		var htmlConf = RsConf[file],
			defaultHeader2 = defaultHeader,
			defaultFooter2 = defaultFooter,
			extJS, extCSS;
		if ('header' in outConf) {
			defaultHeader2 = outConf.header;
			delete outConf.header;
		}
		if ('footer' in outConf) {
			defaultFooter2 = outConf.footer;
			delete outConf.footer;
		}
		if ('extJS' in outConf) {
			extJS = outConf.extJS;
			delete outConf.extJS;
		}
		if ('extCSS' in outConf) {
			extCSS = outConf.extCSS;
			delete outConf.extCSS;
		}
		util.eachObject(outConf, function(path, data){
			if (!('header' in data)) data.header = defaultHeader2;
			if (!('footer' in data)) data.footer = defaultFooter2;
			if (data.extJS && extJS) {
				data.extJS = data.extJS.concat(extJS);
			} else if (extJS) {
				data.extJS = extJS;
			}
			if (data.extCSS && extCSS) {
				data.extCSS = data.extCSS.concat(extCSS);
			} else if (extCSS) {
				data.extCSS = extCSS;
			}
		});

		if (htmlConf) {
			util.eachObject(outConf, function(path, data){
				if (htmlConf[path]) throw new reloadError('Can not override "'+path+'" in HTML Config', file);
				htmlConf[path] = data;
			});
		} else {
			RsConf[file] = outConf;
		}
	});
}



/**
 * 判断两个对象的变量是不是相同
 * 1. 判断两个是否都定义了
 * 2. 判断两个变量是否相同
 * 3. 如果两个变量值不同，再判断是否两个值都是负值
 * 4. 如果两个变量都存在，还要判断两个地址解析之后是否相同
 */
/*function equralParamInObject(name, obj1, obj2){
	if ((name in obj1) != (name in obj2)) return false;
	if (obj1[name] == obj2[name]) return true;
	if (!obj1[name] && !obj2[name]) return true;

	var confRoot = _conf.DocumentRoot+'xxxx/'+_conf.SourcePath;
	return util.parsePath(confRoot+obj1[name]) == util.parsePath(confRoot+obj2[name]);
}*/


function reloadError(message, file){
	Error.call(this, message);
	this.targetFile = file;
}

reloadError.prototype = new Error();
reloadError.prototype.constructor = reloadError;

