var fs = require('fs'),
	path = require('path'),
	mod = require('../../mod.js'),
	util = mod.util,
	notice = mod.notice,
	_conf = mod.conf;



/**
 * 读取配置文件内容
 * 涉及到读取拓展配置文件，所以会增加配置文件合并工作
 * 注：在合并配置过程中，fileMap和HTML的结构会发生一些改变
 * 
 * @param  {String}   dirname  项目文件夹名
 * @param  {Function} callback 读取成功之后的回调
 * @return {None}              无返回值
 */
module.exports = function(dirname, callback){
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
		var catalogRoot = root+(mainConf.catalog || ''),
			MinCssName = mainConf.MinCssName,
			HTML = {},
			fileMap = {};		// 需要合并的资源
		
		if (MinCssName) MinCssName = mainConf.MinCssName = typeof(MinCssName) == 'object' ? MinCssName : {};
		
		if (mainConf.fileMap) concatFileMapConf(mainConf.fileMap, fileMap, catalogRoot);
		if (mainConf.HTML) concatHTMLConf(mainConf.HTML, HTML, catalogRoot, mainConf.defaultHeader, mainConf.defaultFooter);
		mainConf.HTML = HTML;
		mainConf.fileMap = fileMap;


		// 读取个人配置文件
		if (fs.existsSync(myFile)) {
			delete require.cache[require.resolve(myFile)];
			myConf = require(myFile);
			confFiles.push(myFile);

			mainConf.sync = myConf.sync;
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
				if (conf.HTML) concatHTMLConf(conf.HTML, HTML, catalogRoot, mainConf.defaultHeader, mainConf.defaultFooter);

				// 合并文件映射配置
				if (conf.fileMap) concatFileMapConf(conf.fileMap, fileMap, catalogRoot);


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
		callback(false);
	}

	notice.log('ProjConf', 'Read conf('+dirname+') file success');
	callback(mainConf, dirname);
};



/**
 * 合并FileMap配置属性
 * @param  {JSON} conf          读取的原始配置信息
 * @param  {JSON} RsConf        经过处理之后保存的配置信息
 * @param  {String} catalogRoot 附加catalog之后的项目根目录
 * @return {None}               无返回值
 */
function concatFileMapConf(conf, RsConf, catalogRoot) {
	util.eachObject(conf, function(file, srcArr){
		file = util.parsePath(catalogRoot+file);
		if (RsConf[file]) {
			RsConf[file] = RsConf[file].concat(srcArr);
		} else {
			RsConf[file] = srcArr;
		}
	});
}


/**
 * 合并HTML配置属性
 * @param  {JSON} conf            读取的原始配置信息
 * @param  {JSON} RsConf          经过处理之后保存的配置信息
 * @param  {String} catalogRoot   附加catalog之后的项目根目录
 * @param  {String} defaultHeader 默认的头部文件地址
 * @param  {String} defaultFooter 默认的尾部文件地址
 * @return {None}                 无返回值
 */
function concatHTMLConf(conf, RsConf, catalogRoot, defaultHeader, defaultFooter){
	// 处理外层的header和footer
	if ('header' in conf) {
		defaultHeader = conf.header;
		delete conf.header;
	}
	if ('footer' in conf) {
		defaultFooter = conf.footer;
		delete conf.footer;
	}

	util.eachObject(conf, function(srcFile, outConf){
		// 处理源文件级的header和footer，同时合并extCSS、extJS
		var defaultHeader2 = defaultHeader,
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
		util.eachObject(outConf, function(file, data){
			// 获取最终的header和footer，同时合并extCSS、extJS
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

			// 处理文件目录信息
			data.localFile = file;
			data.srcFile = srcFile;
			file = util.parsePath(catalogRoot+file);
			if (RsConf[file]) throw new reloadError('Can not override "'+file+'" in HTML Config', srcFile);
			RsConf[file] = data;
		});
	});
}


/**
 * 抛出错误信息
 * @param  {String} message 错误信息
 * @param  {String} file    发生错误的文件路径
 */
function reloadError(message, file){
	Error.call(this, message);
	this.targetFile = file;
}

reloadError.prototype = new Error();
reloadError.prototype.constructor = reloadError;

